import type { Node, NodeProps, XYPosition } from "reactflow";
import { cva } from "class-variance-authority";
import { nanoid } from "nanoid";
import { Handle, Position, useReactFlow } from "reactflow";
import { toast } from "sonner";
import type { NodeData, NodeStatus } from "~/hooks/use-store";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useStore, useStoreActions } from "~/hooks/use-store";
import { cn } from "~/lib/utils";
import NodeIcon from "./node-icon";

const nodeCardVariants = cva("h-[80px] w-[280px]", {
  variants: {
    status: {
      active:
        "border-green-800 bg-green-100 text-green-800 data-[selected=true]:border-green-500 dark:bg-muted dark:text-green-400",
      busy: "border-yellow-800 bg-yellow-100 text-yellow-800 data-[selected=true]:border-yellow-500 dark:bg-muted dark:text-yellow-400",
      error:
        "border-red-800 bg-red-100 text-red-800 data-[selected=true]:border-red-500 dark:bg-muted dark:text-red-400",
      success:
        "border-blue-800 bg-blue-100 text-blue-800 data-[selected=true]:border-blue-500 dark:bg-muted dark:text-blue-400",
    },
  },
  defaultVariants: {
    status: "active",
  },
});

const nodeHandleVariants = cva("", {
  variants: {
    status: {
      active: [
        "!border-green-800 !bg-green-500 hover:!bg-green-800",
        "data-[selected=true]:!border-green-500 data-[selected=true]:hover:!bg-green-800",
        "dark:!border-green-800 dark:!bg-green-800 dark:hover:!bg-green-500",
        "dark:data-[selected=true]:!border-green-500 dark:data-[selected=true]:!bg-green-800 dark:data-[selected=true]:hover:!bg-green-500",
      ],
      busy: [
        "!border-yellow-800 !bg-yellow-500 hover:!bg-yellow-800",
        "data-[selected=true]:!border-yellow-500 data-[selected=true]:hover:!bg-yellow-800",
        "dark:!border-yellow-800 dark:!bg-yellow-800 dark:hover:!bg-yellow-500",
        "dark:data-[selected=true]:!border-yellow-500 dark:data-[selected=true]:!bg-yellow-800 dark:data-[selected=true]:hover:!bg-yellow-500",
      ],
      error: [
        "!border-red-800 !bg-red-500 hover:!bg-red-800",
        "data-[selected=true]:!border-red-500 data-[selected=true]:hover:!bg-red-800",
        "dark:!border-red-800 dark:!bg-red-800 dark:hover:!bg-red-500",
        "dark:data-[selected=true]:!border-red-500 dark:data-[selected=true]:!bg-red-800 dark:data-[selected=true]:hover:!bg-red-500",
      ],
      success: [
        "!border-blue-800 !bg-blue-500 hover:!bg-blue-800",
        "data-[selected=true]:!border-blue-500 data-[selected=true]:hover:!bg-blue-800",
        "dark:!border-blue-800 dark:!bg-blue-800 dark:hover:!bg-blue-500",
        "dark:data-[selected=true]:!border-blue-500 dark:data-[selected=true]:!bg-blue-800 dark:data-[selected=true]:hover:!bg-blue-500",
      ],
    },
  },
  defaultVariants: {
    status: "active",
  },
});

type NodeCardProps = {
  title: string;
  subtitle: string;
} & NodeProps<NodeData>;

