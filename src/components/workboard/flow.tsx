import { ArrowBigLeft, PlusCircle } from 'lucide-react';
import { useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
} from 'reactflow';
import { type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { shallow } from 'zustand/shallow';
import CustomConnectionLine from '~/components/workboard/connection-line';
import useStore, { type NodeData, nodeTypes } from '~/hooks/use-store';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CloneNode } from './clone-node';
import { PlusOneNode } from './plusone-node';

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

  const nodeColor = (node: Node<NodeData>) => {
    switch (node.type) {
      case 'dataset':
        return '#6ede87';
      case 'new':
        return '#eb0ee3';
      case 'network':
        return '#3162c4';
      case 'inference':
        return '#eb870e';
      default:
        return '#ff0072';
    }
  };
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
        onInit={onInit}
        fitView
      >
        <Panel position="top-left" className="flex flex-col gap-2">
          <PlusOneNode />
          <CloneNode />
        </Panel>
        {nodes.length === 0 && (
          <Panel position="top-center" className="flex flex-col gap-2">
            <AlertDemo />
          </Panel>
        )}
        <Controls
          showZoom={false}
          className="bg-transparent px-1 dark:fill-white [&>button:hover]:dark:bg-slate-700 [&>button]:dark:bg-muted [&>button]:rounded-sm [&>button]:border-none [&>button]:my-2"
        ></Controls>
        <MiniMap
          nodeColor={nodeColor}
          className="dark:bg-muted rounded-sm border-0 p-2"
          pannable
          zoomable
        />
        <Background variant={variant} gap={12} />
      </ReactFlow>
    </div>
  );
}

function AlertDemo() {
  return (
    <Alert>
      <ArrowBigLeft className="h-6 w-6 animate-bounce-x" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add <span className="text-purple-500 font-semibold">nodes</span>{' '}
        to your workspace by clicking on the{' '}
        <PlusCircle className="inline h-5 w-5" /> button on the top left corner.
      </AlertDescription>
    </Alert>
  );
}

export default function Flow() {
  const workspaceDialogOpen = false;
  const selectedWorkspacePath = '/home/test';
  const { setWorkspacePath } = useStore(
    (state) => ({
      setWorkspacePath: state.setWorkspacePath,
    }),
    shallow,
  );
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
    <div>
      {/* {workspaceDialogOpen && <WorkspaceDialog />} */}
      {!workspaceDialogOpen && <Gepetto />}
    </div>
  );
}
