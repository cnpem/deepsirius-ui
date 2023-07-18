import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
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
import { shallow } from 'zustand/shallow';
import { DatasetNode } from '~/components/workboard/dataset-node';
import { InferenceNode } from '~/components/workboard/inference-node';
import { NetworkNode } from '~/components/workboard/network-node';
import { PlusOneNode } from '~/components/workboard/plusone-node';
import { api } from '~/utils/api';

export const nodeTypes: NodeTypes = {
  dataset: DatasetNode,
  network: NetworkNode,
  inference: InferenceNode,
  new: PlusOneNode,
};

const validConnectionPairs = [
  ['dataset', 'network'],
  ['network', 'inference'],
];

export const NodeTypesList = Object.keys(nodeTypes);

export type Status = 'success' | 'error' | 'active' | 'busy' | 'inactive';

export type NodeData = {
  registryId: string; // this is the id of the node in the database
  status: Status; // this is just a state label without spaces for controlling the flow
  xState?: string; // this is a long json
};

export type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  workspacePath?: string;
  enableQuery: boolean;
  actions: {
    resetStore: () => void;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    checkConnectedSource: (targetId: string) => boolean;
    // onInit: () => void;

    setEnableQuery: (enableQuery: boolean) => void;
    setWorkspacePath: (workspacePath: string) => void;
    onUpdateNode: ({ id, data }: { id: string; data: NodeData }) => void;
    addNode: (node: Node<NodeData>) => void;
  };
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
        actions: {
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
            // checking if there is already a source connected to the target:
            // find all the nodes connected to the target node and
            // return without making the connection if a connection already exists
            if (get().edges.find((edge) => edge.target === params.target)) {
              console.log(
                'Store.OnConnect: There is already a source connected to the target',
              );
              return;
            }
            // find nodes
            const sourceNode = get().nodes.find(
              (node) => node.id === params.source,
            );
            const targetNode = get().nodes.find(
              (node) => node.id === params.target,
            );
            // return if nodes are not found
            if (!sourceNode || !targetNode) {
              console.log('Store.OnConnect: Source or target node not found.', {
                source: params.source,
                target: params.target,
              });
              return;
            }
            // check source status
            if (sourceNode.data.status !== 'success') {
              console.log(
                'Store.OnConnect: Source node is not ready. Source status:',
                sourceNode.data.status,
              );
              return;
            }
            // check connection pairs and connect if valid
            if (
              validConnectionPairs.some(
                ([sourceType, targetType]) =>
                  sourceNode?.type === sourceType &&
                  targetNode?.type === targetType,
              )
            ) {
              set({
                edges: addEdge(params, get().edges),
              });
              return;
            } else {
              console.log(
                'Store.OnConnect: Invalid connection pair',
                sourceNode?.type,
                targetNode?.type,
              );
            }
            // if somehow we get here, we didn't make the connection
            console.log('Store.OnConnect: Connection not made. unknown error.');
          },
          checkConnectedSource: (targetId: string) => {
            const edge = get().edges.find((edge) => edge.target === targetId);
            if (!edge) {
              console.log('Store.checkConnectedSource: No connection found');
              return false;
            }
            const sourceNode = get().nodes.find(
              (node) => node.id === edge.source,
            );
            if (sourceNode && sourceNode?.data.status === 'success') {
              return true;
            } else if (sourceNode && sourceNode?.data.status !== 'success') {
              // this shoudn't be allowed
              console.log(
                'Store.checkConnectedSource: sourceNode in other status',
                sourceNode,
              );
              return false;
            } else {
              // this shoudn't be allowed either
              console.log(
                'Store.checkConnectedSource: No source found but the edge exsists',
                edge,
              );
              return false;
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

// export default useStore;
export const useStoreNodes = () =>
  useStore((state) => ({ nodes: state.nodes }), shallow);
export const useStoreEdges = () =>
  useStore((state) => ({ edges: state.edges }), shallow);
export const useStoreWorkspacePath = () =>
  useStore((state) => ({ workspacePath: state.workspacePath }), shallow);
export const useStoreEnableQuery = () =>
  useStore((state) => ({ enableQuery: state.enableQuery }), shallow);
export const useStoreActions = () => useStore((state) => state.actions);

// hook for updating the node data on the store and the database
export const useUpdateNodeData = () => {
  // store action
  const { onUpdateNode } = useStoreActions();
  // api action
  const { mutate } = api.workspace.updateNodeData.useMutation();
  return ({ id, data }: { id: string; data: NodeData }) => {
    onUpdateNode({ id, data });
    mutate(data as { registryId: string; status: string; xState: string });
  };
};