export default function NodeCard({
  title,
  subtitle,
  ...nodeProps
}: NodeCardProps) {
  const {
    type: nodeType,
    selected,
    data: { status: nodeStatus },
    xPos,
    yPos,
    id: nodeId,
  } = nodeProps;

  const { fitView } = useReactFlow();

  const { workspaceInfo, nodes, edges } = useStore((state) => ({
    workspaceInfo: state.workspaceInfo,
    nodes: state.nodes,
    edges: state.edges,
  }));
  const { addNode, addEdge } = useStoreActions();

  const positionOccupied = (x: number, y: number) => {
    const proximity = 50;
    return nodes.some(
      (node) =>
        Math.abs(node.position.x - x) < proximity &&
        Math.abs(node.position.y - y) < proximity,
    );
  };

  function getAvailablePosition(
    x: number,
    y: number,
    spawnDirection: "bottom" | "right",
  ) {
    const newX = spawnDirection === "right" ? x + 280 + 40 : x;
    const newY = spawnDirection === "bottom" ? y + 80 + 40 : y;
    if (!positionOccupied(x, y)) {
      return { x, y } as XYPosition;
    }
    return getAvailablePosition(newX, newY, spawnDirection);
  }

  function sourceHandleIsConnected({
    sourceId,
    handleId,
  }: {
    sourceId: string;
    handleId: string;
  }) {
    return edges.some(
      (edge) => sourceId === edge.source && edge.sourceHandle === handleId,
    );
  }

  const onNodeAdd = (props: {
    nodeType: string;
    handleId?: string;
    spawnDirection: "bottom" | "right";
  }) => {
    const { nodeType, handleId, spawnDirection } = props;
    if (!workspaceInfo) {
      toast.error("uh oh! something went wrong", {
        description: "Looks like the workspace was not loaded properly.",
        action: {
          label: "Reload the view",
          onClick: () => window.location.reload(),
        },
      });
      return;
    }
    if (nodeStatus !== "success") {
      toast.error(
        "This node is not ready to create a connection. It needs to be in a success state.",
      );
      return;
    }
    const initialPostition: XYPosition = getAvailablePosition(
      xPos,
      yPos,
      spawnDirection,
    );
    const newNodeId = nanoid();
    const newNode: Node<NodeData> = {
      id: newNodeId,
      type: nodeType,
      position: initialPostition,
      data: {
        workspacePath: workspaceInfo.path,
        status: "active",
      },
    };
    // now that the node is created in the database, we can add it to the store with an always defined registryId
    addNode(newNode);
    addEdge({
      id: nanoid(),
      source: nodeProps.id,
      target: newNodeId,
      sourceHandle: handleId,
    });
    fitView({ padding: 0.8 });
  };

  return (
    <>
      <Card
        id={`node-card-${nodeType}-${nodeId}`}
        data-selected={selected}
        data-status={nodeStatus}
        className={cn(nodeCardVariants({ status: nodeStatus }))}
      >
        <CardContent className="flex h-full flex-row items-center gap-4 p-4">
          <NodeIcon nodeType={nodeType} />
          <div className="flex-1 space-y-1">
            <p
              className={cn(
                "text-sm font-medium leading-none",
                nodeStatus === "active" && "text-green-800 dark:text-green-400",
                nodeStatus === "busy" && "text-yellow-800 dark:text-yellow-400",
                nodeStatus === "error" && "text-red-800 dark:text-red-400",
                nodeStatus === "success" && "text-blue-800 dark:text-blue-400",
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "text-sm",
                nodeStatus === "active" && "text-green-600 dark:text-green-500",
                nodeStatus === "busy" && "text-yellow-600 dark:text-yellow-500",
                nodeStatus === "error" && "text-red-600 dark:text-red-500",
                nodeStatus === "success" && "text-blue-600 dark:text-blue-500",
              )}
            >
              {subtitle}
            </p>
          </div>
        </CardContent>
      </Card>
      <HandlesPerType
        nodeId={nodeId}
        nodeType={nodeType}
        selected={selected}
        nodeStatus={nodeStatus}
        sourceHandleIsConnected={sourceHandleIsConnected}
        onNodeAdd={onNodeAdd}
      />
    </>
  );
}

