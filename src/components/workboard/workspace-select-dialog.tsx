import { useRouter } from 'next/router';
import { useState } from 'react';
import { type Edge, type Node } from 'reactflow';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { env } from '~/env.mjs';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';

import { FsTree } from '../fs-treeview';
import { ScrollArea } from '../ui/scroll-area';

export default function WorkspaceSelectDialog({ open }: { open: boolean }) {
  const { push } = useRouter();
  const { setWorkspacePath } = useStoreActions();

  const [path, setPath] = useState(env.NEXT_PUBLIC_TREE_PATH);
  const [jobId, setJobId] = useState('');
  const [disabled, setDisabled] = useState(false);

  const { mutate: registerWorkspaceInDb } =
    api.workspaceDbState.createWorkspace.useMutation({
      onSuccess: (data) => {
        toast.success('New workspace registered');
        // finally, set the workspace path in the store if the db registration was successful
        setWorkspacePath(data.path);
        setDisabled(false);
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

  const handleNewWorkspace = (path: string) => {
    setPath(path);
    setDisabled(true);
    submitNewWorkspace({ workspacePath: path });
    toast('Creating workspace...');
  };

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      await push('/');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(e) => void handleOpenChange(e)}>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>Select workspace path</DialogTitle>
          <DialogDescription>
            Select an existing workspace or create a new one.
          </DialogDescription>
        </DialogHeader>
        <FsTree
          hidden={disabled}
          path={path}
          handlePathChange={setPath}
          width={780}
          height={250}
        />
        <Button
          className="w-full"
          onClick={() => handleNewWorkspace(path)}
          disabled={disabled}
        >
          New
        </Button>
        <SelectUserWorkspaces disabled={disabled} />
      </DialogContent>
    </Dialog>
  );
}

function SelectUserWorkspaces({ disabled }: { disabled: boolean }) {
  // db interactions via tRPC
  // getting the workspaces for the user
  const {
    data: userWorkspaces,
    isError,
    isLoading,
    error,
  } = api.workspaceDbState.getUserWorkspaces.useQuery();
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
  };

  if (isLoading) {
    return <></>;
  }
  if (isError) {
    console.log('error', error);
    return <></>;
  }
  if (userWorkspaces) {
    return (
      <>
        {userWorkspaces.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
        )}
        <ScrollArea className="h-[200px] w-[780px] p-4">
          <div className="flex flex-col gap-1">
            {userWorkspaces.map((workspace) => (
              <Button
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
    );
  }
  // if we get here, theres a problem with the db
  return <p>Something went wrong</p>;
}
