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
import { toast } from '~/components/ui/use-toast';
import {
  NodeTypesList,
  type Status,
  useStoreActions,
  useStoreWorkspacePath,
} from '~/hooks/use-store';
import { type NodeData } from '~/hooks/use-store';
import { api } from '~/utils/api';

// selects the type of node to be created using a dropdown menu
export function PlusOneNode() {
  const { mutate } = api.workspace.createNewNode.useMutation({
    onSuccess: (data) => {
      console.log('new node created:', data);
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
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast({
          variant: 'destructive',
          title: 'Failed to create in the database!',
          description: errorMessage[0],
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to create in the database!',
          description: 'Something went wrong. Please try again.',
        });
      }
    },
  });

  const { addNode } = useStoreActions();
  const { workspacePath } = useStoreWorkspacePath();

  const createNewNode = (nodeType: string) => {
    console.log('create new node of type:', nodeType);
    if (!workspacePath) {
      toast({
        variant: 'destructive',
        title: 'Error: Failed to create!',
        description: 'workspacePath is not set in the store.',
      });
      return;
    }
    // creating the new node in the database
    mutate({
      workspacePath: workspacePath,
      type: nodeType,
      componentId: nanoid(),
      position: { x: 0, y: 0 },
      status: 'inactive',
      xState: '',
    });
  };
  // the nodes that can be builded are defined in NodeTypesList except for the type "new"
  // which is used to create a new node
  const nodeTypesAllowed = NodeTypesList.filter(
    (nodeType) => nodeType !== 'new',
  );

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
        {nodeTypesAllowed.map((nodeType) => (
          <DropdownMenuItem
            onSelect={() => createNewNode(nodeType)}
            key={nodeType}
          >
            {nodeType}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
