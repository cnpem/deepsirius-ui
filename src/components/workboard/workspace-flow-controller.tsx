import {
  ArrowBigLeft,
  CoffeeIcon,
  DatabaseIcon,
  DumbbellIcon,
  PlusCircle,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';
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
import WorkspaceSelectDialog from '~/components/workboard/workspace-select-dialog';
import {
  type NodeData,
  nodeTypes,
  useStore,
  useStoreActions,
} from '~/hooks/use-store';
import { api } from '~/utils/api';

import { AvatarDrop } from '../avatar-dropdown';
import { ControlHelpButton } from '../help';
import { ControlThemeButton } from '../theme-toggle';

/**
 * The Geppetto component is the main component for the workspace flow
 * It uses the ReactFlow component to render the nodes and edges
 * It also uses the zustand store to manage the state of the nodes and edges
 */
function Geppetto({ workspacePath }: { workspacePath: string }) {
  const {
    onConnect,
    onNodeDragStop,
    onNodesDelete,
    onEdgesDelete,
    onEdgesChange,
    onNodesChange,
  } = useStoreActions();
  const { nodes, edges, stateSnapshot } = useStore();
  const { mutate: updateDbState } =
    api.workspaceDbState.updateWorkspace.useMutation({
      onError: (error) => {
        console.log('dbstate update error', error);
      },
    });
  const { mutate: deleteFiles } = api.remotefiles.remove.useMutation({
    onError: (error) => {
      console.log('node files delete error', error);
    },
  });

  useEffect(() => {
    updateDbState({
      path: workspacePath,
      state: stateSnapshot,
    });
  }, [updateDbState, stateSnapshot, workspacePath]);

  const handleNodesDelete = useCallback(() => {
    const [deletableNodes, protectedNodes] = nodes.reduce(
      (acc, node) => {
        if (node.selected) {
          if (node.data.status === 'busy') {
            acc[1].push(node);
          } else {
            acc[0].push(node);
          }
        }
        return acc;
      },
      [[], []] as [Node<NodeData>[], Node<NodeData>[]],
    );
    // show error message if some nodes should not be deleted
    if (protectedNodes.length > 0) {
      console.log('cannot delete busy nodes', protectedNodes);
      toast.error('Cannot delete busy nodes');
    }
    if (deletableNodes.length === 0) return;
    // delete remote files
    deletableNodes
      .map((node) => node.data.remotePath)
      .filter(Boolean)
      .forEach((p) => {
        deleteFiles({ path: p as string }); // this type assertion is safe because we filter out nodes without remotePath
      });
    // remove nodes from the store
    onNodesDelete(deletableNodes);
  }, [deleteFiles, nodes, onNodesDelete]);

  const handleEdgesDelete = useCallback(() => {
    const nodeIsBusy = (nodeId: string) =>
      nodes.find((node) => node.id === nodeId)?.data.status === 'busy';
    const [deletableEdges, protectedEdges] = edges.reduce(
      (acc, edge) => {
        if (edge.selected) {
          if (nodeIsBusy(edge.target)) {
            acc[1].push(edge);
          } else {
            acc[0].push(edge);
          }
        }
        return acc;
      },
      [[], []] as [Edge[], Edge[]],
    );
    // show error message if some edges should not be deleted
    if (protectedEdges.length > 0) {
      console.log('cannot delete edges to busy nodes', protectedEdges);
      toast.error('Cannot delete edges to busy nodes');
    }
    if (deletableEdges.length === 0) return;
    // remove edges from the store
    onEdgesDelete(deletableEdges);
  }, [edges, nodes, onEdgesDelete]);

  useHotkeys(['backspace', 'del', 'Delete'], () => {
    console.log('i will survive!');
    // check if there are selected nodes
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length > 0) {
      handleNodesDelete();
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
    <div className="p-1 h-screen">
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
          <span className="flex w-fit text-xs font-semibold border rounded-sm p-2 bg-muted text-slate-500 dark:text-slate-400 ">
            <span className="text-purple-500 dark:text-purple-400">
              Workspace:
            </span>{' '}
            {workspacePath}
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
          className="bg-transparent px-1 dark:fill-slate-400 [&>button:hover]:dark:fill-slate-100 [&>button:hover]:dark:bg-slate-700 [&>button]:dark:bg-muted [&>button]:rounded-sm [&>button]:border-none [&>button]:my-2 [&>button]:h-6 [&>button]:w-6"
        >
          <ControlThemeButton />
          <ControlHelpButton />
        </Controls>
        <MiniMap
          nodeColor={nodeColor}
          nodeComponent={MiniMapNode}
          className="border dark:bg-muted rounded-lg p-2 scale-90 -translate-y-8 translate-x-2"
          pannable
          zoomable
        />
        <Background variant={variant} gap={12} />
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
    <Alert>
      <ArrowBigLeft className="h-6 w-6 animate-bounce-x" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add{' '}
        <span className="text-purple-500 dark:text-purple-400 font-semibold">
          nodes
        </span>{' '}
        to your workspace by clicking on the{' '}
        <PlusCircle className="inline h-5 w-5" /> button on the top left corner.
      </AlertDescription>
    </Alert>
  );
}

/**
 * The Flow component is the component that manages the selection of a workspace ReactFlow instance (managed by Geppetto)
 * @returns the WorkspaceSelectDialog component if no workspacePath is set in the store or the Geppetto (Workspace Flow component) if it is
 */
export default function Flow() {
  const { workspacePath } = useStore();

  return (
    <>
      <WorkspaceSelectDialog open={!workspacePath} />
      {!!workspacePath && <Geppetto workspacePath={workspacePath} />}
    </>
  );
}
