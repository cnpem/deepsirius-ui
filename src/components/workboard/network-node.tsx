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

interface JobEvent {
  type: 'done.invoke';
  data: { jobId?: string; jobStatus?: string };
}
const networkState = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDswBcDuB7ATgawDoBLZAQwGM0iA3MAYgqutLTAG0AGAXUVAAcssIlSzJeIAB6IAjADYALAQ7Ll0gBwBWAJwbZ06QHYANCACeiNdILytt2wCY1N+-M0BfNydSZchRjXpYNFIcNAACNBxSEhIoTh4kEAEhETFEqQR5DgNre3UDDntZDjkAZnkTcwRLazsHJy0Xd08Qb2x8AgAjAFdYUwI+MGQIWLoIUTBiZGosPEnYbs6AW2EAKSxO+PFk4SJRcQzSgusOWRdZDTU1A2kOLUqLI6UDey1CrQNZLSc1Dy90dqEHp9AZDEbIKB0MA4HC4AYAGxYADNcEsCAtlmsNltEjtUgcLBorEUNNoDFpXAYNBUzIgNE97CTqWp7KVZKVSX9WgDfF1ev0cN1kMhRuNUFMZnMCG1ecCBUKRRCECQZuQWHtkPEcfxBLt9ulCcSLmSKddqQ8EKaCBpspZ7NkdPJZAYuTKOnKCILhaKJhLZpM3UD+Z6FbFldMsGrUlrpAkdSkNQTqnoCEyPqaqTSqppStbsuTyQoOKVWa6ee7g17FZCxZMVf7peWgyCq2H61GNVr7HGkrr8Qbk0bSenKebaZaSkpbRwbXkDGoKWWfBWW6GIWNffWpYG+avvUr2+rRFrSj28YmB-StNZ6bd7RoDFkORaqfZclpZGoORSjhyl4Dd3lfdITVZByDAeFtV7BN9VADI9A4AhyiOe1SmLF42QtC5ZGsT5SS-DR7CJeR7H-XloVhHA6BwdAcFMKDz1gyREDOC1kKnFQzlOEpCLIjoFnIcDYFgOgkRIdAhXYbhtj7C84LpewLVuJ0CGkEsDCpbRWVsDwWmQLAIDgcRAxkmC0nkhAAFpZAtay+MIEh-FoUy9XM5jMkU8cajqepnFcDR7IIJywBc-sLMcDRcnUT8sm4xkNAtbyfMcPyrkCuVQrk9ybAtXQ1AID5sKuIoKRsdLg0GYZYkypiMg+RK8iUGx5BtLRpFealSnKvdqxqtyMkuN81GdORdA+PJvkSm0kJZNQOAXF4Fw+QKKNwPqk30L8CGKLRynJB9Fty+RcwfC5PiyJ8LkCgShPgXFZNqmRpHkHJWWO0ov2kUlXjUC0dFzO59FeFLPnKXS3CAA */
  id: 'network',
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
              target: '#network.error',
            },
          },
        },
        running: {
          invoke: {
            src: 'jobStatus',
            onDone: [
              {
                target: '#network.success',
                cond: 'isCompleted',
              },
              {
                target: '#network.error',
                cond: 'isFailed',
              },
              {
                target: '#network.error',
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

  const [state, send] = useMachine(networkState, {
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
            <div className="flex p-2">
              <Button onClick={() => send('activate')}>active</Button>
              <Button onClick={() => send('start training')}>
                start training
              </Button>
              <Button onClick={() => send('cancel')}>cancel</Button>
              <Button onClick={() => send('retry')}>retry</Button>
              <Button onClick={() => send('finetune')}>finetune</Button>
            </div>
            <DynamicForm
              fields={networkFormData}
              onSubmit={(data, e) => {
                const stringData = JSON.stringify(data);
                send({
                  type: 'start training',
                  data: { formdata: stringData },
                });
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* <Handle type="source" position={Position.Bottom}/> */}
    </NodeWrapper>
  );
}
