import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DatasetNode } from '~/components/workboard/dataset-node';
import { InferenceNode } from '~/components/workboard/inference-node';
import { NetworkNode } from '~/components/workboard/network-node';

const nodeTypes: NodeTypes = {
  dataset: DatasetNode,
  network: NetworkNode,
  inference: InferenceNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 200, y: 400 },
    data: { more: 'Im number 1' },
    type: 'dataset',
  },
  {
    id: '2',
    position: { x: 400, y: 400 },
    data: { more: 'Im number 2' },
    type: 'network',
  },
  {
    id: '3',
    position: { x: 800, y: 400 },
    data: { more: 'Im number 3' },
    type: 'network',
  },
];
const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

// flow controller component
// can see all nodes and edges and should validade conditional states
// i.e. if a node is in a certain state, it should not be able to connect to another node
// it should set how the data is exchanged between nodes when a connection is made
function Geppetto() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const variant = BackgroundVariant.Dots;

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // log all node ids when nodes change
  // logs every time a node is moved ( #TODO: do we want this? ) -> node position is part of the node state
  // logs when state machine is changed in a node ( we do want this )
  // logs 1x when focus in (clicking on a node)
  // logs 1x when focus out (clicking out of the node)
  // logs 1x when clicked in focus (clicking on a node after the first click)
  useEffect(() => {
    console.log(
      'nodes changed:',
      nodes.map((n) => {
        n.id, n.data;
      }),
    );
  }, [nodes]);

  return (
    <div className="flex h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        attributionPosition="top-right"
        nodeTypes={nodeTypes}
      >
        <Controls className="dark:fill-slate-100 [&>button:hover]:dark:bg-slate-500 [&>button]:dark:bg-slate-700" />
        <MiniMap className="dark:bg-slate-700" />
        <Background variant={variant} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default Geppetto;
