import { CoffeeIcon, DatabaseIcon, DumbbellIcon } from 'lucide-react';
import { type AllowedNodeTypes } from '~/hooks/use-store';
import { cn } from '~/lib/utils';

interface NodeIconProps extends React.HTMLAttributes<SVGElement> {
  nodeType: AllowedNodeTypes;
}
export default function NodeIcon({
  nodeType,
  className,
  ...props
}: NodeIconProps) {
  switch (nodeType) {
    case 'dataset':
      return (
        <DatabaseIcon className={cn('inline-block', className)} {...props} />
      );
    case 'augmentation':
      return (
        <DatabaseIcon className={cn('inline-block', className)} {...props} />
      );
    case 'network':
      return (
        <DumbbellIcon className={cn('inline-block', className)} {...props} />
      );
    case 'inference':
      return (
        <CoffeeIcon className={cn('inline-block', className)} {...props} />
      );
    default:
      return <></>;
  }
}
