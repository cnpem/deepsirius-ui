import { useMachine } from '@xstate/react';
import { Handle, type Node, type NodeProps, Position } from 'reactflow';
import { assign, createMachine } from 'xstate';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { toast } from '~/components/ui/use-toast';
import { api } from '~/utils/api';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { type NodeData } from './common-node-utils';
import {
  DefaultForm as NetworkForm,
  type NetworkFormType,
  PrefilledForm,
} from './node-component-forms/network-form';

interface JobEvent {
  type: 'done.invoke';
  data: { jobId?: string; jobStatus?: string; formData?: NetworkFormType };
}

const networkState = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDswBcDuB7ATgawDoBLZAQwGM0iA3MAYgqutLTAG0AGAXUVAAcssIlSzJeIAB6IAjADYALAQ7Ll0gBwBWAJwbZ06QHYANCACeiNdILytt2wCY1N+-M0BfNydSZchRjXpYNFIcNAACNBxSEhIoTh4kEAEhETFEqQR5DgNre3UDDntZDjkAZnkTcwRLazsHJy0Xd08Qb2x8AgAjAFdYUwI+MGQIWLoIUTBiZGosPEnYbs6AW2EAKSxO+PFk4SJRcQzSgusOWRdZDTU1A2kOLUqLI6UDey1CrQNZLSc1Dy90dqEHp9AZDEbIKB0MA4HC4AYAGxYADNcEsCAtlmsNltEjtUgcLBorEUNNoDFpXAYNBUzIgNE97CTqWp7KVZKVSX9WgDfF1ev0cN1kMhRuNUFMZnMCG1ecCBUKRRCECQZuQWHtkPEcfxBLt9ulCcSLmSKddqQ8EKaCBpspZ7NkdPJZAYuTKOnKCILhaKJhLZpM3UD+Z6FbFldMsGrUlrpAkdSkNQTqnoCEyPqaqTSqppStbsuTyQoOKVWa6ee7g17FZCxZMVf7peWgyCq2H61GNVr7HGkrr8Qbk0bSenKebaZaSkpbRwbXkDGoKWWfBWW6GIWNffWpYG+avvUr2+rRFrSj28YmB-StNZ6bd7RoDFkORaqfZclpZGoORSjhyl4Dd3lfdITVZByDAeFtV7BN9VADI9A4AhyiOe1SmLF42QtC5ZGsT5SS-DR7CJeR7H-XloVhHA6BwdAcFMKDz1gyREDOC1kKnFQzlOEpCLIjoFnIcDYFgOgkRIdAhXYbhtj7C84LpewLVuJ0CGkEsDCpbRWVsDwWmQLAIDgcRAxkmC0nkhAAFpZAtay+MIEh-FoUy9XM5jMkU8cajqepnFcDR7IIJywBc-sLMcDRcnUT8sm4xkNAtbyfMcPyrkCuVQrk9ybAtXQ1AID5sKuIoKRsdLg0GYZYkypiMg+RK8iUGx5BtLRpFealSnKvdqxqtyMkuN81GdORdA+PJvkSm0kJZNQOAXF4Fw+QKKNwPqk30L8CGKLRynJB9Fty+RcwfC5PiyJ8LkCgShPgXFZNqmRpHkHJWWO0ov2kUlXjUC0dFzO59FeFLPnKXS3CAA */
  id: 'network',
  schema: {
    context: {} as {
      jobId: string;
      jobStatus: string;
      networkLabel: string;
      networkType: 'unet2d' | 'unet3d' | 'vnet';
    },
    events: {} as
      | { type: 'activate' }
      | { type: 'start training'; data: { formData: NetworkFormType } }
      | { type: 'cancel' }
      | { type: 'retry'; data: { formData: NetworkFormType } }
      | { type: 'finetune'; data: { formData: NetworkFormType } },
  },
  initial: 'inactive',
  context: {
    jobId: '',
    jobStatus: '',
    networkLabel: 'network',
    networkType: 'unet2d',
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
                networkLabel: (context, event: JobEvent) =>
                  event.data.formData?.networkUserLabel ?? 'network',
                networkType: (context, event: JobEvent) =>
                  event.data.formData?.networkTypeName ?? 'unet2d',
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
      on: {
        finetune: {
          target: 'busy',
          actions: assign({ jobStatus: '' }),
        },
      },
    },
  },
  predictableActionArguments: true,
});

