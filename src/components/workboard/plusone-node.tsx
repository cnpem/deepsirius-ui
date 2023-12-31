import { Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { type Node, type XYPosition } from 'reactflow';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { ToastAction } from '~/components/ui/toast';
import { useToast } from '~/components/ui/use-toast';
import {
  type AllowedNodeTypes,
  AllowedNodeTypesList,
  type NodeData,
  useStore,
  useStoreActions,
} from '~/hooks/use-store';

// selects the type of node to be created using a dropdown menu
export function PlusOneNode() {
  const { nodes, workspacePath } = useStore((state) => ({
    workspacePath: state.workspacePath,
    nodes: state.nodes,
  }));
  const { addNode } = useStoreActions();
  const { toast } = useToast();

  const onNodeAdd = (nodeType: AllowedNodeTypes) => {
    if (!workspacePath) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Looks like the workspace was not loaded properly.',
        action: (
          <ToastAction
            altText="Reload the view"
            onClick={() => window.location.reload()}
          >
            Reload the view
          </ToastAction>
        ),
      });
      return;
    }
    const nodesMaxX = Math.max(...nodes.map((node) => node.position.x));
    const nodesMinX = Math.min(...nodes.map((node) => node.position.x));
    const nodesMinY = Math.min(...nodes.map((node) => node.position.y));
    const initialPostition: XYPosition = {
      x: (nodesMinX + (nodesMaxX - nodesMinX) / 2) | 0,
      y: (nodesMinY - 200) | 0,
    };
    const nodeid = nanoid();
    const newNode: Node<NodeData> = {
      id: nodeid,
      type: nodeType,
      position: initialPostition,
      data: {
        workspacePath,
        status: 'active',
        xState: '',
        remoteFsDataPath: '',
      },
    };
    // now that the node is created in the database, we can add it to the store with an always defined registryId
    addNode(newNode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="transition data-[state=open]:rotate-45 scale-100 data-[state=open]:scale-75"
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
        {AllowedNodeTypesList.map((typeName) => (
          <DropdownMenuItem onSelect={() => onNodeAdd(typeName)} key={typeName}>
            {typeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
