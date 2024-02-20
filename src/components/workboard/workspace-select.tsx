import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, FolderIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { type Edge, type Node } from 'reactflow';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, buttonVariants } from '~/components/ui/button';
import { env } from '~/env.mjs';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { slurmPartitionOptions } from '~/lib/constants';
import { cn } from '~/lib/utils';
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
import { ScrollArea } from '../ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export function WorkspaceSelector() {
  const { setWorkspacePath } = useStoreActions();
  const [path, setPath] = useState(env.NEXT_PUBLIC_STORAGE_PATH);
  const [jobId, setJobId] = useState('');
  const [disabled, setDisabled] = useState(false);

  const { mutate: registerWorkspaceInDb } =
    api.workspaceDbState.createWorkspace.useMutation({
      onSuccess: (data) => {
        toast.success('New workspace registered');
        // finally, set the workspace path in the store if the db registration was successful
        setWorkspacePath(data.path);
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

  const {} = api.remotejob.checkStatus.useQuery(
    { jobId },
    {
      refetchOnMount: false,
      enabled: !!jobId,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      onSuccess: (data) => {
        console.log('checkStatus.onSuccess', data);
        if (data.jobStatus === 'COMPLETED' && !!path) {
          // disable refetching until there is a new job
          setJobId('');
          registerWorkspaceInDb({ path: path });
          toast.success('Workspace created');
        } else if (data.jobStatus === 'FAILED') {
          toast.error('Error creating workspace');
          setDisabled(false);
        }
      },
    },
  );

  const handleNewWorkspace = (data: Form) => {
    const newPath = `${data.workspaceBasePath}${data.workspaceName}`;
    setDisabled(true);
    setPath(newPath);
    submitNewWorkspace({
      workspacePath: newPath,
      partition: data.slurmPartition,
    });
    toast.info('Creating workspace...');
  };

  const schema = z.object({
    workspaceBasePath: z.string().endsWith('/'),
    workspaceName: z.string().min(1),
    slurmPartition: z.enum(slurmPartitionOptions),
  });
  type Form = z.infer<typeof schema>;

  const form = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = () => {
    const data = form.getValues();
    handleNewWorkspace(data);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'link' }),
          'absolute left-2 top-2',
        )}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Home
      </Link>

      <div className="h-fit rounded-sm border p-8 shadow-xl">
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
                    <FormControl>
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
              <Button disabled={disabled} size="sm" type="submit">
                New
              </Button>
            </form>
          </Form>
          <SelectUserWorkspaces disabled={disabled} />
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="h-8 animate-pulse rounded-sm bg-muted" />
        </div>
      ))}
    </>
  );
}

function SelectUserWorkspaces({ disabled }: { disabled: boolean }) {
  // db interactions via tRPC
  // getting the workspaces for the user
  const { data: userWorkspaces, isLoading } =
    api.workspaceDbState.getUserWorkspaces.useQuery();
  const { setWorkspacePath, initNodes, initEdges, updateStateSnapshot } =
    useStoreActions();

  type WorkspaceSelectProps = {
    path: string;
    state: string;
  };
  const handleSelectWorkspace = (props: WorkspaceSelectProps) => {
    if (props.state) {
      const stateSnapshot = JSON.parse(props.state) as {
        nodes: Node<NodeData>[];
        edges: Edge[];
      };
      // init nodes and edges from db
      initNodes(stateSnapshot.nodes);
      initEdges(stateSnapshot.edges);
      // write the state snapshot
      updateStateSnapshot();
    }
    // sets the workspace path to the store which will trigger the workspace to be loaded
    setWorkspacePath(props.path);
    toast.success('Workspace loaded');
  };

  if (isLoading) {
    return <Skeleton />;
  }

  if (userWorkspaces) {
    return (
      <>
        {userWorkspaces.length > 0 && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs lowercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <ScrollArea className="h-44 p-4">
              <div className="flex flex-col gap-1">
                {userWorkspaces.map((workspace) => (
                  <Button
                    className="text-xs text-muted-foreground"
                    disabled={disabled}
                    key={workspace.path}
                    variant="outline"
                    onClick={() =>
                      void handleSelectWorkspace({
                        path: workspace.path,
                        state: workspace.state,
                      })
                    }
                  >
                    {workspace.path}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </>
    );
  }
  // if we get here, theres a problem with the db
  return <p>Something went wrong</p>;
}
