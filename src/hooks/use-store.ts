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
  type XYPosition,
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

export const AllowedNodeTypesList = Object.keys(nodeTypes).filter(
  (nodeType) => nodeType !== 'new',
);

export type AllowedNodeTypes = (typeof AllowedNodeTypesList)[number];

const validConnectionPairs = [
  ['dataset', 'network'],
  ['network', 'inference'],
];

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
  isValidConnection: (edge: Edge | Connection) => boolean;
  checkConnectedSource: (targetId: string) => boolean;
  setEnableQuery: (enableQuery: boolean) => void;
  setWorkspacePath: (workspacePath: string) => void;
  onUpdateNode: ({ id, data }: { id: string; data: NodeData }) => void;
  initNodes: (nodes: Node<NodeData>[]) => void;
  initEdges: (edges: Edge[]) => void;
  addNode: (node: Node<NodeData>) => void;
  addEdge: (edge: Edge) => void;
  onInit: () => void;
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
          onInit: () => {
            if (get().enableQuery) {
              set({ enableQuery: false });
            }
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
          },
          addEdge: (edge: Edge) => {
            set({
              edges: [...get().edges, edge],
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
          isValidConnection: (params: Edge | Connection) => {
            // checking if there is already a source connected to the target:
            // find all the nodes connected to the target node and
            // return without making the connection if a connection already exists
            if (get().edges.find((edge) => edge.target === params.target)) {
              console.log(
                'Store.OnConnect: There is already a source connected to the target',
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
          // onConnect: (params: Edge | Connection) => {
          //   return;
          // },
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

export const useStoreWorkspacePath = () =>
  useStore((state) => ({ workspacePath: state.workspacePath }), shallow);
export const useStoreEnableQuery = () =>
  useStore((state) => ({ enableQuery: state.enableQuery }), shallow);
export const useStoreActions = () => useStore((state) => state.actions);
// returns the query state and update the store state data when the query is done
// should be called in the compnent that renders the data from the query
export const useInitStoreQuery = ({
  workspacePath,
}: {
  workspacePath: string;
}) => {
  const { enableQuery } = useStoreEnableQuery();
  const { initNodes, initEdges } = useStoreActions();
  const nodesQuery = api.workspace.getWorkspaceNodes.useQuery(
    { workspacePath: workspacePath },
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
      },
    },
  );
  const edgesQuery = api.workspace.getWorkspaceEdges.useQuery(
    { workspacePath: workspacePath },
    {
      enabled: enableQuery && !!workspacePath,
      onSuccess: (data) => {
        console.log('Store: onSuccess: query edge data', data);
        const Edges: Edge[] = data.map((edge) => {
          return {
            id: edge.id, // testing using the same id for tb and store
            source: edge.source,
            target: edge.target,
          };
        });
        initEdges(Edges);
      },
    },
  );

  return {
    enableQuery,
    nodesQuery,
    edgesQuery,
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

export const useStoreEdges = () => {
  // store actions
  const { edges } = useStore((state) => ({ edges: state.edges }), shallow);
  const { addEdge, isValidConnection } = useStoreActions();
  const { workspacePath } = useStoreWorkspacePath();
  // db interactions
  const createEdge = api.workspace.createEdge.useMutation({
    onSuccess: (data) => {
      console.log('useStoreEdges: create edge success', data);
      // if success, update the store
      const NewEdge: Edge = {
        id: data.id, // testing using the same id for tb and store
        source: data.source,
        target: data.target,
      };
      addEdge(NewEdge);
    },
    onError: (e) => {
      console.log('useStoreEdges: create edge error', e);
    },
  });
  const deleteEdge = api.workspace.deleteEdge.useMutation();

  // flow callbacks
  const onEdgesDelete: OnEdgesDelete = (edges: Edge[]) => {
    edges.map((edge) => {
      console.log('useStoreEdges: edge delete', edge);
      deleteEdge.mutate({
        registryId: edge.id,
      });
    });
  };

  const onEdgesConnect: OnConnect = (params: Connection) => {
    if (!workspacePath || !params.source || !params.target) return;
    console.log('useStoreEdges: edge connect', params);
    if (isValidConnection(params)) {
      console.log('useStoreEdges: edge connect: valid connection');
      createEdge.mutate({
        workspacePath: workspacePath,
        componentId: nanoid(), // testing using the same id for tb and storeand creating it here
        sourceId: params.source,
        targetId: params.target,
      });
    } else {
      console.log('useStoreEdges: edge connect: invalid connection');
    }
  };

  return {
    edges,
    onEdgesDelete,
    onEdgesConnect,
  };
};

export type OnNodeAdd = (nodeType: AllowedNodeTypes) => void;
export type UpdateNodeDataHandler = ({
  id,
  data,
}: {
  id: string;
  data: NodeData;
}) => void;
export const useStoreNodes = () => {
  // db interactions
  const createNode = api.workspace.createNewNode.useMutation({
    onSuccess: (data) => {
      console.log('useStoreNodes: new node created!');
      const newNode: Node<NodeData> = {
        id: data.componentId,
        type: data.type,
        position: JSON.parse(data.position) as XYPosition,
        data: {
          registryId: data.id,
          status: data.status as Status,
          xState: data.xState,
        },
      };
      // now that the node is created in the database, we can add it to the store with an always defined registryId
      addNode(newNode);
    },
  });
  const updateNodePos = api.workspace.updateNodePos.useMutation();
  const updateNodeData = api.workspace.updateNodeData.useMutation();
  const deleteNode = api.workspace.deleteNode.useMutation();
  // store
  const { nodes, workspacePath } = useStore(
    (state) => ({
      nodes: state.nodes,
      workspacePath: state.workspacePath,
    }),
    shallow,
  );
  const { onUpdateNode, addNode } = useStoreActions();
  // flow callbacks
  const onNodeAdd: OnNodeAdd = (nodeType: AllowedNodeTypes) => {
    console.log('useStoreNodes: node add', nodeType);
    if (!workspacePath) return;
    createNode.mutate({
      workspacePath: workspacePath,
      type: nodeType,
      componentId: nanoid(),
      position: { x: 0, y: 0 },
      status: 'inactive',
      xState: '',
    });
  };

  const onUpdateNodeData: UpdateNodeDataHandler = ({ id, data }) => {
    console.log('useStoreNodes: Node update:', id, data.status);
    onUpdateNode({ id, data });
    updateNodeData.mutate(
      data as { registryId: string; status: string; xState: string },
    );
  };
  const onNodeDragStop: NodeDragHandler = (event, node: Node<NodeData>) => {
    console.log('useStoreNodes: node drag stop', event, node);
    // how to differentiate a real movement from an involuntary click to activate or something else?
    updateNodePos.mutate({
      registryId: node.data.registryId,
      position: node.position as { x: number; y: number },
    });
  };
  const onNodesDelete: OnNodesDelete = (
    nodesToDelete: Node<NodeData>[] | undefined,
  ) => {
    if (!nodesToDelete) {
      return;
    }
    console.log('useStoreNodes: node delete', nodesToDelete);
    nodesToDelete.map((node) => {
      deleteNode.mutate({
        registryId: node.data.registryId,
      });
    });
  };

  return {
    nodes,
    onNodeAdd,
    onUpdateNodeData,
    onNodeDragStop,
    onNodesDelete,
  };
};
