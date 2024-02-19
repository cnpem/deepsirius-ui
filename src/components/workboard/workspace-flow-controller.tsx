import {
  ArrowBigLeft,
  CoffeeIcon,
  DatabaseIcon,
  DumbbellIcon,
  PlusCircle,
} from 'lucide-react';
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
import { WorkspaceSelector } from '~/components/workboard/workspace-select';
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
function Geppetto({ workspacePath }: { workspacePath: string }) {
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
  const { mutate: updateDbState } =
    api.workspaceDbState.updateWorkspace.useMutation({
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
      path: workspacePath,
      state: stateSnapshot,
    });
  }, [updateDbState, stateSnapshot, workspacePath]);

  const handleNodesDelete = useCallback(() => {
    const [protectedNodes, deletableNodes] = nodes.reduce(
      (acc, node) => {
        if (node.selected) {
          if (node.data.status === 'busy') {
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
      toast.error('Cannot delete busy nodes');
    }
    if (deletableNodes.length === 0) return;
    // delete remote files
    deletableNodes.forEach((node) => {
      if (!node.data.remotePath) return;
      if (node.type === 'dataset') {
        rmFile({ path: node.data.remotePath });
      }
      if (node.type === 'network') {
        rmDir({ path: node.data.remotePath });
      }
    });
    onNodesDelete(deletableNodes);
  }, [nodes, onNodesDelete, rmDir, rmFile]);

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
      console.log('cannot delete edges to protected nodes', protectedEdges);
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
    <div className="h-screen p-1">
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
          <span className="flex w-fit rounded-sm border bg-muted p-2 text-xs font-semibold text-slate-500 dark:text-slate-400 ">
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
          className="bg-transparent px-1 dark:fill-slate-400 [&>button:hover]:dark:bg-slate-700 [&>button:hover]:dark:fill-slate-100 [&>button]:my-2 [&>button]:h-6 [&>button]:w-6 [&>button]:rounded-sm [&>button]:border-none [&>button]:dark:bg-muted"
        >
          <ControlThemeButton />
          <ControlHelpButton />
        </Controls>
        <MiniMap
          nodeColor={nodeColor}
          nodeComponent={MiniMapNode}
          className="-translate-y-8 translate-x-2 scale-90 rounded-lg border p-2 dark:bg-muted"
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
        <span className="font-semibold text-purple-500 dark:text-purple-400">
          nodes
        </span>{' '}
        to your workspace by clicking on the{' '}
        <PlusCircle className="inline h-5 w-5" /> button on the top left corner.
      </AlertDescription>
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

/**
 * The Flow component is the component that manages the selection of a workspace ReactFlow instance (managed by Geppetto)
 * @returns the WorkspaceSelectDialog component if no workspacePath is set in the store or the Geppetto (Workspace Flow component) if it is
 */
export default function Flow() {
  const { workspacePath } = useStore();

  if (!workspacePath) {
    return <WorkspaceSelector />;
  }

  return <Geppetto workspacePath={workspacePath} />;
}
