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
import { type NodeData } from '~/components/workboard/flow';

// selects the type of node to be created using a dropdown menu
export function CloneNode({ data }: NodeProps<NodeData>) {
  const { getNodes, addNodes, fitView } = useReactFlow<NodeData>();

  const createNewNode = (nodeType: string) => {
    console.log('create new node of type:', nodeType);
    const nodes = getNodes();
    console.log('nodes', nodes);
    const newNode: Node<NodeData> = {
      id: `${nodes.length + 1}`,
      type: nodeType,
      position: {
        // TODO: fix this
        x: 0,
        y: 50,
      },
      data: {
        workspacePath: data.workspacePath,
      },
    };
    addNodes([newNode]);
    fitView({ padding: 0.2, includeHiddenNodes: true });
  };
  // the nodes that can be builded are defined in NodeTypesList except for the type "new"
  // which is used to create a new node
  const nodeTypesAllowed = NodeTypesList.filter(
    (nodeType) => nodeType !== 'new',
  );

  const cloneNode = (nodeType: string) => {
    console.log('clone last existing node of type:', nodeType);
    const nodes = getNodes();
    // get the last node of the type to be cloned
    const sameTypeNodes = nodes.filter((node) => node.type === nodeType);
    const lastNode = sameTypeNodes[sameTypeNodes.length - 1];
    if (!lastNode) {
      console.log('no node of type', nodeType, 'found');
      return createNewNode(nodeType);
    }
    const newNode: Node<NodeData> = {
      id: `${nodes.length + 1}`,
      type: nodeType,
      position: {
        x: 0,
        y: 50,
      },
      data: {
        label: lastNode.data.label,
        xState: lastNode.data.xState,
        workspacePath: data.workspacePath,
      },
    };
    addNodes([newNode]);
    fitView({ padding: 0.2, includeHiddenNodes: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="btn btn-primary btn-sm rounded-lg">🧬</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Create New Node</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {nodeTypesAllowed.map((nodeType) => (
          <DropdownMenuItem onSelect={() => cloneNode(nodeType)} key={nodeType}>
            {nodeType}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
