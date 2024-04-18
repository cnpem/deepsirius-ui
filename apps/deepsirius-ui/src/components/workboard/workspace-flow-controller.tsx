import { ArrowBigLeftIcon, PlusCircle } from 'lucide-react';
import ErrorPage from 'next/error';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import CustomConnectionLine from '~/components/workboard/connection-line';
import {
  type NodeData,
  type WorkspaceInfo,
  useStore,
  useStoreActions,
} from '~/hooks/use-store';
import { DatasetNode } from '~/components/workboard/dataset-node';
import { InferenceNode } from '~/components/workboard/inference-node';
import { NetworkNode } from '~/components/workboard/network-node';
import { FinetuneNode } from '~/components/workboard/finetune-node';
import { AugmentationNode } from '~/components/workboard/augmentation-node';

import { api } from '~/utils/api';

import { AvatarDrop } from '../avatar-dropdown';
import { ControlHelpButton } from '../help';
import { LayoutNav } from '../layout-nav';
import AlertDelete from '~/components/alert-delete';
import { PlusOneMenu } from '~/components/workboard/plusone-menu';
import NodeIcon from '~/components/workboard/node-components/node-icon';

const nodeTypes: NodeTypes = {
  dataset: DatasetNode,
  augmentation: AugmentationNode,
  network: NetworkNode,
  finetune: FinetuneNode,
  inference: InferenceNode,
};

function getTargetNodes(
  sourceNodeId: string,
  edges: Edge[],
  nodes: Node<NodeData>[],
) {
  const targetNodesIds: string[] = edges
    .filter((edge) => edge.source === sourceNodeId)
    .map((edge) => edge.target);
  const targetNodes: Node<NodeData>[] = nodes.filter((node) =>
    targetNodesIds.includes(node.id),
  );
  return targetNodes;
}

