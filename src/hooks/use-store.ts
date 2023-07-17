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
import {
  type StateCreator,
  type StoreMutatorIdentifier,
  create,
} from 'zustand';
import { persist } from 'zustand/middleware';
import { DatasetNode } from '~/components/workboard/dataset-node';
import { InferenceNode } from '~/components/workboard/inference-node';
import { NetworkNode } from '~/components/workboard/network-node';
import { PlusOneNode } from '~/components/workboard/plusone-node';

export const nodeTypes: NodeTypes = {
  dataset: DatasetNode,
  network: NetworkNode,
  inference: InferenceNode,
  new: PlusOneNode,
};

export const NodeTypesList = Object.keys(nodeTypes);

export type Status = 'success' | 'error' | 'active' | 'busy' | 'inactive';

export type NodeData = {
  registryId: string; // this is the id of the node in the database
  status: Status; // this is just a state label without spaces for controlling the flow
  xState?: string; // this is a long json
};

// const initialNodes = [] as Node<NodeData>[];

// const initialEdges = [] as Edge[];

export type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  workspacePath?: string;
  resetStore: () => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  // onInit: () => void;
  enableQuery: boolean;
  setEnableQuery: (enableQuery: boolean) => void;
  setWorkspacePath: (workspacePath: string) => void;
  onUpdateNode: ({ id, data }: { id: string; data: NodeData }) => void;
  addNode: (node: Node<NodeData>) => void;
};

// Log every time state is changed
type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string,
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string,
) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    set(...a);
    console.log(...(name ? [`${name}:`] : []), get());
  };
  store.setState = loggedSet;

  return f(loggedSet, get, store);
};

export const logger = loggerImpl as unknown as Logger;

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<RFState>()(
  persist(
    logger(
      (set, get) => ({
        nodes: [],
        edges: [],
        workspacePath: undefined,
        enableQuery: true,
        setEnableQuery: (enableQuery: boolean) => {
          set({ enableQuery });
        },
        resetStore: () => {
          set({
            nodes: [],
            edges: [],
            enableQuery: true,
            workspacePath: undefined,
          });
        },
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
          const sourceNode = get().nodes.find(
            (node) => node.id === params.source,
          );
          const targetNode = get().nodes.find(
            (node) => node.id === params.target,
          );
          const data = sourceNode?.data as NodeData;
          const status = data.status;
          const validConnectionPairs = [
            ['dataset', 'network'],
            ['network', 'inference'],
          ];
          let isValidConnection = true;
          if (!sourceNode && !targetNode) {
            isValidConnection = false;
          } else if (status !== 'success') {
            isValidConnection = false;
          } else if (
            !validConnectionPairs.some(
              ([sourceType, targetType]) =>
                sourceNode?.type === sourceType &&
                targetNode?.type === targetType,
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
        // onInit: () => {
        //   const nodes = get().nodes;
        //   set({
        //     nodes: nodes,
        //   });
        // },
      }),
      'useStore',
    ),
    {
      name: 'workspace-path',
      // storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ workspacePath: state.workspacePath }),
    },
  ),
);

export default useStore;
