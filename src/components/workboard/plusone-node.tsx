import { Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { type Node } from 'reactflow';
import { shallow } from 'zustand/shallow';
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
import { NodeTypesList } from '~/hooks/use-store';
import { type NodeData } from '~/hooks/use-store';
import useStore from '~/hooks/use-store';
import { api } from '~/utils/api';

// selects the type of node to be created using a dropdown menu
export function PlusOneNode() {
  const { mutate } = api.workspace.createNewNode.useMutation({
    onSuccess: (data) => {
      console.log('new node created:', data);
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

  const { nodes, addNode, workspacePath } = useStore(
    (state) => ({
      addNode: state.addNode,
      nodes: state.nodes,
      workspacePath: state.workspacePath,
    }),
    shallow,
  );

  const createNewNode = (nodeType: string) => {
    console.log('create new node of type:', nodeType);
    const newNode: Node<NodeData> = {
      id: nanoid(),
      type: nodeType,
      position: {
        // TODO: fix this
        x: 0,
        y: 0,
      },
      data: {},
    };
    if (!workspacePath) {
      toast({
        variant: 'destructive',
        title: 'Error: Failed to create!',
        description: 'workspacePath is not set in the store.',
      });
      return;
    }
    // registering the new node in the database
    mutate({
      workspacePath: workspacePath,
      type: newNode.type || '', // TODO: this should always be set
      nodeId: newNode.id,
      status: newNode.data.status || '',
      xState: newNode.data.xState || '',
    });
    // Adding a node to the store/flow and adding it to the db are two separate actions
    addNode(newNode);
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
