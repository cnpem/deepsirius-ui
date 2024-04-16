import { Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useReactFlow, type Node, type XYPosition } from 'reactflow';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { type NodeData, useStore, useStoreActions } from '~/hooks/use-store';

const nodeTypes = [
  'dataset',
  'augmentation',
  'network',
  'finetune',
  'inference',
];

// selects the type of node to be created using a dropdown menu
export function PlusOneMenu() {
  const { fitView } = useReactFlow();
  const { nodes, workspaceInfo } = useStore((state) => ({
    workspaceInfo: state.workspaceInfo,
    nodes: state.nodes,
  }));
  const { addNode } = useStoreActions();

  const onNodeAdd = (nodeType: string) => {
    if (!workspaceInfo) {
      toast.error('uh oh! something went wrong', {
        description: 'Looks like the workspace was not loaded properly.',
        action: {
          label: 'Reload the view',
          onClick: () => window.location.reload(),
        },
      });
      return;
    }
    const nodesMaxX = Math.max(...nodes.map((node) => node.position.x));
    const nodesMinX = Math.min(...nodes.map((node) => node.position.x));
    const nodesMinY = Math.min(...nodes.map((node) => node.position.y));
    const nodesMaxY = Math.max(...nodes.map((node) => node.position.y));
    const initialPostition: XYPosition = {
      x: (nodesMinX + (nodesMaxX - nodesMinX) / 2) | 0,
      y: (nodesMinY + (nodesMaxY - nodesMinY) / 2) | 0,
    };
    const nodeid = nanoid();
    const newNode: Node<NodeData> = {
      id: nodeid,
      type: nodeType,
      position: initialPostition,
      data: {
        workspacePath: workspaceInfo.path,
        status: 'active',
      },
    };
    // now that the node is created in the database, we can add it to the store with an always defined registryId
    addNode(newNode);
    fitView({ padding: 0.5 });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="scale-100 transition data-[state=open]:rotate-45 data-[state=open]:scale-75"
        asChild
      >
        <Button
          title="add node"
          variant={'default'}
          size={'icon'}
          className="rounded-full"
        >
          <Plus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Create New Node</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {nodeTypes.map((typeName) => (
          <DropdownMenuItem onSelect={() => onNodeAdd(typeName)} key={typeName}>
            {typeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