type NetworkNode = Node<NodeData>;
export function NetworkNode({ data }: NodeProps<NodeData>) {
  const createJob = api.remotejob.create.useMutation();
  const checkJob = api.remotejob.status.useMutation();
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
          const formData =
            event.type !== 'cancel' && event.type !== 'activate'
              ? event.data.formData
              : '';
          console.log('data submit: ', formData);
          const jobInput = {
            jobName: 'deepsirius-ui',
            output: 'output-do-pai-custom.txt',
            error: 'error-dos-outros-custom.txt',
            ntasks: 1,
            partition: 'dev-gcd',
            command:
              'echo "' +
              JSON.stringify(formData) +
              '" \n sleep 5 \n echo "job completed."',
          };
          createJob
            .mutateAsync(jobInput)
            .then((data) => {
              resolve({ ...data, formData });
            })
            .catch((err) => reject(err));
        });
      },

      jobStatus: (context) => {
        return new Promise((resolve, reject) => {
          checkJob
            .mutateAsync({ jobId: context.jobId })
            .then((data) => {
              resolve(data);
            })
            .catch((err) => reject(err));
        });
      },
    },
  });
  const status = typeof state.value === 'object' ? 'busy' : state.value;
  return (
    <Card
      data-state={status}
      className="w-[380px] data-[state=active]:bg-green-100 data-[state=busy]:bg-yellow-100
    data-[state=error]:bg-red-100 data-[state=inactive]:bg-gray-100
    data-[state=success]:bg-blue-100 data-[state=active]:dark:bg-teal-800
    data-[state=busy]:dark:bg-amber-700 data-[state=error]:dark:bg-rose-700
    data-[state=inactive]:dark:bg-muted data-[state=success]:dark:bg-cyan-700"
    >
      <Handle type="target" position={Position.Left} />
      <CardHeader>
        <CardTitle>{state.context.networkLabel}</CardTitle>
        <CardDescription>{status}</CardDescription>
      </CardHeader>
      {state.matches('active') && (
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Train me!</AccordionTrigger>
              <AccordionContent>
                <NetworkForm
                  onSubmitHandler={(data) => {
                    send({
                      type: 'start training',
                      data: { formData: data },
                    });
                    toast({
                      title: 'You submitted the following values:',
                      description: (
                        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                          <code className="text-white">
                            {JSON.stringify(data, null, 2)}
                          </code>
                        </pre>
                      ),
                    });
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      )}
      {state.matches('busy') && (
        <>
          <CardContent>
            <div className="flex flex-col">
              <p className="mb-2 text-3xl font-extrabold text-center">
                {state.context.jobId}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {state.context.jobStatus}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              onClick={() => {
                send('cancel');
                toast({
                  title: 'Canceling job...',
                });
              }}
            >
              cancel
            </Button>
          </CardFooter>
        </>
      )}
      {state.matches('error') && (
        <CardContent>
          <div className="flex flex-col">
            <p className="mb-2 text-3xl font-extrabold text-center">
              {state.context.jobId}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {state.context.jobStatus}
            </p>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Retry?</AccordionTrigger>
              <AccordionContent>
                <PrefilledForm
                  networkTypeName={state.context.networkType}
                  networkUserLabel={state.context.networkLabel}
                  onSubmitHandler={(data) => {
                    send({
                      type: 'retry',
                      data: { formData: data },
                    });
                    toast({
                      title: 'You submitted the following values:',
                      description: (
                        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                          <code className="text-white">
                            {JSON.stringify(data, null, 2)}
                          </code>
                        </pre>
                      ),
                    });
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      )}
      {state.matches('success') && (
        <CardContent>
          <div className="flex flex-col">
            <p className="mb-2 text-3xl font-extrabold text-center">
              {state.context.jobId}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {state.context.jobStatus}
            </p>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Finetune?</AccordionTrigger>
              <AccordionContent>
                <PrefilledForm
                  networkTypeName={state.context.networkType}
                  networkUserLabel={state.context.networkLabel}
                  onSubmitHandler={(data) => {
                    send({
                      type: 'finetune',
                      data: { formData: data },
                    });
                    toast({
                      title: 'You submitted the following values:',
                      description: (
                        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                          <code className="text-white">
                            {JSON.stringify(data, null, 2)}
                          </code>
                        </pre>
                      ),
                    });
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      )}
      {state.matches('inactive') && (
        <CardFooter className="flex justify-start">
          <Button onClick={() => send('activate')}>activate</Button>
        </CardFooter>
      )}
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
