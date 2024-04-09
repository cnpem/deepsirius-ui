import {
  ImagesIcon,
  DatabaseIcon,
  DatabaseZapIcon,
  BrainCircuitIcon,
  GoalIcon,
  type LucideProps,
} from 'lucide-react';
import { type NodeTypeName } from '~/hooks/use-store';
import { cn } from '~/lib/utils';

interface NodeIconProps extends Omit<LucideProps, 'ref'> {
  nodeType: NodeTypeName;
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
        <DatabaseZapIcon className={cn('inline-block', className)} {...props} />
      );
    case 'network':
      return (
        <BrainCircuitIcon
          className={cn('inline-block', className)}
          {...props}
        />
      );
    case 'finetune':
      return <GoalIcon className={cn('inline-block', className)} {...props} />;
    case 'inference':
      return (
        <ImagesIcon className={cn('inline-block', className)} {...props} />
      );
    default:
      return <></>;
  }
}
