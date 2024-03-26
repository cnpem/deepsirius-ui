import { zodResolver } from '@hookform/resolvers/zod';
import { FolderIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { env } from '~/env.mjs';
import { useStoreActions } from '~/hooks/use-store';
import { slurmPartitionOptions } from '~/lib/constants';
import { api } from '~/utils/api';

import { NautilusDialog } from '../nautilus';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface NewWorkspaceState {
  path?: string;
  name?: string;
  jobId?: string;
  jobIsPending?: boolean;
}

export function CreateNewWorkspace({ userRoute }: { userRoute: string }) {
  const router = useRouter();
  const { resetStore, setWorkspaceInfo } = useStoreActions();
  const [basePath, setBasePath] = useState(env.NEXT_PUBLIC_STORAGE_PATH);
  const [newWorkspaceState, setNewWorkspaceState] = useState<NewWorkspaceState>(
    {},
  );

  const createWorkspaceDbMutation = api.db.createWorkspace.useMutation({
    onSuccess: async (data) => {
      // finally, set the workspace path in the store if the db registration was successful
      resetStore();
      setWorkspaceInfo({
        name: data.name,
        path: data.path,
      });
      toast.success('New workspace registered in the database');
      await router.push(`${userRoute}/${data.name}`);
    },
    onError: () => {
      toast.error('Error registering workspace in the database');
      // the worksppace was created in the filesystem but not registered in the database
      // the user cant use the workspace until it is registered in the database
      // what to do here?
      throw new Error(
        'Error registering workspace in the database. Last state: ' +
          JSON.stringify(newWorkspaceState),
      );
    },
  });

  const submitNewWorkspaceMutation =
    api.deepsiriusJob.submitNewWorkspace.useMutation({
      onSuccess: (data) => {
        setNewWorkspaceState({
          ...newWorkspaceState,
          jobId: data.jobId,
        });
      },
      onError: () => {
        toast.error('Error creating workspace');
        setNewWorkspaceState({}); // reset the state?
      },
    });

  const { data: jobData } = api.job.checkStatus.useQuery(
    { jobId: newWorkspaceState.jobId as string },
    {
      refetchOnMount: false,
      enabled: !!newWorkspaceState.jobIsPending && !!newWorkspaceState.jobId,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );

  useEffect(() => {
    if (!newWorkspaceState.jobIsPending) return;
    if (!newWorkspaceState.path || !newWorkspaceState.name) return;
    if (jobData && jobData.jobStatus === 'COMPLETED') {
      // disable refetching until there is a new job
      createWorkspaceDbMutation.mutate({
        path: newWorkspaceState.path,
        name: newWorkspaceState.name,
      });
      setNewWorkspaceState({
        ...newWorkspaceState,
        jobIsPending: false,
      });
      toast.success('Workspace created in the storage');
      toast.info('Registering workspace in the database...');
    }
    if (jobData && jobData.jobStatus === 'FAILED') {
      toast.error('Error creating workspace');
      setNewWorkspaceState({});
    }
  }, [
    jobData,
    newWorkspaceState,
    setNewWorkspaceState,
    createWorkspaceDbMutation,
  ]);

  const handleSubmit = (data: Form) => {
    const fullPath = `${data.workspaceBasePath}${data.workspaceName}`;
    setNewWorkspaceState({
      path: fullPath,
      name: data.workspaceName,
      jobIsPending: true,
    });
    submitNewWorkspaceMutation.mutate({
      workspacePath: fullPath,
      partition: data.slurmPartition,
    });
    toast.info('Creating workspace...');
  };

  const basePathLsQuery = api.ssh.ls.useQuery(
    {
      path: basePath,
    },
    {
      enabled: !newWorkspaceState.path, // only fetch the base path data when the form is not submitted and wokspaceState is not set
    },
  );

  const schema = z
    .object({
      workspaceBasePath: z.string().endsWith('/'),
      workspaceName: z.string().min(1),
      slurmPartition: z.enum(slurmPartitionOptions),
    })
    .superRefine(({ workspaceName }, ctx) => {
      if (basePathLsQuery.error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Error fetching base path data: ' + basePathLsQuery.error.message,
          fatal: true,
          path: ['workspaceBasePath'],
        });
        return z.NEVER;
      }
      if (
        basePathLsQuery.data?.files.find((file) => file.name === workspaceName)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Workspace name already exists in the base directory :(',
          path: ['workspaceName'],
        });
      }
    });

  type Form = z.infer<typeof schema>;

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      workspaceBasePath: '',
      workspaceName: '',
    },
  });

  const onSubmit = () => {
    const data = form.getValues();
    handleSubmit(data);
  };

  const SubmitButton = () => {
    const { buttonText, buttonDisabled } = (() => {
      if (basePathLsQuery.isLoading) {
        return {
          buttonText: 'Fetching base path data...',
          buttonDisabled: true,
        };
      }
      if (newWorkspaceState.jobIsPending) {
        return {
          buttonText: `Creating workspace ${
            newWorkspaceState.jobId
              ? `Job ID: ${newWorkspaceState.jobId}`
              : '...'
          }`,
          buttonDisabled: true,
        };
      }
      return {
        buttonText: 'Submit New Workspace',
        buttonDisabled: !!newWorkspaceState.path,
      };
    })();

    return (
      <Button disabled={buttonDisabled} size="sm" type="submit">
        {buttonText}
      </Button>
    );
  };

  return (
    <div className="mx-auto w-full items-center justify-center rounded-sm border bg-background p-8 shadow-xl md:w-1/2">
      <div className="flex flex-col gap-4">
        <span className="font-semibold">Select workspace</span>
        <span className="text-sm text-muted-foreground">
          Enter a folder to create a new workspace or select an existing one.
        </span>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
          >
            <FormField
              control={form.control}
              name="workspaceBasePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace path</FormLabel>
                  <FormControl
                    onBlur={() => {
                      // set the base path in the store so that the ls query can be triggered before the user submits the form
                      setBasePath(field.value);
                    }}
                  >
                    <div className="flex flex-row gap-0.5">
                      <NautilusDialog
                        onSelect={(path) => field.onChange(path)}
                        trigger={
                          <Button size="icon" variant="outline">
                            <FolderIcon className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Input {...field} placeholder="/base/path/" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This is the path where the workspace will be created into.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workspaceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="workspace-name" />
                  </FormControl>
                  <FormDescription>
                    This is the name of the workspace.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slurmPartition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slurm Partition</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Slurm Partition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {slurmPartitionOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This is the slurm partition to use for the workspace
                    creation job.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton />
          </form>
        </Form>
      </div>
    </div>
  );
}
