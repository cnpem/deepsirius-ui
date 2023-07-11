import { useRouter } from 'next/router';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from 'reactflow';
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
import CustomConnectionLine from '~/components/workboard/connection-line';
import useStore, { nodeTypes } from '~/hooks/use-store';
import { api } from '~/utils/api';

// flow controller component
// can see all nodes and edges and should validade conditional states
// i.e. if a node is in a certain state, it should not be able to connect to another node
// it should set how the data is exchanged between nodes when a connection is made
function Gepetto() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onInit } =
    useStore(
      (state) => ({
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

function WorkspaceDialog({ open }: { open: boolean }) {
  const availableUserWorkspacesQuery =
    api.workspace.getUserWorkspaces.useQuery();
  const { setWorkspacePath } = useStore();
  const router = useRouter();

  const handleWorkspaceSelect = (workspacePath: string) => {
    setWorkspacePath(workspacePath);
  };

  const handleNewWorkspace = () => {
    const newWorkspacePath = '/home/test';
    setWorkspacePath(newWorkspacePath);
  };

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
            {availableUserWorkspacesQuery.data?.map((workspace) => (
              <Button
                key={workspace.path}
                variant="outline"
                onClick={() => handleWorkspaceSelect(workspace.path)}
              >
                {workspace.path}
              </Button>
            ))}
            <Button
              key={'newinstance'}
              variant="outline"
              onClick={() => handleNewWorkspace()}
            >
              New
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Flow() {
  const { workspacePath } = useStore();

  console.log('isSelected? ', workspacePath, !!workspacePath);

  return (
    <>
      <WorkspaceDialog open={!workspacePath} />
      {!!workspacePath && <Gepetto />}
    </>
  );
}
