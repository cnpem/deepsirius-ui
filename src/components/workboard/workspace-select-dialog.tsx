import { useRouter } from 'next/router';
import { useState } from 'react';
import { type Edge, type Node } from 'reactflow';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { toast } from '~/components/ui/use-toast';
import { env } from '~/env.mjs';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';

import { FsTree } from '../fs-treeview';
import { ScrollArea } from '../ui/scroll-area';

// TODO: List the user's workspaces doesnt show all the workspaces if the list is longer than the scroll area

/**
 *
 * @returns buttons for selecting a workspace session from the user's available workspaces from the db
 */
function ChooseUserWorkspaces() {
  // db interactions via tRPC
  // getting the workspaces for the user
  const {
    data: userWorkspaces,
    isError,
    isLoading,
    error,
  } = api.workspaceState.getUserWorkspaces.useQuery();
  const { setWorkspacePath, initNodes, initEdges, updateStateSnapshot } =
    useStoreActions();

  type WorkspaceSelectProps = {
    path: string;
    state: string;
  };
  const handleSelectWorkspace = (props: WorkspaceSelectProps) => {
    if (props.state) {
      console.log('init nodes and edges from db');
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

/**
 *
 * @param open : boolean to control the dialog trigger from outside this component
 * @returns the WorkspaceSelectDialog component for selecting or creating a workspace session
 */
export default function WorkspaceSelectDialog({ open }: { open: boolean }) {
  const { setWorkspacePath } = useStoreActions();
  const { mutate: createWorkspaceMutation } =
    api.workspaceState.createWorkspace.useMutation({
      onSuccess: () => {
        console.log('createWorkspace.onSuccess');
      },
      onError: (error) => {
        console.log('createWorkspace.onError', error);
        setWorkspacePath('');
      },
    });

  const handleNewWorkspace = (path: string) => {
    createWorkspaceMutation({ path: path });
    setWorkspacePath(path);
  };

  return (
    <FsTreeDialog
      open={open}
      handleSelect={(path) => handleNewWorkspace(path)}
      message={{
        title: 'Select workspace path',
        description: 'Select an existing workspace or create a new one.',
      }}
    >
      <ChooseUserWorkspaces />
    </FsTreeDialog>
  );
}

function FsTreeDialog({
  open,
  children,
  handleSelect,
  message,
}: {
  open: boolean;
  children: React.ReactNode;
  handleSelect: (path: string) => void;
  message: { title: string; description: string };
}) {
  const router = useRouter();
  const treePath = env.NEXT_PUBLIC_TREE_PATH;
  const [path, setPath] = useState(treePath);

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      console.log('closing dialog and redirecting to /');
      await router.push('/');
    }
  };
  const onSelect = (path: string) => {
    handleSelect(path);
    setPath(treePath);
  };

  return (
    <Dialog open={open} onOpenChange={(e) => void handleOpenChange(e)}>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>{message.title}</DialogTitle>
          <DialogDescription>{message.description}</DialogDescription>
        </DialogHeader>
        <FsTree
          path={path}
          handlePathChange={setPath}
          width={780}
          height={250}
        />
        <Button className="w-full" onClick={() => onSelect(path)}>
          New
        </Button>
        {children}
      </DialogContent>
    </Dialog>
  );
}
