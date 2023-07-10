import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnInit,
  type OnNodesChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import { create } from 'zustand';
import { CloneNode } from '~/components/workboard/clone-node';
import { DatasetNode } from '~/components/workboard/dataset-node';
import { InferenceNode } from '~/components/workboard/inference-node';
import { NetworkNode } from '~/components/workboard/network-node';
import { PlusOneNode } from '~/components/workboard/plusone-node';

export const nodeTypes: NodeTypes = {
  dataset: DatasetNode,
  network: NetworkNode,
  inference: InferenceNode,
  new: PlusOneNode,
  clone: CloneNode,
};

export const NodeTypesList = Object.keys(nodeTypes);

export type Status = 'success' | 'error' | 'active' | 'busy' | 'inactive';

export type NodeData = {
  workspacePath?: string;
  label?: string;
  status?: Status; // this is just a state label without spaces for controlling the flow
  xState?: string; // this is a long json
};

const initialNodes = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    type: 'new',
  },
  {
    id: '2',
    position: { x: 0, y: 100 },
    type: 'clone',
  },
] as Node<NodeData>[];

const initialEdges = [] as Edge[];

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  workspacePath?: string;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onInit: OnInit;
  setWorkspacePath: (workspacePath: string) => void;
  onUpdateNode: ({ id, data }: { id: string; data: NodeData }) => void;
  addNode: (node: Node<NodeData>) => void;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<RFState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  workspacePath: undefined,
  addNode: (node: Node<NodeData>) => {
    set({
      nodes: [...get().nodes, node],
    });
  },
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (params: Edge | Connection) => {
    const sourceNode = get().nodes.find((node) => node.id === params.source);
    const targetNode = get().nodes.find((node) => node.id === params.target);
    const data = sourceNode?.data as NodeData;
    const status = data.status;
    const validConnectionPairs = [
      ['dataset', 'network'],
      ['network', 'inference'],
    ];
    let isValidConnection = true;
    if (!sourceNode && !targetNode) {
      isValidConnection = false;
      // this is commented so we can test connections without having to send jobs and wait for the component to change status
      // } else if (status !== 'success') {
      //   isValidConnection = false;
    } else if (
      !validConnectionPairs.some(
        ([sourceType, targetType]) =>
          sourceNode?.type === sourceType && targetNode?.type === targetType,
      )
    ) {
      isValidConnection = false;
    }
    if (isValidConnection) {
      set({
        edges: addEdge(params, get().edges),
      });
    }
  },
  onUpdateNode: ({ id, data }: { id: string; data: NodeData }) => {
    const nodes = get().nodes;
    const node = nodes.find((node) => node.id === id);
    if (node) {
      node.data = { ...node.data, ...data } as NodeData;
      set({ nodes });
    }
  },
  setWorkspacePath: (workspacePath: string) => {
    set({ workspacePath: workspacePath });
  },
  onInit: () => {
    const nodes = get().nodes;
    const workspacePath = get().workspacePath;
    set({
      nodes: nodes.map((node) => ({
        ...node,
        data: { ...node.data, workspacePath } as NodeData,
      })),
    });
  },
}));

export default useStore;
