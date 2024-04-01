import { type AllowedNodeTypes, type NodeStatus } from '~/hooks/use-store';
import { Card, CardContent } from '~/components/ui/card';
import NodeIcon from './node-icon';
import { Handle, Position } from 'reactflow';
import { cn } from '~/lib/utils';

interface NodeCardProps {
  nodeStatus: NodeStatus;
  nodeType: AllowedNodeTypes;
  selected: boolean;
  title: string;
  subtitle: string;
}

export default function NodeCard(props: NodeCardProps) {
  const { nodeType, selected, title, subtitle, nodeStatus } = props;

  return (
    <Card
      data-selected={selected}
      data-status={nodeStatus}
      className={cn(
        'w-fit',
        nodeStatus === 'active' &&
          'border-green-800 bg-green-100 text-green-800 data-[selected=true]:border-green-500 dark:bg-muted dark:text-green-400',
        nodeStatus === 'busy' &&
          'border-yellow-800 bg-yellow-100 text-yellow-800 data-[selected=true]:border-yellow-500 dark:bg-muted dark:text-yellow-400',
        nodeStatus === 'error' &&
          'border-red-800 bg-red-100 text-red-800 data-[selected=true]:border-red-500 dark:bg-muted dark:text-red-400',
        nodeStatus === 'success' &&
          'border-blue-800 bg-blue-100 text-blue-800 data-[selected=true]:border-blue-500 dark:bg-muted dark:text-blue-400',
      )}
    >
      <CardContent className="p-4 pr-8">
        <div className=" flex flex-row items-center gap-4">
          <NodeIcon nodeType={nodeType} />
          <div className="flex-1 space-y-1">
            <p
              className={cn(
                'text-sm font-medium leading-none',
                nodeStatus === 'active' && 'text-green-800 dark:text-green-400',
                nodeStatus === 'busy' && 'text-yellow-800 dark:text-yellow-400',
                nodeStatus === 'error' && 'text-red-800 dark:text-red-400',
                nodeStatus === 'success' && 'text-blue-800 dark:text-blue-400',
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                'text-sm',
                nodeStatus === 'active' && 'text-green-600 dark:text-green-500',
                nodeStatus === 'busy' && 'text-yellow-600 dark:text-yellow-500',
                nodeStatus === 'error' && 'text-red-600 dark:text-red-500',
                nodeStatus === 'success' && 'text-blue-600 dark:text-blue-500',
              )}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </CardContent>
      {nodeType !== 'dataset' && (
        <Handle
          data-selected={selected}
          className={cn(
            nodeStatus === 'active' &&
              '!bg-green-400 active:!bg-green-500 data-[selected=true]:!border-green-500 dark:!bg-muted dark:active:!bg-green-400',
            nodeStatus === 'busy' &&
              '!bg-yellow-400 active:!bg-yellow-500 data-[selected=true]:!border-yellow-500 dark:!bg-muted dark:active:!bg-yellow-400 ',
            nodeStatus === 'error' &&
              '!bg-red-400 active:!bg-red-500 data-[selected=true]:!border-red-500 dark:!bg-muted dark:active:!bg-red-400',
            nodeStatus === 'success' &&
              '!bg-blue-400 active:!bg-blue-500 data-[selected=true]:!border-blue-500 dark:!bg-muted dark:active:!bg-blue-400',
          )}
          type="target"
          position={Position.Left}
        />
      )}
      {nodeType !== 'inference' && (
        <Handle
          data-selected={selected}
          className={cn(
            nodeStatus === 'active' &&
              '!bg-green-400 active:!bg-green-500 data-[selected=true]:!border-green-500 dark:!bg-muted dark:active:!bg-green-400',
            nodeStatus === 'busy' &&
              '!bg-yellow-400 active:!bg-yellow-500 data-[selected=true]:!border-yellow-500 dark:!bg-muted dark:active:!bg-yellow-400 ',
            nodeStatus === 'error' &&
              '!bg-red-400 active:!bg-red-500 data-[selected=true]:!border-red-500 dark:!bg-muted dark:active:!bg-red-400',
            nodeStatus === 'success' &&
              '!bg-blue-400 active:!bg-blue-500 data-[selected=true]:!border-blue-500 dark:!bg-muted dark:active:!bg-blue-400',
          )}
          type="source"
          position={Position.Right}
        />
      )}
    </Card>
  );
}
