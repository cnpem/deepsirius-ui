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

type InferenceParams = {
  inputPath: string;
  outputPath: string;
};

type InferenceNode = Node<NodeData>;
export function InferenceNode({ data }: NodeProps<NodeData>) {
  const { label = "inference", status = "inactive" } = data;
  const nodeId = useNodeId() || "";

  return (
    <NodeWrapper label={label + nodeId} status={status}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        {`I'm the ${label}`}
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Lets props!</AccordionTrigger>
          <AccordionContent>
            <div className="flex h-full flex-col items-center justify-center gap-1">
              {"nothing to see here"}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
