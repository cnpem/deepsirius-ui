import { useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type NodeTypes,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DatasetNode } from '~/components/workboard/dataset-node';
import initialEdges from '~/components/workboard/edges';
import { InferenceNode } from '~/components/workboard/inference-node';
import { NetworkNode } from '~/components/workboard/network-node';
import initialNodes from '~/components/workboard/nodes';
import { PlusOneNode } from '~/components/workboard/plusone-node';

export const nodeTypes: NodeTypes = {
  dataset: DatasetNode,
  network: NetworkNode,
  inference: InferenceNode,
  new: PlusOneNode,
};

export const NodeTypesList = Object.keys(nodeTypes);

// flow controller component
// can see all nodes and edges and should validade conditional states
// i.e. if a node is in a certain state, it should not be able to connect to another node
// it should set how the data is exchanged between nodes when a connection is made
function Gepetto({ workspacePath }: { workspacePath: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  const handleInit = useCallback(() => {
    console.log('handleInit');
    // writing the workspace path to the node data of all the nodes
    // so that the nodes can access the workspace path
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          workspacePath,
        },
      })),
    );
    fitView({ padding: 0.2, minZoom: 1 });
  }, [fitView, setNodes, workspacePath]);

  const validateConnection = useCallback(
    (params: Edge | Connection) => {
      console.log('validateConnection', params);
      const validConnectionPairs = [
        ['dataset', 'network'],
        ['network', 'inference'],
      ];
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);
      if (!sourceNode && !targetNode) {
        console.log(
          'source and target nodes not found',
          params.source,
          params.target,
        );
        return false;
      } else if (sourceNode?.data.xState !== 'success') {
        console.log(
          'source node is not in success state',
          sourceNode?.data.xState,
        );
        return false;
      } else if (
        !validConnectionPairs.some(
          ([sourceType, targetType]) =>
            sourceNode?.type === sourceType && targetNode?.type === targetType,
        )
      ) {
        console.log(
          'connection is not valid',
          sourceNode?.type,
          targetNode?.type,
        );
        return false;
      } else {
        console.log('connection valid');
        return true;
      }
    },
    [nodes],
  );

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      console.log('onConnect', params);
      // validate connection pairs and source node machineState
      if (validateConnection(params)) {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [setEdges, validateConnection],
  );

  const variant = BackgroundVariant.Dots;

  return (
    <div className="flex h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
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
    <ReactFlowProvider>
      {/* {workspaceDialogOpen && <WorkspaceDialog />} */}
      {!workspaceDialogOpen && (
        <Gepetto workspacePath={selectedWorkspacePath} />
      )}
    </ReactFlowProvider>
  );
}
