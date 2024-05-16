import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import { cva } from 'class-variance-authority';
import { type NodeStatus } from '~/hooks/use-store';

const nodeStatusBadgeVariants = cva('', {
  variants: {
    status: {
      active: 'bg-green-500 hover:bg-green-600',
      busy: 'bg-yellow-500 hover:bg-yellow-600',
      error: 'bg-red-500 hover:bg-red-600',
      success: 'bg-blue-500 hover:bg-blue-600',
    },
  },
});

export function StatusBadge({ status }: { status: NodeStatus | undefined }) {
  if (!status) return (
    <Badge className="ml-auto rounded-full text-xs bg-gray-500">
      unknown
    </Badge>
  );
  
  return (
    <Badge
      className={cn(
        'ml-auto rounded-full text-xs',
        nodeStatusBadgeVariants({
          status,
        }),
      )}
    >
      {status}
    </Badge>
  );
}
