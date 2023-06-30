import { type Node, useReactFlow } from 'reactflow';
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
export function NewNode() {
  const { getNodes, addNodes, fitView } = useReactFlow<NodeData>();

  const createNewNode = (nodeType: string) => {
    console.log('create new node', nodeType);
    const nodes = getNodes();
    const rows = Math.floor(
      nodes.filter((node) => node.type == nodeType).length,
    );
    const newNode: Node<NodeData> = {
      id: `${nodes.length + 1}`,
      type: nodeType,
      position: {
        // TODO: fix this
        x: customGrid[nodeType],
        y: customGrid.rowSpacing * rows,
      },
      data: {
        label: 'undefined',
        xState: 'undefined',
      },
    };
    addNodes([newNode]);
    fitView();
  };
  // the nodes that can be builded are defined in NodeTypesList except for the type "new"
  // which is used to create a new node
  const nodeTypesAllowed = NodeTypesList.filter(
    (nodeType) => nodeType !== 'new',
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="btn btn-primary btn-sm rounded-lg">+</Button>
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
