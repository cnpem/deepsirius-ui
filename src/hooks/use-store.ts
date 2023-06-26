import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import { create } from 'zustand';
import initialEdges from '~/components/workboard/edges';
import initialNodes from '~/components/workboard/nodes';

export type NodeStateData = {
  nodeLabel: string;
  machineState: string;
};

export type RFState = {
  nodes: Node<NodeStateData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  isValidConnection: (connection: Connection) => boolean;
  setNodeData: (nodeId: string, newData: NodeStateData) => void;
  getSourceNodeData: (nodeId: string) => NodeStateData;
  createNewNode: (nodeType: string) => void;
};

const validConnectionPairs = [
  ['dataset', 'network'],
  ['network', 'inference'],
];

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<RFState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    console.log('onEdgesChange', changes);
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    console.log('onConnect', connection, get().edges);
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  // checks if the connection is valid
  // by only allowing connections from dataset to network and from network to inference
  // if the node machineState is 'success'
  // this event is triggered when the user tries to connect two nodes by dragging a connection from one node and hovering over another node
  isValidConnection: (connection: Connection) => {
    const sourceNode = get().nodes.find(
      (node) => node.id === connection.source,
    );
    const targetNode = get().nodes.find(
      (node) => node.id === connection.target,
    );
    if (
      sourceNode &&
      targetNode &&
      sourceNode.data.machineState === 'success'
    ) {
      if (
        validConnectionPairs.some(
          ([sourceType, targetType]) =>
            sourceNode.type === sourceType && targetNode.type === targetType,
        )
      ) {
        console.log('connection is valid');
        return true;
      }
    }
    console.log('connection is invalid');
    return false;
  },
  setNodeData: (nodeId: string, newData: NodeStateData) => {
    console.log('updateNodeMachineState', nodeId, newData);
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          // it's important to create a new object here, to inform React Flow about the cahnges
          node.data = { ...node.data, ...newData };
        }
        return node;
      }),
    });
  },
  // checks if there is a connection with nodeId as target and returns the source node data if it exists
  getSourceNodeData(nodeId) {
    const unknownNodeData: NodeStateData = {
      nodeLabel: 'unknown',
      machineState: 'unknown',
    };
    // checks if the node identified by nodeId is connected to another node as a target
    const edge = get().edges.find((edge) => edge.target === nodeId);
    if (edge) {
      // if it is, get the node data of the source node
      const sourceNode = get().nodes.find((node) => node.id === edge.source);
      return sourceNode ? sourceNode.data : unknownNodeData;
    }
    return unknownNodeData;
  },
  // creates a new node with the given nodeType
  createNewNode: (nodeType: string) => {
    console.log('createNewNode', nodeType);
    const newNode: Node<NodeStateData> = {
      id: get().nodes.length.toString(),
      type: nodeType,
      // TODO: set position to the to-be-defined fixed columns positions for each node type
      position: { x: 400, y: 400 },
      data: {
        nodeLabel: nodeType,
        machineState: 'unknown',
      },
    };
    set({
      nodes: [...get().nodes, newNode],
    });
  },
}));

export default useStore;