function Geppetto({ workspaceInfo }: { workspaceInfo: WorkspaceInfo }) {
  const [alertOpen, setAlertOpen] = useState(false);
  const {
    onConnect,
    onNodeDragStop,
    onNodesDelete,
    onEdgesDelete,
    onEdgesChange,
    onNodesChange,
  } = useStoreActions();
  const { nodes, edges, stateSnapshot } = useStore();
  const { mutate: updateDbState } = api.db.updateWorkspace.useMutation({
    onError: (error) => {
      console.log('dbstate update error', error);
    },
  });
  const { mutate: rmFile } = api.ssh.rmFile.useMutation({
    onError: () => {
      toast.error('Error deleting file');
    },
  });
  const { mutate: rmDir } = api.ssh.rmDir.useMutation({
    onError: () => {
      toast.error('Error deleting directory');
    },
  });

  useEffect(() => {
    updateDbState({
      path: workspaceInfo.path,
      state: stateSnapshot,
    });
  }, [updateDbState, stateSnapshot, workspaceInfo.path]);

  const handleDeleteDatasetAndAugmentationNode = useCallback(
    (selectedNode: Node<NodeData>) => {
      // this node can be deleted if its targets are not protected or if its not busy
      if (selectedNode.data.status === 'busy') {
        toast.error('Cannot delete busy node');
        return;
      }
      const targetNodes = getTargetNodes(selectedNode.id, edges, nodes);
      const hasProtectedTargetNodes = targetNodes.some(
        (node) => node.data.status === 'busy' || node.data.status === 'success',
      );
      if (hasProtectedTargetNodes) {
        toast.error(
          'Cannot delete network node with protected inference nodes',
        );
        return;
      }
      // delete the remote files
      const remotePath = selectedNode.data.remotePath;
      if (remotePath) {
        rmFile({ path: remotePath });
      }
      // delete the node on the store
      onNodesDelete([selectedNode]);
      toast.info('Dataset node deleted');
      return;
    },
    [edges, nodes, onNodesDelete, rmFile],
  );

  const handleDeleteNetworkNode = useCallback(
    (selectedNode: Node<NodeData>) => {
      if (selectedNode.data.status === 'busy') {
        toast.error('Cannot delete busy node');
        return;
      }

      const targetNodes = getTargetNodes(selectedNode.id, edges, nodes);
      const hasProtectedInferenceNodes = targetNodes.some((node) => {
        if (node.data.status === 'busy') return true;
        if (node.type === 'inference' && node.data.status === 'success') {
          return true;
        }
        return false;
      });
      if (hasProtectedInferenceNodes) {
        toast.error(
          'Cannot delete network node with protected inference nodes',
        );
        return;
      }

      // get target finetune nodes and the target finetune nodes of the target finetune nodes
      function getTargetFinetuneNodes(node: Node<NodeData>) {
        const targetFinetuneNodes = getTargetNodes(
          node.id,
          edges,
          nodes,
        ).filter((node) => node.type === 'finetune');
        const targetNodesOfTargetNodes: Node<NodeData>[] = [];
        targetFinetuneNodes.forEach((node) => {
          targetNodesOfTargetNodes.push(...getTargetFinetuneNodes(node));
        });
        return [...targetFinetuneNodes, ...targetNodesOfTargetNodes];
      }
      const targetFinetuneNodes = getTargetFinetuneNodes(selectedNode);

      const hasProtectedFinetuneNodes = targetFinetuneNodes.some(
        (node) => node.data.status === 'busy',
      );
      if (hasProtectedFinetuneNodes) {
        toast.error('Cannot delete network node with protected finetune nodes');
        return;
      }

      if (targetFinetuneNodes.length > 0) {
        onNodesDelete(targetFinetuneNodes);
        toast.info('Related Finetune nodes deleted');
      }

      // delete the remote files
      const remotePath = selectedNode.data.remotePath;
      if (remotePath) {
        rmDir({ path: remotePath });
      }
      // delete the node on the store
      onNodesDelete([selectedNode]);
      toast.info('Network node deleted');
      return;
    },
    [edges, nodes, onNodesDelete, rmDir],
  );

  const handleDeleteFinetuneNode = useCallback(
    (selectedNode: Node<NodeData>) => {
      // this node cant be deleted if its a target node or if its busy
      if (selectedNode.data.status === 'busy') {
        toast.error('Cannot delete busy node');
        return;
      }

      const isTarget = edges.some((edge) => edge.target === selectedNode.id);
      if (isTarget) {
        toast.error(
          'Cannot delete finetune node with connected nodes. You must delete the parent network node.',
        );
        return;
      }
      // delete the node on the store
      onNodesDelete([selectedNode]);
      toast.info('Finetune node deleted');
      return;
    },
    [edges, onNodesDelete],
  );

  const handleDeleteInferenceNode = useCallback(
    (selectedNode: Node<NodeData>) => {
      // this node cant be deleted if its busy
      if (selectedNode.data.status === 'busy') {
        toast.error('Cannot delete busy node');
        return;
      }
      // delete the node on the store
      onNodesDelete([selectedNode]);
      toast.info('Inference node deleted');
      return;
    },
    [onNodesDelete],
  );

  const handleNodesDelete = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    // delete dataset and augmentation nodes
    const selectedDatasetAndAugmentationNodes = selectedNodes.filter(
      (node) => node.type === 'dataset' || node.type === 'augmentation',
    );
    if (selectedDatasetAndAugmentationNodes.length > 0) {
      selectedDatasetAndAugmentationNodes.forEach((selectedNode) =>
        handleDeleteDatasetAndAugmentationNode(selectedNode),
      );
      return;
    }
    // delete network nodes
    const selectedNetworkNodes = selectedNodes.filter(
      (node) => node.type === 'network',
    );
    if (selectedNetworkNodes.length > 0) {
      selectedNetworkNodes.forEach((selectedNode) =>
        handleDeleteNetworkNode(selectedNode),
      );
      return;
    }
    // delete finetune nodes
    const selectedFinetuneNodes = selectedNodes.filter(
      (node) => node.type === 'finetune',
    );
    if (selectedFinetuneNodes.length > 0) {
      selectedFinetuneNodes.forEach((selectedNode) =>
        handleDeleteFinetuneNode(selectedNode),
      );
      return;
    }
    // delete inference nodes
    const selectedInferenceNodes = selectedNodes.filter(
      (node) => node.type === 'inference',
    );
    if (selectedInferenceNodes.length > 0) {
      selectedInferenceNodes.forEach((selectedNode) =>
        handleDeleteInferenceNode(selectedNode),
      );
      return;
    }
  }, [
    nodes,
    handleDeleteNetworkNode,
    handleDeleteFinetuneNode,
    handleDeleteDatasetAndAugmentationNode,
    handleDeleteInferenceNode,
  ]);

  const handleEdgesDelete = useCallback(() => {
    const nodeIsProtected = (nodeId: string) => {
      const status = nodes.find((node) => node.id === nodeId)?.data.status;
      return status === 'busy' || status === 'success';
    };
    const [protectedEdges, deletableEdges] = edges.reduce(
      (acc, edge) => {
        if (edge.selected) {
          if (nodeIsProtected(edge.target)) {
            acc[0].push(edge);
          } else {
            acc[1].push(edge);
          }
        }
        return acc;
      },
      [[], []] as [Edge[], Edge[]],
    );
    // show error message if some edges should not be deleted
    if (protectedEdges.length > 0) {
      toast.error('Cannot delete edges to protected nodes');
    }
    if (deletableEdges.length === 0) return;
    // remove deletable edges from the store
    onEdgesDelete(deletableEdges);
  }, [edges, nodes, onEdgesDelete]);

  useHotkeys(['backspace', 'del', 'Delete'], () => {
    // check if there are selected nodes
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length > 0) {
      setAlertOpen(true);
    }
    const selectedEdges = edges.filter((edge) => edge.selected);
    if (selectedEdges.length > 0) {
      handleEdgesDelete();
    }
  });

  const variant = BackgroundVariant.Dots;

  const nodeColor = (node: Node<NodeData>) => {
    switch (node.data.status) {
      case 'active':
        return '#4CAF50';
      case 'busy':
        return '#FFC107';
      case 'error':
        return '#F44336';
      case 'success':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  //TODO: would be nice to change the height for full screen mode to h-[930px]
  return (
    <div className="h-screen">
      <AlertDelete
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onConfirm={handleNodesDelete}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        deleteKeyCode={[]} // disable delete key
        connectionLineComponent={CustomConnectionLine}
        nodeTypes={nodeTypes}
        fitView
      >
        <Panel position="top-left" className="flex flex-col gap-2">
          <PlusOneMenu />
        </Panel>
        <Panel position="bottom-center">
          <span className="flex w-fit rounded-sm border bg-muted p-2 text-sm font-semibold text-slate-500 dark:text-slate-400 ">
            <span className="mr-2 text-purple-500 dark:text-purple-400">
              Workspace:
            </span>
            {`"${workspaceInfo.name}"`}
          </span>
        </Panel>
        {nodes.length === 0 && (
          <Panel position="top-center">
            <AlertDemo />
          </Panel>
        )}
        <Panel position="top-right">
          <div id="node-props-panel"></div>
          <AvatarDrop />
        </Panel>
        <Controls
          showZoom={false}
          showInteractive={false}
          className="bg-transparent px-1 dark:fill-slate-400 [&>button:hover]:dark:bg-slate-700 [&>button:hover]:dark:fill-slate-100 [&>button]:my-2 [&>button]:h-6 [&>button]:w-6 [&>button]:rounded-sm [&>button]:border-none [&>button]:dark:bg-muted"
        >
          <ControlHelpButton />
        </Controls>
        <MiniMap
          nodeColor={nodeColor}
          nodeComponent={MiniMapNode}
          maskColor="rgba(0,0,0,0.2)"
          className="scale-90 rounded-sm dark:bg-muted/70"
          pannable
          zoomable
        />
        <Background
          className="bg-light-ocean dark:bg-dark-ocean"
          variant={variant}
          gap={24}
        />
      </ReactFlow>
    </div>
  );
}

function MiniMapNode({
  x,
  y,
  color,
  id,
  width,
  height,
}: {
  x: number;
  y: number;
  color: string;
  id: string;
  width: number;
  height: number;
}) {
  const { nodes } = useStore();
  const node = nodes.find((n) => n.id === id);
  if (!node) return null;
  if (!node.type) return null;
  return (
    <NodeIcon
      nodeType={node.type}
      width={1.2 * width}
      height={1.2 * height}
      x={x}
      y={y}
      stroke={color}
      fillOpacity={0.5}
      fill={color}
    />
  );
}

function AlertDemo() {
  return (
    <Alert className="flex flex-row gap-4 p-4 [&:has(svg)]:p-4">
      <div className="flex items-center">
        <ArrowBigLeftIcon className="position-relative h-6 w-6 animate-bounce-x" />
      </div>
      <div>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add{' '}
          <span className="font-semibold text-purple-500 dark:text-purple-400">
            nodes
          </span>{' '}
          to your workspace by clicking on the{' '}
          <PlusCircle className="inline h-5 w-5" /> button on the top left
          corner.
        </AlertDescription>
      </div>
    </Alert>
  );
}

export default function FlowRouter() {
  const {
    initNodes,
    initEdges,
    setWorkspaceInfo,
    resetStore,
    updateStateSnapshot,
  } = useStoreActions();
  const { workspaceInfo } = useStore();
  const storeWorkspace = workspaceInfo?.name;
  const router = useRouter();
  const routeWorkspace = router.query.workspace as string; // parent component should handle the case when workspace is undefined
  const workspaceChanged = routeWorkspace !== storeWorkspace;

  const { data, error, isLoading } = api.db.getWorkspaceByName.useQuery(
    {
      name: routeWorkspace,
    },
    {
      enabled: workspaceChanged,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    if (workspaceChanged && !!data?.path) {
      if (storeWorkspace) {
        toast.info(`Leaving workspace ${storeWorkspace}`);
      }
      toast.info(`Switching to workspace ${routeWorkspace}`);
      resetStore();
      setWorkspaceInfo({
        name: data.name,
        path: data.path,
      });
      if (!!data.state) {
        const { nodes, edges } = JSON.parse(data.state) as {
          nodes: Node<NodeData>[];
          edges: Edge[];
        };
        if (nodes) initNodes(nodes);
        if (edges) initEdges(edges);
      }
      updateStateSnapshot();
    }
  }, [
    data,
    workspaceChanged,
    resetStore,
    setWorkspaceInfo,
    initNodes,
    initEdges,
    storeWorkspace,
    routeWorkspace,
    updateStateSnapshot,
  ]);

  const canCreateWorkspace = !workspaceChanged && workspaceInfo;
  const searchingWorkspace = workspaceChanged && !error;

  if (canCreateWorkspace) return <Geppetto workspaceInfo={workspaceInfo} />;

  if (searchingWorkspace) {
    return (
      <LayoutNav title="Loading workspace...">
        <div className="my-40 flex flex-row items-center justify-center gap-4">
          <p className="text-center text-slate-300">Loading workspace...</p>
          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-4 border-sky-600"></div>
        </div>
      </LayoutNav>
    );
  }

  if (error) {
    console.error('error', error);
    return <ErrorPage statusCode={500} title={error.message} />;
  }

  console.error('Forbidden state!');
  console.error('workspaceChanged', workspaceChanged);
  console.error('workspaceInfo', workspaceInfo);
  console.error('workspaceInRoute', routeWorkspace);
  console.error('data', data);
  console.error('isLoading', isLoading);
  console.error('error', error);

  return <ErrorPage statusCode={404} />;
}
