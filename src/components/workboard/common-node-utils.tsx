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

type NodeStatus = "inactive" | "active" | "busy" | "success" | "error";

export type NodeData = {
  label?: string;
  status: NodeStatus;
};

function SwitchBackground({
  status,
  children,
}: {
  status: NodeStatus;
  children: React.ReactNode;
}) {
  switch (status) {
    case "active": {
      return (
        <div className="flex-1 bg-green-100 p-2 dark:bg-green-700">
          {children}
        </div>
      );
    }
    case "inactive": {
      return (
        <div className="flex-1 bg-gray-100 p-2 dark:bg-gray-400">
          {children}
        </div>
      );
    }
    case "busy": {
      return (
        <div className="flex-1 bg-yellow-100 p-2 dark:bg-yellow-600">
          {children}
        </div>
      );
    }
    case "success": {
      return (
        <div className="dark:bg-blue-00 flex-1 bg-blue-200 p-2">{children}</div>
      );
    }
    case "error": {
      return (
        <div className="flex-1 bg-red-200 p-2 dark:bg-red-800">{children}</div>
      );
    }
  }
}

export function NodeWrapper({
  label,
  children,
}: {
  label: string;
  status: NodeStatus;
  children: React.ReactNode;
}) {
  const [status, setStatus] = React.useState<NodeStatus>("inactive");
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-slate-300 shadow active:border-slate-800 dark:border-slate-500 dark:active:border-slate-100">
      <div className="border-b border-slate-300  px-2 py-1 text-center font-mono text-xs uppercase dark:border-slate-500">
        {label}
      </div>
      <div className="flex p-2">
        <Button onClick={() => setStatus("inactive")}>inactive</Button>
        <Button onClick={() => setStatus("active")}>active</Button>
        <Button onClick={() => setStatus("busy")}>busy</Button>
        <Button onClick={() => setStatus("success")}>success</Button>
        <Button onClick={() => setStatus("error")}>error</Button>
      </div>
      {/* <div>{children}</div> */}
      <SwitchBackground status={status}>{children}</SwitchBackground>
    </div>
  );
}
