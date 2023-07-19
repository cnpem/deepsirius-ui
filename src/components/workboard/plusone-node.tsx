import { Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
// import { toast } from '~/components/ui/use-toast';
import { AllowedNodeTypesList, useStoreNodes } from '~/hooks/use-store';

// selects the type of node to be created using a dropdown menu
export function PlusOneNode() {
  const { onNodeAdd } = useStoreNodes();

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
