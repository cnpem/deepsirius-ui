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

function SwitchBackground({
  status,
  children,
}: {
  status: NodeStatus;
  children: React.ReactNode;
}) {
  console.log(status);
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

function NodeWrapper({
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

type NodeData = {
  label?: string;
  status: NodeStatus;
};

type WorkspaceParams = {
  path: string;
};

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

type NetworkParams = {
  label: string;
  status: string;
  patchsize: {
    xy?: string | null;
    z?: string | null;
    xyz?: string | null;
  };
  trainingParams: {
    batchSize: number;
    iterations: number;
    epochs: number;
    learningRate: number;
    optimizer: string;
    lossFunction: string;
  };
  jobParams: {
    GPUs: string;
  };
};

type NetworkNode = Node<NodeData>;
export function NetworkNode({ data }: NodeProps<NodeData>) {
  const { label = "network", status = "inactive" } = data;
  const nodeId = useNodeId() || "";

  return (
    <NodeWrapper label={label + nodeId} status={status}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>{`I'm the ${label} ${nodeId}`}</div>
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
              <Input type="email" placeholder="Image path" />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
