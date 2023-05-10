import React from "react";
import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  useNodeId,
} from "reactflow";
import { Input } from "~/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

function NodeWrapper({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-gray-300 shadow">
      <div className="border-b border-gray-300  px-2 py-1 text-center font-mono text-xs uppercase">
        {label}
      </div>
      <div className="flex-1 bg-white p-2 dark:bg-slate-700">{children}</div>
    </div>
  );
}

type WorkspaceNodeData = {
  label?: string;
  path?: string;
};

type WorkspaceNode = Node<WorkspaceNodeData>;

export function WorkspaceNode({ data }: NodeProps<WorkspaceNodeData>) {
  const { label = "workspace", path = "" } = data;
  const nodeId = useNodeId();
  return (
    <NodeWrapper label={label + nodeId}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>
          "I'm the {label} {nodeId}"
        </div>
        <div>{path}</div>
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
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}

type NetworkNodeData = {
  label?: string;
  path?: string;
};

type NetworkNode = Node<NetworkNodeData>;

export function NetworkNode({ data }: NodeProps<NetworkNodeData>) {
  const { label = "network", path = "" } = data;
  const nodeId = useNodeId();
  return (
    <NodeWrapper label={label + nodeId}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>"I'm the {label}"</div>
        <div>{path}</div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Lets props!</AccordionTrigger>
          <AccordionContent>
            Yes. I'm a fake prop but just temporarily.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
