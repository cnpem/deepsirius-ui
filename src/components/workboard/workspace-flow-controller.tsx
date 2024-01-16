import { ArrowBigLeft, PlusCircle } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
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
    onNodesChange,
  } = useStoreActions();
  const { nodes, edges, stateSnapshot } = useStore();
  const { mutate: updateDbState } =
    api.workspaceDbState.updateWorkspace.useMutation({
      onSuccess: () => {
        console.log('dbstate updated successfully');
      },
      onError: (error) => {
        console.log('dbstate update error', error);
      },
    });
  const { mutate: deleteNodeFiles } = api.remotefiles.remove.useMutation({
    onSuccess: () => {
      console.log('node files deleted successfully');
    },
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

  const handleNodesDelete = useCallback(
    (nodesToDelete: Node<NodeData>[]) => {
      console.log('nodes to delete', nodesToDelete);
      if (nodesToDelete) {
        // delete the files and directories in the remote filesystem if the node has a remoteFsDataPath
        nodesToDelete.forEach((node) => {
          if (node.data.remotePath) {
            deleteNodeFiles({
              path: node.data.remotePath,
            });
          }
        });
        // delete the nodes from the store
        onNodesDelete(nodesToDelete);
      }
    },
    [deleteNodeFiles, onNodesDelete],
  );

  const variant = BackgroundVariant.Dots;

  const nodeColor = (node: Node<NodeData>) => {
    switch (node.type) {
      case 'dataset':
        return '#6ede87';
      case 'new':
        return '#eb0ee3';
      case 'network':
        return '#3162c4';
      case 'inference':
        return '#eb870e';
      default:
        return '#ff0072';
    }
  };

  //TODO: would be nice to change the height for full screen mode to h-[930px]
  return (
    <div className="p-2 h-[calc(100vh-65px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange} // this is not needed because the edges are not editable, only deletable
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={onEdgesDelete}
        connectionLineComponent={CustomConnectionLine}
        nodeTypes={nodeTypes}
        fitView
      >
        <Panel position="top-left" className="flex flex-col gap-2">
          <PlusOneNode />
        </Panel>
        <Panel position="bottom-center" className="flex flex-col gap-2">
          <span className="text-xs font-semibold border rounded-sm p-2 bg-muted text-slate-500 dark:text-slate-400 ">
            <span className="text-purple-500 dark:text-purple-400">
              Workspace:
            </span>{' '}
            {workspacePath}
          </span>
        </Panel>
        {nodes.length === 0 && (
          <Panel position="top-center" className="flex flex-col gap-2">
            <AlertDemo />
          </Panel>
        )}
        <Panel position="top-right">
          <div id="node-props-panel"></div>
        </Panel>
        <Controls
          showZoom={false}
          className="bg-transparent px-1 dark:fill-white [&>button:hover]:dark:bg-slate-700 [&>button]:dark:bg-muted [&>button]:rounded-sm [&>button]:border-none [&>button]:my-2"
        ></Controls>
        <MiniMap
          nodeColor={nodeColor}
          className="dark:bg-muted rounded-sm border p-2"
          pannable
          zoomable
        />
        <Background variant={variant} gap={12} />
      </ReactFlow>
    </div>
  );
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
