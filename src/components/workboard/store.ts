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

import initialEdges from './edges';
import initialNodes from './nodes';

export type NodeStateData = {
  machineState: string;
};

export type RFState = {
  nodes: Node<NodeStateData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeMachineState: (nodeId: string, machineState: string) => void;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<RFState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes: NodeChange[]) => {
    // logging machineState for the node that was changed
    get().nodes.forEach((node) => {
      if (node.id === changes.values().next().value.id) {
        console.log(
          'onNodesChange: node machineState is:',
          node.data.machineState,
        );
      }
    });
    // applying the changes
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
  updateNodeMachineState: (nodeId: string, machineState: string) => {
    console.log('updateNodeMachineState', nodeId, machineState);
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          // it's important to create a new object here, to inform React Flow about the cahnges
          node.data = { ...node.data, machineState };
        }
        return node;
      }),
    });
  },
}));

export default useStore;
