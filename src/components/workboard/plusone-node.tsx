import { Plus } from 'lucide-react';
import { type Node, type NodeProps, useReactFlow } from 'reactflow';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { NodeTypesList } from '~/components/workboard/flow';
import { type NodeData, customGrid } from '~/components/workboard/nodes';

// selects the type of node to be created using a dropdown menu
export function PlusOneNode({ data }: NodeProps<NodeData>) {
  const { getNodes, addNodes, fitView } = useReactFlow<NodeData>();

  const createNewNode = (nodeType: string) => {
    console.log('create new node', nodeType);
    const nodes = getNodes();
    const newNode: Node<NodeData> = {
      id: `${nodes.length + 1}`,
      type: nodeType,
      position: {
        // TODO: fix this
        x: customGrid.plusOne?.x ?? 0,
        y: customGrid.plusOne?.y ? customGrid.plusOne.y + 50 : 50,
      },
      data: {
        label: 'undefined',
        xState: 'undefined',
        workspacePath: data.workspacePath,
      },
    };
    addNodes([newNode]);
    fitView({ padding: 0.9, minZoom: 1, includeHiddenNodes: true });
  };
  // the nodes that can be builded are defined in NodeTypesList except for the type "new"
  // which is used to create a new node
  const nodeTypesAllowed = NodeTypesList.filter(
    (nodeType) => nodeType !== 'new',
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="data-[state=open]:rotate-45" asChild>
        <Button variant={'default'} size={'icon'} className="rounded-full">
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
