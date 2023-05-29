import { useMachine } from '@xstate/react';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  useNodeId,
} from 'reactflow';
import { assign, createMachine } from 'xstate';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { api } from '~/utils/api';

import { type NodeData, NodeWrapper } from './common-node-utils';

interface JobEvent {
  type: 'done.invoke';
  data: { jobId?: string; jobStatus?: string };
}
const nodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDsD2EwFsCGBjAFgJbJgB0xeALoQG5gDEVt2lYA2gAwC6ioADqliFqqZLxAAPRAEYAbAGZSAThUr5AJgAsAdl1L18gDQgAnogAc00gFYOdjtZW3918wF83xtBhwFiZJjp6WEpsACdKAAJKMOxiYihOHiQQASERMRSpBE0ObVJNdWlzbXNNWW15bXUla2MzBEsbewcnDhd3TxBvLDwiElIAIwBXWBNSPjBkCAT6CFEyYhpUAGsyWGHBzGEAKVRBpPE04UJRcWyqjgKOWS0lDirpDWtteosq0jya2SVZaRf5PJpB4vOhen4BiMxhMpjNkFB6GAwmFUGEJgAbFgAM1RmFIGy2u32hxSxwy5ws1is6lk1j+2lkjIU6lepkQ1g+6hpHOkmmstk05lkIO6YN8-TIUPGYWGyGQs3mAyWqzIPXF-iGo2lsvl8IQytwLFOyCSJP4ghOZyyFj+pG59KZzNZDXMvztL3MRVyCjp2hFar6GqlpBlcoVC3IyGWa1IAYhkq1IZ1CX1UdQhoypukyXN6WNFMaVLttIdTI0zosHGpL20SnM5ip0lK6n9YsDkMTod1CMVizTMbjEs10K7KYNRtEpvUOdSFvJ1satvtTcd5bejUFpG0HrpJbp5VbPnbCZHyfhcwjyoHbfjw+1Yb148z3DY8hnZPzC45SgKPP+T3aaQgPXbd1AKb5aWqDl1CrQ9wSHYNR3PQ1kFwMB0TNWc8ytUBsj+K55E0KpbHMeQSKpdcSwKBkOW0dp5DKQE4PVAYkRRMJ6DCMAYhMTCPxwyREFuddCMUFoniBDhzHo5jj3xYZcDQ2BYHoLF-EoWV2G4I450-XD2XUddpA4cpSCedRPQkqSqj9OD4BSQd-B07DMn0hAAFpZHXTzPhaPz7FkTRZNvChcGoOhnMtVzBJyQy2UaMC-McWp2nUVxgqHQIwEi+c3Is6xwOKSpXAZTQyvXT1fPsZLnDSzpQSPW8pRyvSYs0JR1zpcxlBo3RblpHRbIa+Cg0TSZpgSFqBOyJQKwSqwTNqYjilm6QlAy0bTwfKApui7JXDAoVtCbe4OC5PlzAq2xSAYiyigO316tFRqhzY1FdoLIDSNIWR6KKUrSjqeLa3ye5SiqDQWWkoKukcgYNkUuB7NzKLPv+fIDCI+tXE0Yy5uMhibHa2jikBIFbI8IA */
  id: 'nodemachine',
  initial: 'inactive',
  context: {
    jobId: '',
    jobStatus: '',
  },
  states: {
    inactive: {
      on: {
        activate: 'active',
      },
    },

    active: {
      on: {
        'start training': 'busy',
      },
    },
    busy: {
      initial: 'pending',
      states: {
        pending: {
          invoke: {
            id: 'submitJob',
            src: 'submitJob',
            onDone: {
              target: 'running',
              actions: assign({
                jobId: (context, event: JobEvent) => event.data.jobId ?? '',
              }),
            },
            onError: {
              target: '#nodemachine.error',
            },
          },
        },
        running: {
          invoke: {
            src: 'jobStatus',
            onDone: [
              {
                target: '#nodemachine.success',
                cond: 'isCompleted',
              },
              {
                target: '#nodemachine.error',
                cond: 'isFailed',
              },
              {
                target: '#nodemachine.error',
                cond: 'isCancelled',
              },
              {
                target: 'running',
                actions: assign({
                  jobStatus: (context, event: JobEvent) =>
                    event.data.jobStatus ?? '',
                }),
              },
            ],
          },
          on: {
            cancel: {
              actions: 'cancelJob',
            },
          },
        },
      },
    },
    error: {
      on: {
        retry: {
          target: 'busy',
          actions: assign({ jobStatus: '' }),
        },
      },
    },
    success: {
      on: { finetune: 'busy' },
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
  const [error, setError] = useState('');
  const mutation = api.silly.login.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const onSubmit: SubmitHandler<FormData> = (data) => {
    try {
      console.log(data);
      const mail = data.email;
      mutation.mutate({ name: mail });
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
          {...register('email', { required: 'Email is required!' })}
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
          {...register('password', {
            required: 'Password is required!',
          })}
        />
      </div>
      <Button className="w-full" type="submit">
        Submit
      </Button>
      <div>{mutation.data?.user.name}</div>
      <div>
        {mutation.error && (
          <p>Something went wrong! {mutation.error.message}</p>
        )}
      </div>
    </form>
  );
}

type NetworkNode = Node<NodeData>;
export function NetworkNode({ data }: NodeProps<NodeData>) {
  const { label = 'network' } = data;
  const nodeId = useNodeId() || '';
  const createDummyJob = api.remotejob.test.useMutation();
  const checkDummyJob = api.remotejob.status.useMutation();
  const cancelJob = api.remotejob.cancel.useMutation();

  const [state, send] = useMachine(nodeMachine, {
    guards: {
      isCompleted: (context) => {
        return context.jobStatus === 'COMPLETED';
      },
      isFailed: (context) => {
        return context.jobStatus === 'FAILED';
      },
      isCancelled: (context) => {
        return context.jobStatus === 'CANCELLED';
      },
    },
    actions: {
      cancelJob: (context) => {
        cancelJob.mutate({ jobId: context.jobId });
      },
    },
    services: {
      submitJob: () => {
        return new Promise((resolve, reject) => {
          createDummyJob
            .mutateAsync()
            .then((data) => {
              resolve(data);
            })
            .catch((err) => reject(err));
        });
      },

      jobStatus: (context) => {
        return new Promise((resolve, reject) => {
          checkDummyJob
            .mutateAsync({ jobId: context.jobId })
            .then((data) => {
              resolve(data);
            })
            .catch((err) => reject(err));
        });
      },
    },
  });

  return (
    <NodeWrapper label={label + nodeId} state={state.value}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>{`I'm the ${label} ${nodeId}`}</div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Lets props!</AccordionTrigger>
          <AccordionContent>
            <div>
              my state now:{' '}
              {typeof state.value === 'object'
                ? (state.value.busy as string)
                : state.value.toString()}
            </div>
            <div className="flex p-2">
              <Button onClick={() => send('activate')}>active</Button>
              <Button onClick={() => send('start training')}>
                start training
              </Button>
              <Button onClick={() => send('cancel')}>cancel</Button>
              <Button onClick={() => send('retry')}>retry</Button>
            </div>
            <Form />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
