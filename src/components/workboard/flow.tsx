import { useRouter } from 'next/router';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from 'reactflow';
import { type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { shallow } from 'zustand/shallow';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { toast } from '~/components/ui/use-toast';
import CustomConnectionLine from '~/components/workboard/connection-line';
import useStore, { type Status, nodeTypes } from '~/hooks/use-store';
import { type NodeData } from '~/hooks/use-store';
import { api } from '~/utils/api';

// this will be a function inside the store
function GetNodes({ workspacePath }: { workspacePath: string | undefined }) {
  const { nodes, addNode } = useStore(
    (state) => ({
      workspacePath: state.workspacePath,
      nodes: state.nodes,
      addNode: state.addNode,
    }),
    shallow,
  );
  const path = workspacePath ? workspacePath : '';
  const { isLoading, isError, data, error } =
    api.workspace.getWorkspaceNodes.useQuery(
      { workspacePath: path },
      {
        onSuccess: (data) => {
          console.log('query node data', data);
          data.map((node) => {
            const newNode: Node<NodeData> = {
              id: node.id,
              type: node.type,
              position: {
                x: 0,
                y: 0,
              },
              data: {
                label: node.label,
                status: node.status as Status,
                xState: node.xState,
              },
            };
            addNode(newNode);
          });
        },
        onError: (e) => {
          console.log('query node error', e);
        },
      },
    );

  return;
}

/**
 * The Gepetto component is the main component for the workspace flow
 * It uses the ReactFlow component to render the nodes and edges
 * It also uses the zustand store to manage the state of the nodes and edges
 *
 * @returns
 */
function Gepetto() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onInit,
    workspacePath,
  } = useStore(
    (state) => ({
      workspacePath: state.workspacePath,
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      onInit: state.onInit,
    }),
    shallow,
  );

  const variant = BackgroundVariant.Dots;

  // // db interactions via tRPC
  // // get nodes and edges from db and set them in the store
  // const path = workspacePath ? workspacePath : '';
  // const { isLoading, isError, data, error } = api.workspace.getWorkspaceNodes.useQuery({ workspacePath: path }, {
  //   onSuccess: (data) => {
  //     console.log('query node data', data);
  //   },
  //   onError: (e) => {
  //     console.log('query node error', e);
  //   },
  // });
  GetNodes({ workspacePath });

  //TODO: would be nice to change the height for full screen mode to h-[930px]
  return (
    <div className="p-2 h-[799px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineComponent={CustomConnectionLine}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls className="dark:fill-slate-100 [&>button:hover]:dark:bg-slate-500 [&>button]:dark:bg-slate-700" />
        <MiniMap className="dark:bg-slate-700" />
        <Background variant={variant} gap={12} />
      </ReactFlow>
    </div>
  );
}

/**
 *
 * @returns buttons for selecting a workspace session from the user's available workspaces from the db
 */
function ChooseUserWorkspaces() {
  // db interactions via tRPC
  const { isLoading, isError, data, error } =
    api.workspace.getUserWorkspaces.useQuery();
  // zustand store
  const { setWorkspacePath } = useStore();

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (isError) {
    console.log('error', error);
    return <p>Error</p>;
  }
  if (data) {
    return (
      <>
        {data.map((workspace) => (
          <Button
            key={workspace.path}
            variant="outline"
            onClick={() => setWorkspacePath(workspace.path)}
          >
            {workspace.path}
          </Button>
        ))}
      </>
    );
  }
  return <p>Something went wrong</p>;
}

/**
 *
 * @returns a form component for creating a new workspace session
 */
function CreateNewWorkspace() {
  // db interactions via tRPC
  const { mutate } = api.workspace.createWorkspace.useMutation({
    onSuccess: (data) => {
      console.log('updateWorkspace.onSuccess', data);
      setWorkspacePath(data.path);
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast({
          variant: 'destructive',
          title: 'Failed to create!',
          description: errorMessage[0],
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to create!',
          description: 'Something went wrong. Please try again.',
        });
      }
    },
  });

  // zustand store
  const { setWorkspacePath } = useStore();

  const handleNewWorkspace = () => {
    const newWorkspacePath = '/home/test';
    mutate({ path: newWorkspacePath });
  };

  return (
    <Button
      key={'newinstance'}
      variant="outline"
      onClick={() => handleNewWorkspace()}
    >
      New
    </Button>
  );
}

/**
 *
 * @param open : boolean to control the dialog trigger from outside this component
 * @returns the WorkspaceDialog component for selecting or creating a workspace session
 */
function WorkspaceDialog({ open }: { open: boolean }) {
  const router = useRouter();

  const handleDialogClose = async (open: boolean) => {
    // redirect to / if user closes dialog
    if (open === false) {
      console.log('closing dialog and redirecting to /');
      await router.push('/');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(e) => void handleDialogClose(e)}>
        <DialogContent className="sm:w-full">
          <DialogHeader>
            <DialogTitle>Select workspace path</DialogTitle>
            <DialogDescription>
              {'Select an existing workspace or create a new one.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <ChooseUserWorkspaces />
            <CreateNewWorkspace />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 *
 * @returns the WorkspaceDialog if no workspacePath is set in the store or the Gepetto (Workspace Flow component) if it is
 */
export default function Flow() {
  const { workspacePath } = useStore();

  return (
    <>
      <WorkspaceDialog open={!workspacePath} />
      {!!workspacePath && <Gepetto />}
    </>
  );
}
