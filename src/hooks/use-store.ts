import { nanoid } from 'nanoid';
import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeDragHandler,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnEdgesDelete,
  type OnNodesChange,
  type OnNodesDelete,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import {
  // type StateCreator,
  // type StoreMutatorIdentifier,
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

export const AllowedNodeTypesList = Object.keys(nodeTypes).filter(
  (nodeType) => nodeType !== 'new',
);

export type AllowedNodeTypes = (typeof AllowedNodeTypesList)[number];

const validConnectionPairs = [
  ['dataset', 'network'],
  ['network', 'inference'],
];

export type NodeStatus = 'success' | 'error' | 'active' | 'busy' | 'inactive';

export type NodeData = {
  workspacePath: string;
  status: NodeStatus; // this is just a state label without spaces for controlling the flow
  xState?: string; // this is a long json
  remoteFsDataPath?: string; // this is the path to the stored data related to the node component in the remote filesystem and should be deleted when the node is deleted
};

type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  workspacePath?: string;
  stateSnapshot: string;
};

type RFActions = {
  resetStore: () => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodesDelete: OnNodesDelete;
  onEdgesDelete: OnEdgesDelete;
  onNodeDragStop: NodeDragHandler;
  isValidConnection: (edge: Edge | Connection) => boolean;
  checkSourceIsConnected: (targetId: string) => boolean;
  getSourceData: (targetId: string) => NodeData | undefined;
  setWorkspacePath: (workspacePath: string) => void;
  onUpdateNode: ({ id, data }: { id: string; data: NodeData }) => void;
  initNodes: (nodes: Node<NodeData>[]) => void;
  initEdges: (edges: Edge[]) => void;
  addNode: (node: Node<NodeData>) => void;
  addEdge: (edge: Edge) => void;
  updateStateSnapshot: () => void;
};

export type RFStore = RFState & {
  actions: RFActions;
};

const initialState: RFState = {
  nodes: [],
  edges: [],
  workspacePath: undefined,
  stateSnapshot: '',
};

