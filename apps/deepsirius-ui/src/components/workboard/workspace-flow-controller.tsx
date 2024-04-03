import {
  ArrowBigLeftIcon,
  CoffeeIcon,
  DatabaseIcon,
  DumbbellIcon,
  PlusCircle,
} from 'lucide-react';
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
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import CustomConnectionLine from '~/components/workboard/connection-line';
import { PlusOneNode } from '~/components/workboard/plusone-node';
import {
  type NodeData,
  type WorkspaceInfo,
  nodeTypes,
  useStore,
  useStoreActions,
} from '~/hooks/use-store';
import { api } from '~/utils/api';

import { AvatarDrop } from '../avatar-dropdown';
import { ControlHelpButton } from '../help';
import { LayoutNav } from '../layout-nav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

/**
 * The Geppetto component is the main component for the workspace flow
 * It uses the ReactFlow component to render the nodes and edges
 * It also uses the zustand store to manage the state of the nodes and edges
 */
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

  const handleNodesDelete = useCallback(() => {
    const nodeIsProtected = (node: Node<NodeData>) => {
      if (node.data.status === 'busy') return true;
      if (node.data.status === 'success') {
        // check if there are edges connecting this node to a target
        return edges.some((edge) => edge.source === node.id);
      }
      return false;
    };
    const [protectedNodes, deletableNodes] = nodes.reduce(
      (acc, node) => {
        if (node.selected) {
          if (nodeIsProtected(node)) {
            acc[0].push(node);
          } else {
            acc[1].push(node);
          }
        }
        return acc;
      },
      [[], []] as [Node<NodeData>[], Node<NodeData>[]],
    );
    // show error message if some nodes should not be deleted
    if (protectedNodes.length > 0) {
      toast.error('Cannot delete protected nodes');
    }
    if (deletableNodes.length === 0) return;
    // delete remote files
    deletableNodes.forEach((node) => {
      if (!node.data.remotePath) return;
      // deleting inference nodes should not delete remote files
      if (node.type === 'inference') return;
      if (node.type === 'dataset') {
        rmFile({ path: node.data.remotePath });
      }
      if (node.type === 'network') {
        rmDir({ path: node.data.remotePath });
      }
    });
    toast.info('Nodes deleted');
    onNodesDelete(deletableNodes);
  }, [edges, nodes, onNodesDelete, rmDir, rmFile]);

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
          <PlusOneNode />
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
  if (node?.type === 'dataset') {
    return (
      <DatabaseIcon
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
  if (node?.type === 'network') {
    return (
      <DumbbellIcon
        width={1.2 * width}
        height={1.2 * height}
        size={300}
        x={x}
        y={y}
        stroke={color}
        fillOpacity={0.4}
        fill={color}
      />
    );
  }
  if (node?.type === 'inference') {
    return (
      <CoffeeIcon
        width={1.2 * width}
        height={1.2 * height}
        size={300}
        x={x}
        y={y}
        stroke={color}
        fillOpacity={0.4}
        fill={color}
      />
    );
  }
  return null;
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

interface AlertDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
function AlertDelete({ open, onOpenChange, onConfirm }: AlertDeleteProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            files in your workspace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
