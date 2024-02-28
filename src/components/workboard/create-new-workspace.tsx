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

export function CreateNewWorkspace() {
  const { setWorkspacePath, resetStore } = useStoreActions();
  const [basePath, setBasePath] = useState(env.NEXT_PUBLIC_STORAGE_PATH);
  const [path, setPath] = useState('');
  const [jobId, setJobId] = useState('');
  const [disabled, setDisabled] = useState(false);
  const router = useRouter();

  const { mutate: registerWorkspaceInDb } =
    api.workspaceDbState.createWorkspace.useMutation({
      onSuccess: async (data) => {
        toast.success('New workspace registered');
        // finally, set the workspace path in the store if the db registration was successful
        resetStore();
        setWorkspacePath(data.path);
        await router.push('/workboard');
      },
      onError: () => {
        toast.error('Error registering workspace');
        setDisabled(false);
      },
    });

  const { mutate: submitNewWorkspace } =
    api.remoteProcess.submitNewWorkspace.useMutation({
      onSuccess: (data) => {
        setJobId(data.jobId);
      },
      onError: () => {
        toast.error('Error creating workspace');
        setDisabled(false);
      },
    });

  const { data: checkStatusData } = api.remotejob.checkStatus.useQuery(
    { jobId },
    {
      refetchOnMount: false,
      enabled: !!jobId,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );

  useEffect(() => {
    if (checkStatusData?.jobStatus === 'COMPLETED' && !!path) {
      // disable refetching until there is a new job
      setJobId('');
      registerWorkspaceInDb({ path: path });
      toast.success('Workspace created');
    } else if (checkStatusData?.jobStatus === 'FAILED') {
      toast.error('Error creating workspace');
      setDisabled(false);
    }
  }, [checkStatusData, path, registerWorkspaceInDb]);

  const handleNewWorkspace = (data: Form) => {
    setDisabled(true);
    const fullPath = `${data.workspaceBasePath}${data.workspaceName}`;
    setPath(fullPath);
    submitNewWorkspace({
      workspacePath: fullPath,
      partition: data.slurmPartition,
    });
    toast.info('Creating workspace...');
  };

  const {
    data: pathData,
    isLoading: loadingLsData,
    error: errorLs,
  } = api.ssh.ls.useQuery(
    {
      path: basePath,
    },
    {
      enabled: !!basePath && !disabled,
    },
  );

  const schema = z
    .object({
      workspaceBasePath: z.string().endsWith('/'),
      workspaceName: z.string().min(1),
      slurmPartition: z.enum(slurmPartitionOptions),
    })
    .superRefine(({ workspaceName }, ctx) => {
      if (errorLs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Error fetching base path data: ' + errorLs.message,
          fatal: true,
          path: ['workspaceBasePath'],
        });
        return z.NEVER;
      }
      if (pathData?.files.find((file) => file.name === workspaceName)) {
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
    setDisabled(true);
    handleNewWorkspace(data);
  };

  return (
    <div className="rounded-sm border p-8 shadow-xl items-center justify-center md:w-1/2 w-full mx-auto bg-background">
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
            <Button
              disabled={disabled || loadingLsData}
              size="sm"
              type="submit"
            >
              {!disabled && 'Submit New Workspace'}
              {disabled && !jobId && 'Creating workspace...'}
              {disabled && jobId && 'Creating workspace... Job ID: ' + jobId}
              {disabled && (
                <div className="mx-2 h-4 w-4 animate-spin rounded-full border-t-2 border-secondary" />
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
