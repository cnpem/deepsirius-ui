import React from "react";
import { Handle, type Node, type NodeProps, Position } from "reactflow";

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
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-gray-300 shadow">
      <div className="border-b border-gray-300  px-2 py-1 text-center font-mono text-xs uppercase">
        {label}
      </div>
      <div className="flex-1 bg-white p-2 dark:bg-slate-700">{children}</div>
    </div>
  );
}

export function HeroNode({ data }: NodeProps<NodeData>) {
  const { name = "", label = "" } = data;
  return (
    <NodeWrapper label={label}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-4xl font-bold text-gray-900">🕷</div>
        <div>{name}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
