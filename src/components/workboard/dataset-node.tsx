import {
  useNodeId,
  type Node,
  Position,
  Handle,
  type NodeProps,
} from "reactflow";
import { NodeData, NodeWrapper } from "./common-node-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Input } from "~/components/ui/input";

type DatasetNode = Node<NodeData>;
export function DatasetNode({ data }: NodeProps<NodeData>) {
  const { label = "dataset", status = "inactive" } = data;
  const nodeId = useNodeId() || "";

  // const handleConnection = (c: Connection) => {
  //   console.log({c});
  //   console.log("handling connection in to " + { label } + {nodeId});
  //   const sourcenode = nodes.find((node: Node) => node.id === c.source);
  //   console.log(sourcenode?.data);
  // };

  return (
    <NodeWrapper label={label + nodeId} status={status}>
      <Handle type="target" position={Position.Left} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>{`I'm the ${label} ${nodeId}`}</div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Lets props!</AccordionTrigger>
          <AccordionContent>
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <Input type="email" placeholder="Prop1" />
              <Input type="email" placeholder="Prop2" />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Right} />
    </NodeWrapper>
  );
}
