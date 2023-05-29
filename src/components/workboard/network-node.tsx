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
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { DoneInvokeEvent, assign, createMachine, send, sendTo } from 'xstate';
import { sendParent } from 'xstate/lib/actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { RouterOutputs, api } from '~/utils/api';

import { type NodeData, NodeWrapper } from './common-node-utils';

const nodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDsD2EwFsCGBjAFgJbJgB0xeALoQG5gDEVt2lYA2gAwC6ioADqliFqqZLxAAPRAEYAbAGZSAThUqAHEoDsHaQCYALAFZdAGhABPRGumlDHex13ylhvfv3yAvp7NoMOAmIyJjp6WEpsACdKAAJKSOxiYihOHiQQASERMXSpBH0OTVJ9XWkNQ3lS-VklfTNLBGtbB0dnVwMPb190LDwiElIAIwBXWHNSPjBkCGT6CFEyYhpUAGsyWGHBzGEAKVRB1PFM4UJRcTz5bWKOWV0FXQrDNUN6q2l9UnlqkqUONVlZNJNF0QH5eoEBiMxhMpjNkFB6GBIpFUJEJgAbFgAM1RmFIGy2u32h3Sx2y5ysrlId0MskM1WMl3prwQrg+dhamku0nksjUILBAX6ZCh40iw2QyFm8wGS1WZEFfSCQ1GYolUvhCDluBYp2QqRJ-EEJzOuUpNhpdIZTk0zIsiCUD1ImmsXy+uic8kqAp6QuVotI4sl0oW5GQyzWpEVEJFqsD6uSWvDqB12QN0jSRqyeopjUB1LpVrpNrtDTU8g4zusum08lp0kZPv8SshcaDGoRMsWycj0eFKuh7cT2t1ogNukzGWN5LNeYthfpxaZdXtjRd1NdFYb8nedyb4P7AaH8Lmoblvd9Ldjg4TmpHae4bHkk7JOdnFSUxQqPM02iU0g4WkWU0XRP1rMoQIKDR-33P1WxvYMTx1ZBcDAdFDSnbNTVAPJAUrN1fy5X4viA1cFEUW0HC5TQgUqXRYKvUgkRRSJ6EiMB4nMDDX2wyREFuFk3VIFppAgwoGVkBiY3xYZcFQ2BYHoLEgkoCV2G4I5pzfHDEGMFkAKca5bhqPkAM0dxvB8UEengdI+yCTSsJyHSEAAWlkFl3Kk-sKFwag6Eck1nL4-JTFXNRdGElonBcNxOis+yBhCMBApnFzdGeYpSjUNR9BopRnH0WoWQiqKHBi9p3C8BLL2k0VUu0kKipZRdqQ5Dgis0AFCn5GrmzquNJmmZIGt4vItGApQ1E+D0VFkG4MtkX9vP9NtbygUbgryJ5Iv+ECaxrFQd3kEqa1IQsdxrDwcrylaBmY1FNtzUTy3OjhalKFwtC9TQWt0StnnsPQcu0Dx6L6g9lQ2OS4FsrMgue94iicDw8powwpsMF5VwK-DZGqH6OGcUpqu8IA */
  id: 'nodemachine',
  initial: 'inactive',
  schema: {
    context: {} as { jobId: string; jobStatus: string },
    services: {} as {
      submitJob: { data: { jobId: string } | undefined };
      jobStatus: { data: { jobStatus: string } | undefined };
    },
    events: {} as
      | { type: 'activate' }
      | { type: 'start training' }
      | { type: 'check status' }
      | { type: 'cancel' }
      | { type: 'retry' }
      | { type: 'finetune' },
  },
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
              actions: assign({ jobId: (context, event) => event.data.jobId }),
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
                  jobStatus: (context, event) => event.data.jobStatus,
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
        console.log(context);
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
