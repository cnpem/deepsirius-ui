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
import { Button } from "../ui/button";

function NodeWrapper({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [isActivated, setIsActivated] = React.useState(false);
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-slate-300 shadow active:border-slate-800 dark:border-slate-500 dark:active:border-slate-100">
      <div className="border-b border-gray-300  px-2 py-1 text-center font-mono text-xs uppercase dark:border-slate-500">
        {label}
      </div>
      <div className="flex p-2">
        <Button
          className="w-full"
          variant={"ghost"}
          onClick={() => setIsActivated((p) => !p)}
        >
          {isActivated ? "👍" : "👎"}
        </Button>
      </div>
      {isActivated ? (
        <div className="flex-1 bg-green-100 p-2 dark:bg-slate-700">
          {children}
        </div>
      ) : (
        <div className="flex-1 bg-red-100 p-2 dark:bg-slate-700">
          {children}
        </div>
      )}
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
  const nodeId = useNodeId() || "";
  return (
    <NodeWrapper label={label + nodeId}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>{`I'm the ${label} ${nodeId}`}</div>
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
  const nodeId = useNodeId() || "";
  return (
    <NodeWrapper label={label + nodeId}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        {`I'm the ${label}`}
        <div>{path}</div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Lets props!</AccordionTrigger>
          <AccordionContent>
            {"Yes. I'm a fake prop but just temporarily."}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}

type NodeData = {
  label?: string;
  name?: string;
};

type HeroNode = Node<NodeData>;

export function HeroNode({ data }: NodeProps<NodeData>) {
  const { name = "", label = "" } = data;
  return (
    <NodeWrapper label={label}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-4xl font-bold text-gray-900">🕷 </div>
        <div>{name}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
