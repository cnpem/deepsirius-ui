import { useMachine } from '@xstate/react';
import { useState } from 'react';
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
import { api } from '~/utils/api';

import { DynamicForm } from '../ui/dynamic-forms/DynamicForm';
import { type NodeData, NodeWrapper } from './common-node-utils';
import { networkFormData } from './network-form-data';
import { NetworkForm } from './node-component-forms/network-form';

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

type NetworkNode = Node<NodeData>;
export function NetworkNode({ data }: NodeProps<NodeData>) {
  const { label = 'network' } = data;
  const nodeId = useNodeId() || '';
  const createDummyJob = api.remotejob.create.useMutation();
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
      submitJob: (_, event) => {
        return new Promise((resolve, reject) => {
          const inputFormData = event.data;
          console.log('data submit: ', inputFormData);
          const jobInput = {
            jobName: 'deepsirius-ui',
            output: 'output-do-pai-custom.txt',
            error: 'error-dos-outros-custom.txt',
            ntasks: 1,
            partition: 'dev-gcd',
            command:
              'echo "' +
              JSON.stringify(inputFormData) +
              '" \n sleep 5 \n echo "job completed."',
          };
          createDummyJob
            .mutateAsync(jobInput)
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
              <Button onClick={() => send('finetune')}>finetune</Button>
            </div>
            {/* killing this  */}
            {/* <DynamicForm
              fields={networkFormData}
              onSubmit={(data, e) => {
                const stringData = JSON.stringify(data);
                send({
                  type: 'start training',
                  data: { formdata: stringData },
                });
              }}
            /> */}
            {/* replacing for this TODO: pass onSubmit as an argument */}
            <NetworkForm />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* <Handle type="source" position={Position.Bottom}/> */}
    </NodeWrapper>
  );
}
