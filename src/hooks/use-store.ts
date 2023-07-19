import { useCallback } from 'react';
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
  type XYPosition,
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

type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  workspacePath?: string;
  enableQuery: boolean;
};

type RFActions = {
  resetStore: () => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  checkConnectedSource: (targetId: string) => boolean;
  setEnableQuery: (enableQuery: boolean) => void;
  setWorkspacePath: (workspacePath: string) => void;
  onUpdateNode: ({ id, data }: { id: string; data: NodeData }) => void;
  initNodes: (nodes: Node<NodeData>[]) => void;
  addNode: (node: Node<NodeData>) => void;
};

export type RFStore = RFState & {
  actions: RFActions;
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

const initialState: RFState = {
  nodes: [],
  edges: [],
  workspacePath: undefined,
  enableQuery: true,
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<RFStore>()(
  persist(
    logger(
      (set, get) => ({
        ...initialState,
        actions: {
          setEnableQuery: (enableQuery: boolean) => {
            set({ enableQuery });
          },
          resetStore: () => {
            set(initialState);
          },
          initNodes: (nodes: Node<NodeData>[]) => {
            set({
              nodes: nodes,
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
// returns the query state and update the store state data when the query is done
// should be called in the compnent that renders the data from the query
export const useInitStoreQuery = () => {
  const { enableQuery } = useStoreEnableQuery();
  const { workspacePath } = useStoreWorkspacePath();
  const { setEnableQuery, initNodes } = useStoreActions();
  const { isLoading, isError } = api.workspace.getWorkspaceNodes.useQuery(
    { workspacePath: workspacePath as string },
    {
      enabled: enableQuery && !!workspacePath,
      onSuccess: (data) => {
        console.log('Store: onSuccess: query node data', data);
        const Nodes: Node<NodeData>[] = data.map((node) => {
          return {
            id: node.componentId,
            type: node.type,
            position: JSON.parse(node.position) as XYPosition,
            data: {
              registryId: node.id,
              status: node.status as Status,
              xState: node.xState,
            },
          } as Node<NodeData>;
        });
        initNodes(Nodes);
        setEnableQuery(false);
      },
    },
  );

  return {
    isLoading,
    isError,
  };
};

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

// hook for creating a session on the store and loading the database and leaving the session on unmount and reseting the store
export const useWorkspaceSession = () => {
  // store action
  const { setWorkspacePath, resetStore } = useStoreActions();
  const { workspacePath } = useStoreWorkspacePath();

  // returning the actions triggered by setPath
  return {
    workspacePath,
    setWorkspacePath,
    resetStore,
  };
};
