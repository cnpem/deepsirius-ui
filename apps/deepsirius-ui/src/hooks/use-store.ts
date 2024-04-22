import { nanoid } from 'nanoid';
import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeDragHandler,
  type OnConnect,
  type OnEdgesChange,
  type OnEdgesDelete,
  type OnNodesChange,
  type OnNodesDelete,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import { toast } from 'sonner';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FormType as DatasetForm } from '~/components/workboard/node-component-forms/dataset-form';
import type { FormType as InferenceForm } from '~/components/workboard/node-component-forms/inference-form';
import type { FormType as NetworkForm } from '~/components/workboard/node-component-forms/network-form';
import type { FormType as FinetuneForm } from '~/components/workboard/node-component-forms/finetune-form';
import type { FormType as AugmentationForm } from '~/components/workboard/node-component-forms/augmentation-form';

const validConnectionPairs = [
  ['dataset', 'augmentation'],
  ['dataset', 'network'],
  ['augmentation', 'network'],
  ['network', 'inference'],
  ['network', 'finetune'],
  ['dataset', 'finetune'],
  ['augmentation', 'finetune'],
  ['finetune', 'finetune'],
];

export type WorkspaceInfo = {
  path: string;
  name: string;
};

export type NodeStatus = 'success' | 'error' | 'active' | 'busy';

export type DatasetData = {
  form: DatasetForm;
  name: string;
  remotePath: string;
};

export type AugmentationData = {
  sourceDatasetName: string;
  form: AugmentationForm;
  name: string;
  remotePath: string;
};

export type NetworkData = {
  sourceDatasetName: string;
  networkType: string;
  form: NetworkForm;
  label: string;
  remotePath: string;
};

export type FinetuneData = {
  sourceDatasetName: string;
  sourceNetworkLabel: string;
  sourceNetworkType: string;
  form: FinetuneForm;
};

export type InferenceData = {
  networkLabel: string;
  form: InferenceForm;
  outputPath: string;
};

export type NodeData = {
  workspacePath: string;
  status: NodeStatus;
  remotePath?: string;
  jobId?: string;
  jobStatus?: string;
  message?: string;
  updatedAt?: string;
  datasetData?: DatasetData;
  augmentationData?: AugmentationData;
  networkData?: NetworkData;
  finetuneData?: FinetuneData;
  inferenceData?: InferenceData;
};

type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  workspaceInfo?: WorkspaceInfo;
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
  setWorkspaceInfo: (workspaceInfo: WorkspaceInfo) => void;
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
  workspaceInfo: undefined,
  stateSnapshot: '',
};

export const useStore = create<RFStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      actions: {
        updateStateSnapshot: () => {
          set({
            stateSnapshot: JSON.stringify({
              nodes: get().nodes,
              edges: get().edges,
            }),
          });
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
          const allowedChanges = changes.filter(
            (change) => change.type !== 'remove',
          );
          set({
            nodes: applyNodeChanges(allowedChanges, get().nodes),
          });
        },
        onEdgesChange: (changes: EdgeChange[]) => {
          const allowedChanges = changes.filter(
            (change) => change.type !== 'remove',
          );

          set({
            edges: applyEdgeChanges(allowedChanges, get().edges),
          });
        },
        isValidConnection: (params: Edge | Connection) => {
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
          // checking if there is already a source connected to the target:
          // find all the nodes connected to the target node and
          // return without making the connection if a connection already exists
          if (get().edges.find((edge) => edge.target === params.target)) {
            // the finetune node is allowed to have two sources, a network (obligatory) and a dataset (optional)
            if (targetNode?.type === 'finetune') {
              const existingSourceNodes = get()
                .edges.filter((edge) => edge.target === params.target)
                .map((edge) =>
                  get().nodes.find((node) => node.id === edge.source),
                );
              // looking for the size of the sourceNodes array
              if (existingSourceNodes.length === 2) {
                console.log(
                  'Store.isValidConnection: Finetune node already has two sources',
                );
                return false;
              }
              // looking at the types of the sourceNodes
              if (
                existingSourceNodes.some(
                  (node) => node?.type === sourceNode?.type,
                )
              ) {
                console.log(
                  'Store.isValidConnection: Finetune node already has a source of the same type',
                );
                return false;
              }
            } else {
              console.log(
                'Store.isValidConnection: Target node already has a source',
              );
              return false;
            }
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
          if (!get().workspaceInfo || !params.source || !params.target) {
            return;
          }
          console.log('Store.OnConnect: Trying to connect', params);
          if (get().actions.isValidConnection(params)) {
            toast.success('Connected');
            const targetType = get().nodes.find(
              (node) => node.id === params.target,
            )?.type;
            if (targetType === 'finetune') {
              // finetune node have named target handles
              const sourceType = get().nodes.find(
                (node) => node.id === params.source,
              )?.type;
              if (sourceType === 'network') {
                params.targetHandle = 'network-target';
                params.sourceHandle = 'finetune-source';
              } else if (sourceType === 'dataset') {
                params.targetHandle = 'dataset-target';
              }
            }
            get().actions.addEdge({
              id: nanoid(),
              source: params.source,
              target: params.target,
              sourceHandle: params.sourceHandle,
              targetHandle: params.targetHandle,
            });
          } else {
            toast.error('Invalid connection');
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
            console.error('Store.getSourceData: No connection found');
            return undefined;
          }
          const sourceNode = get().nodes.find(
            (node) => node.id === edge.source,
          );
          if (sourceNode) {
            return sourceNode.data;
          } else {
            console.error(
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
        setWorkspaceInfo: (workspaceInfo: WorkspaceInfo) => {
          set({
            workspaceInfo: workspaceInfo,
          });
        },
      },
    }),
    {
      name: 'workspace-state',
      partialize: (state) => ({
        workspaceInfo: state.workspaceInfo,
        stateSnapshot: state.stateSnapshot,
        nodes: state.nodes,
        edges: state.edges,
      }),
    },
  ),
);

export const useStoreActions = () => useStore((state) => state.actions);
