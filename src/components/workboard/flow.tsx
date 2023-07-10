import { useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { shallow } from 'zustand/shallow';
import useStore, { nodeTypes } from '~/hooks/use-store';

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
  // print to log all the nodes when the nodes array changes size
  useEffect(() => {
    console.log('nodes', nodes);
  }, [nodes]);

  const variant = BackgroundVariant.Dots;

  return (
    <div className="flex h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
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

export default function Flow() {
  const workspaceDialogOpen = false;
  const selectedWorkspacePath = '/home/test';
  const { setWorkspacePath } = useStore();
  useEffect(() => {
    setWorkspacePath(selectedWorkspacePath);
  }, [setWorkspacePath]);

  // const WorkspaceDialog = () => {
  //   return (
  //     <Dialog open={workspaceDialogOpen}>
  //       <DialogContent className="sm:w-full">
  //         <DialogHeader>
  //           <DialogTitle>Select workspace path</DialogTitle>
  //           <DialogDescription>
  //             {'Select an existing workspace or create a new one.'}
  //           </DialogDescription>
  //         </DialogHeader>
  //         <div className="flex flex-col gap-2">
  //           {/* {availableUserWorkspacesQuery.data?.map((workspace) => (
  //             <Button
  //               key={workspace.workspacePath}
  //               variant="outline"
  //               onClick={() => handleWorkspaceSelect(workspace.workspacePath)}
  //             >
  //               {workspace.workspacePath}
  //             </Button>
  //           ))} */}
  //           <Button
  //               key={'newinstance'}
  //               variant="outline"
  //               onClick={() => handleNewWorkspace()}
  //             >
  //               New
  //             </Button>
  //         </div>
  //       </DialogContent>
  //     </Dialog>
  //   );
  // };

  return (
    <>
      {/* {workspaceDialogOpen && <WorkspaceDialog />} */}
      {!workspaceDialogOpen && <Gepetto />}
    </>
  );
}