const useSilentStore = create<RFStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      actions: {
        updateStateSnapshot: () => {
          const dbState = {
            nodes: get().nodes,
            edges: get().edges,
          };
          // logs only relevant info when updating the state snapshot in the db
          const nodesSnapshot = dbState.nodes.map((node) => {
            const nodesSnapshot = {
              type: node.type,
              status: node.data.status,
              remoteFsDataPath: node.data.remoteFsDataPath,
            };
            return nodesSnapshot;
          });
          console.log('Store.updateStateSnapshot: ', nodesSnapshot);
          set({ stateSnapshot: JSON.stringify(dbState) });
        },
        resetStore: () => {
          set(initialState);
        },
        initNodes: (nodes: Node<NodeData>[]) => {
          set({
            nodes: nodes,
          });
        },
        initEdges: (edges: Edge[]) => {
          set({
            edges: edges,
          });
        },
        addNode: (node: Node<NodeData>) => {
          set({
            nodes: [...get().nodes, node],
          });
          get().actions.updateStateSnapshot();
        },
        addEdge: (edge: Edge) => {
          set({
            edges: [...get().edges, edge],
          });
          get().actions.updateStateSnapshot();
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
        isValidConnection: (params: Edge | Connection) => {
          // checking if there is already a source connected to the target:
          // find all the nodes connected to the target node and
          // return without making the connection if a connection already exists
          if (get().edges.find((edge) => edge.target === params.target)) {
            console.log(
              'Store.isValidConnection: There is already a source connected to the target',
            );
            return false;
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
            return false;
          }
          // check source status
          if (sourceNode.data.status !== 'success') {
            console.log(
              'Store.OnConnect: Source node is not ready. Source status:',
              sourceNode.data.status,
            );
            return false;
          }
          // check connection pairs and connect if valid
          if (
            validConnectionPairs.some(
              ([sourceType, targetType]) =>
                sourceNode?.type === sourceType &&
                targetNode?.type === targetType,
            )
          ) {
            return true;
          } else {
            console.log(
              'Store.OnConnect: Invalid connection pair',
              sourceNode?.type,
              targetNode?.type,
            );
            return false;
          }
        },
        onConnect: (params: Connection) => {
          if (!get().workspacePath || !params.source || !params.target) {
            return;
          }
          console.log('Store.OnConnect: Trying to connect', params);
          if (get().actions.isValidConnection(params)) {
            console.log('Store.OnConnect: Valid connection');
            get().actions.addEdge({
              id: nanoid(), // testing using the same id for tb and storeand creating it here
              source: params.source,
              target: params.target,
            });
          } else {
            console.log('Store.OnConnect: Invalid connection');
          }
        },
        checkSourceIsConnected: (targetId: string) => {
          const edge = get().edges.find((edge) => edge.target === targetId);
          if (!edge) {
            console.log('Store.checkSourceIsConnected: No connection found');
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
              'Store.checkSourceIsConnected: sourceNode in other status',
              sourceNode,
            );
            return false;
          } else {
            // this shoudn't be allowed either
            console.log(
              'Store.checkSourceIsConnected: No source found but the edge exsists',
              edge,
            );
            return false;
          }
        },
        getSourceData: (targetId: string) => {
          const edge = get().edges.find((edge) => edge.target === targetId);
          if (!edge) {
            console.log('Store.getSourceData: No connection found');
            return undefined;
          }
          const sourceNode = get().nodes.find(
            (node) => node.id === edge.source,
          );
          if (sourceNode) {
            return sourceNode.data;
          } else {
            console.log(
              'Store.getSourceData: No source found but the edge exsists',
              edge,
            );
            return undefined;
          }
        },
        onNodeDragStop: () => {
          get().actions.updateStateSnapshot();
        },
        onNodesDelete: (nodesToDelete: Node<NodeData>[] | undefined) => {
          if (!nodesToDelete) {
            return;
          }
          console.log('Store.onNodesDelete: node delete', nodesToDelete);
          // delete nodes from the nodes array
          const nodes = get().nodes.filter(
            (node) => !nodesToDelete.find((n) => n.id === node.id),
          );
          set({
            nodes,
          });
          // delete edges from the edges array
          const edges = get().edges.filter(
            (edge) =>
              !nodesToDelete.find(
                (node) => node.id === edge.source || node.id === edge.target,
              ),
          );
          set({
            edges,
          });
          get().actions.updateStateSnapshot();
        },
        onEdgesDelete: (edgesToDelete: Edge[] | undefined) => {
          if (!edgesToDelete) {
            return;
          }
          console.log('Store.onEdgesDelete: edge delete', edgesToDelete);
          // delete edges from the edges array
          const edges = get().edges.filter(
            (edge) => !edgesToDelete.find((e) => e.id === edge.id),
          );
          set({
            edges,
          });
          get().actions.updateStateSnapshot();
        },
        onUpdateNode: ({ id, data }: { id: string; data: NodeData }) => {
          const nodes = get().nodes;
          const node = nodes.find((node) => node.id === id);
          if (node) {
            node.data = { ...node.data, ...data } as NodeData;
            set({
              nodes,
            });
            get().actions.updateStateSnapshot();
          }
        },
        setWorkspacePath: (workspacePath: string) => {
          set({
            workspacePath: workspacePath,
          });
        },
      },
    }),
    {
      name: 'workspace-path',
      partialize: (state) => ({
        workspacePath: state.workspacePath,
        stateSnapshot: state.stateSnapshot,
        nodes: state.nodes,
        edges: state.edges,
      }),
    },
  ),
);

// // Log every time state is changed
// type Logger = <
//   T,
//   Mps extends [StoreMutatorIdentifier, unknown][] = [],
//   Mcs extends [StoreMutatorIdentifier, unknown][] = [],
// >(
//   f: StateCreator<T, Mps, Mcs>,
//   name?: string,
// ) => StateCreator<T, Mps, Mcs>;

// type LoggerImpl = <T>(
//   f: StateCreator<T, [], []>,
//   name?: string,
// ) => StateCreator<T, [], []>;

// const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
//   const loggedSet: typeof set = (...a) => {
//     set(...a);
//     console.log(...(name ? [`${name}:`] : []), get());
//   };
//   store.setState = loggedSet;

//   return f(loggedSet, get, store);
// };

// export const logger = loggerImpl as unknown as Logger;

// // this is our useStore hook that we can use in our components to get parts of the store and call actions
// const useLoggerStore = create<RFStore>()(
//   persist(
//     logger(
//       (set, get) => ({
//         ...initialState,
//         actions:
//           useSilentStore((state) => state.actions, (a) => {
//             console.log('useLoggerStore: ', a);
//           }),
//       }),
//       'useStore',
//     ),
//     {
//       name: 'workspace-path',
//       // storage: createJSONStorage(() => localStorage),
//       partialize: (state) => ({
//         workspacePath: state.workspacePath,
//         stateSnapshot: state.stateSnapshot,
//         nodes: state.nodes,
//         edges: state.edges,
//       }),
//     },
//   ),
// );

export const useStore = useSilentStore;

export const useStoreActions = () => useStore((state) => state.actions);
