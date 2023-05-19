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
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";

const nodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFsCGaDGALAlgOzADp9UMAXHANzAGJSLLUywBtABgF1FQAHAe1g4KfPNxAAPRAHY2AVkIAWNgDYATLIA0IAJ6JVADgDMhWQF9TWtJlwFC9KrVhlUAJzIACMi9T58UdlxIIPyCwqJBkgj6ssYAjLJqmjqIsfqqJuaW6KQ2RABGAK6w2jTYYBgA1u5OTEUBYiFCOCJikQqG8upaugixygqKZhYgVjn4+UUlZZXVzmR1sYG8Ak0tEdJyiipdyb2Gqpkj2djjhIXFpVjlVTXzsCyqS8ErYa0pygCc3e-Kg4ejJ1s5ymqDwGDAABt6kFGq91ggZPIlIlvghVIZDP9jrlCGAXC4+C4aC4wF5tNDlqFmuFQJE+l9dqo+oQPkMstZTrAChhwbBYDQAGbjeYECnPKlrWmIfT6X7KKSpKRJHr6WIZQ54PgQOBiAG5BovalvBAAWmUqLNWI5thI5AcBolNIkiAUHw+hH2qp2PQMCitY1s9moDtWTrpbFibEIsWR3r0hmU-sBE2KIbhUoQrvdnticbRsXdrKTOLxBJcaaN8IUqlRqjY2eUjabzcbUmLnO5vPgMMNkudvQjUZj22VKVUvw+fRb0-M5iAA */
  id: "nodemachine",
  initial: "inactive",
  states: {
    inactive: {
      on: {
        activate: "active",
      },
    },

    active: {
      on: { "start training": "busy" },
    },

    busy: {
      on: {
        "check status": [
          {
            target: "busy",
            cond: "training",
          },
          {
            target: "success",
            cond: "completed",
          },
          {
            target: "error",
            cond: "error",
          },
        ],
        cancel: "active",
      },
    },

    error: {
      on: { retry: "busy" },
    },
    success: {
      on: { finetune: "busy" },
    },
  },
  predictableActionArguments: true,
});

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
  const [state, send] = useMachine(nodeMachine);

  return (
    <NodeWrapper label={label + nodeId} state={state.value.toString()}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>{`I'm the ${label} ${nodeId}`}</div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Lets props!</AccordionTrigger>
          <AccordionContent>
            <div>my state now: {state.value.toString()}</div>
            <div className="flex p-2">
              <Button onClick={() => send("inactive")}>inactive</Button>
              <Button onClick={() => send("activate")}>active</Button>
              <Button onClick={() => send("start training")}>
                start training
              </Button>
              <Button onClick={() => send("check status")}>check status</Button>
              <Button onClick={() => send("cancel")}>cancel</Button>
            </div>
            <Form />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
