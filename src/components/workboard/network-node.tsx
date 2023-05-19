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
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Label } from "~/components/ui/label";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

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

type FormData = {
  email: string;
  password: string;
};

function Form() {
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form
      className="w-full space-y-12 sm:w-[400px]"
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <div className="flex w-full items-center justify-center rounded-sm bg-red-700 font-semibold text-white">
          <p role="alert">{error}</p>
        </div>
      )}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        {errors.email && (
          <p role="alert" className="text-red-600">
            {errors.email?.message}
          </p>
        )}
        <Input
          placeholder="user.name@example.com"
          autoComplete="just-an-invalid-value"
          {...register("email", { required: "Email is required!" })}
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="password">Password</Label>
        {errors.password && (
          <p role="alert" className="text-red-600">
            {errors.password?.message}
          </p>
        )}
        <Input
          type="password"
          placeholder="Password"
          autoComplete="just-an-invalid-value" // browsers throw an error when this property isn't set. Setting
          {...register("password", { required: "Password is required!" })}
        />
      </div>
      <Button className="w-full" type="submit">
        Submit
      </Button>
    </form>
  );
}

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
            <Form />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