function HandlesPerType({
  nodeId,
  nodeType,
  selected,
  nodeStatus,
  sourceHandleIsConnected,
  onNodeAdd,
}: {
  nodeId: string;
  nodeType: string;
  selected: boolean;
  nodeStatus: NodeStatus;
  sourceHandleIsConnected: ({
    sourceId,
    handleId,
  }: {
    sourceId: string;
    handleId: string;
  }) => boolean;
  onNodeAdd: (props: {
    nodeType: string;
    handleId?: string;
    spawnDirection: "bottom" | "right";
  }) => void;
}) {
  switch (nodeType) {
    case "dataset":
      return (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  nodeHandleVariants({ status: nodeStatus }),
                )}
                style={{ height: "1rem", width: "2.5rem" }}
                type="source"
                id="augmentation-source"
                position={Position.Bottom}
                onClick={() =>
                  onNodeAdd({
                    nodeType: "augmentation",
                    handleId: "augmentation-source",
                    spawnDirection: "bottom",
                  })
                }
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Add Augmentation Node</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "hover:bg-accent hover:text-accent-foreground",
                  nodeHandleVariants({ status: nodeStatus }),
                )}
                style={{ width: "1rem", height: "2.5rem" }}
                id="network-source"
                type="source"
                position={Position.Right}
                onClick={() =>
                  onNodeAdd({
                    nodeType: "network",
                    handleId: "network-source",
                    spawnDirection: "right",
                  })
                }
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Add Network Node</p>
            </TooltipContent>
          </Tooltip>
        </>
      );
    case "augmentation":
      return (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  nodeHandleVariants({ status: nodeStatus }),
                )}
                style={{ width: "1rem", height: "2.5rem" }}
                id="network-source"
                type="source"
                position={Position.Right}
                onClick={() =>
                  onNodeAdd({
                    nodeType: "network",
                    handleId: "network-source",
                    spawnDirection: "right",
                  })
                }
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Add Network Node</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(nodeHandleVariants({ status: nodeStatus }))}
                style={{ height: "1rem", width: "2.5rem" }}
                type="target"
                id="dataset-target"
                position={Position.Top}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Connect to a Dataset</p>
            </TooltipContent>
          </Tooltip>
        </>
      );
    case "network":
      return (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  nodeHandleVariants({ status: nodeStatus }),
                )}
                style={{ height: "1rem", width: "2.5rem" }}
                type="source"
                id="finetune-source"
                position={Position.Bottom}
                onClick={() => {
                  if (
                    sourceHandleIsConnected({
                      sourceId: nodeId,
                      handleId: "finetune-source",
                    })
                  ) {
                    toast.error("This node already has finetune a target");
                    return;
                  }
                  onNodeAdd({
                    nodeType: "finetune",
                    handleId: "finetune-source",
                    spawnDirection: "bottom",
                  });
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Add Finetune Node</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(nodeHandleVariants({ status: nodeStatus }))}
                style={{ width: "1rem", height: "2.5rem" }}
                type="source"
                position={Position.Right}
                id="inference-source"
                onClick={() =>
                  onNodeAdd({
                    nodeType: "inference",
                    handleId: "inference-source",
                    spawnDirection: "right",
                  })
                }
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Add Inference Node</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(nodeHandleVariants({ status: nodeStatus }))}
                style={{ height: "2.5rem" }}
                type="target"
                id="dataset-target"
                position={Position.Left}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Connect to a Dataset</p>
            </TooltipContent>
          </Tooltip>
        </>
      );
    case "finetune":
      return (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  nodeHandleVariants({ status: nodeStatus }),
                )}
                style={{ height: "1rem", width: "2.5rem" }}
                type="source"
                id="finetune-source"
                position={Position.Bottom}
                onClick={() => {
                  if (
                    sourceHandleIsConnected({
                      sourceId: nodeId,
                      handleId: "finetune-source",
                    })
                  ) {
                    toast.error("This node already has finetune a target");
                    return;
                  }
                  onNodeAdd({
                    nodeType: "finetune",
                    handleId: "finetune-source",
                    spawnDirection: "bottom",
                  });
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Add Finetune Node</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(nodeHandleVariants({ status: nodeStatus }))}
                style={{ height: "1rem", width: "2.5rem" }}
                type="target"
                id="network-target"
                position={Position.Top}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Connect to a Network</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Handle
                data-selected={selected}
                className={cn(nodeHandleVariants({ status: nodeStatus }))}
                style={{ height: "2.5rem" }}
                type="target"
                id="dataset-target"
                position={Position.Left}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Connect to a Dataset</p>
            </TooltipContent>
          </Tooltip>
        </>
      );
    case "inference":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle
              data-selected={selected}
              className={cn(nodeHandleVariants({ status: nodeStatus }))}
              style={{ height: "2.5rem" }}
              type="target"
              id="network-target"
              position={Position.Left}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Connect to a Network</p>
          </TooltipContent>
        </Tooltip>
      );
    default:
      return null;
  }
}
