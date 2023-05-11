import React from "react";
import { Handle, type Node, type NodeProps, Position } from "reactflow";
import { Button } from "./ui/button";

type NodeData = {
  label?: string;
  name?: string;
};

type HeroNode = Node<NodeData>;

function NodeWrapper({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [isActivated, setIsActivated] = React.useState(false);
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-gray-300 shadow">
      <div className="border-b border-gray-300  px-2 py-1 text-center font-mono text-xs uppercase">
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
