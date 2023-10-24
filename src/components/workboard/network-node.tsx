import { useInterpret, useSelector } from '@xstate/react';
import { useState } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import { State, type StateFrom, assign, createMachine } from 'xstate';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { toast } from '~/components/ui/use-toast';
import {
  DefaultForm as NetworkForm,
  type NetworkFormType,
  PrefilledForm,
} from '~/components/workboard/node-component-forms/network-form';
import {
  type NodeData,
  type NodeStatus,
  useStoreActions,
} from '~/hooks/use-store';
import { api } from '~/utils/api';

interface JobEvent {
  type: 'done.invoke';
  data: { jobId?: string; jobStatus?: string; formData?: NetworkFormType };
}

const networkMachine = createMachine({
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
  initial: 'active',
  context: {
    jobId: '',
    jobStatus: '',
    networkLabel: 'network',
    networkType: 'unet2d',
  },
  states: {
    active: {
      on: {
        'start training': 'training',
      },
      tags: ['active'],
    },
    training: {
      initial: 'pending',
      tags: ['busy'],
      states: {
        pending: {
          invoke: {
            id: 'submitJob',
            src: 'submitJob',
            onDone: {
              target: 'running',
              actions: assign({
                jobId: (_, event: JobEvent) => event.data.jobId ?? '',
                networkLabel: (_, event: JobEvent) =>
                  event.data.formData?.networkUserLabel ?? 'network',
                networkType: (_, event: JobEvent) =>
                  event.data.formData?.networkTypeName ?? 'unet2d',
              }),
            },
            onError: {
              target: 'error',
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
                target: 'error',
                cond: 'isFailed',
              },
              {
                target: 'error',
                cond: 'isCancelled',
              },
              {
                target: 'running',
                actions: assign({
                  jobStatus: (_, event: JobEvent) => event.data.jobStatus ?? '',
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
        error: {
          tags: ['error'],
          on: {
            retry: {
              target: 'pending',
              actions: assign({ jobStatus: '', jobId: '' }),
            },
          },
        },
      },
    },
    success: {
      tags: ['success'],
      on: {
        finetune: {
          target: 'tuning',
          actions: assign({ jobStatus: '', jobId: '' }),
        },
      },
    },
    tuning: {
      initial: 'pending',
      tags: ['busy'],
      states: {
        pending: {
          invoke: {
            id: 'submitJob',
            src: 'submitJob',
            onDone: {
              target: 'running',
              actions: assign({
                jobId: (_, event: JobEvent) => event.data.jobId ?? '',
                networkLabel: (_, event: JobEvent) =>
                  event.data.formData?.networkUserLabel ?? 'network',
                networkType: (_, event: JobEvent) =>
                  event.data.formData?.networkTypeName ?? 'unet2d',
              }),
            },
            onError: {
              target: 'error',
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
                target: 'error',
                cond: 'isFailed',
              },
              {
                target: 'error',
                cond: 'isCancelled',
              },
              {
                target: 'running',
                actions: assign({
                  jobStatus: (_, event: JobEvent) => event.data.jobStatus ?? '',
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
        error: {
          tags: ['error'],
          on: {
            retry: {
              target: 'pending',
              actions: assign({ jobStatus: '', jobId: '' }),
            },
          },
        },
      },
    },
  },
  predictableActionArguments: true,
});
export type NetworkXState = StateFrom<typeof networkMachine>;

export function NetworkNode({ id, data }: NodeProps<NodeData>) {
  const createJob = api.remotejob.create.useMutation();
  const checkJob = api.remotejob.status.useMutation();
  const cancelJob = api.remotejob.cancel.useMutation();
  const { checkConnectedSource } = useStoreActions();
  const { onUpdateNode } = useStoreActions();
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>(data.status);

  // handle node activation if theres a source node connected to it
  const handleActivation = () => {
    const checkSource = checkConnectedSource(id);
    if (checkSource) {
      actor.send('activate');
    } else {
      // TODO: make this pretty
      alert('Please connect a source node to this node.');
    }
  };

  const prevXState = State.create(
    data.xState
      ? (JSON.parse(data.xState) as NetworkXState)
      : networkMachine.initialState,
  );

  const actor = useInterpret(
    networkMachine,
    {
      state: prevXState,
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
        submitJob: (state, event) => {
          return new Promise((resolve, reject) => {
            const formData =
              event.type !== 'cancel' && event.type !== 'activate'
                ? event.data.formData
                : '';
            const jobInput = {
              jobName: 'deepsirius-network',
              output: 'deepsirius-network-output.txt',
              error: 'deepsirius-network-error.txt',
              ntasks: 1,
              partition: 'proc2',
              command:
                'echo "' +
                JSON.stringify({ ...formData, ...data }) +
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
    },
    // observer
    (state) => {
      const newStatus = [...state.tags][0] as NodeStatus;
      if (newStatus !== nodeStatus) {
        // update the local state
        setNodeStatus(newStatus);
        // update the node data in the store
        onUpdateNode({
          id: id, // this is the component id from the react-flow
          data: {
            ...data,
            status: newStatus,
            xState: JSON.stringify(state),
          },
        });
      }
    },
  );

  const selector = (state: NetworkXState) => {
    return {
      stateValue: state.value,
      isTrainingError: state.matches({ training: 'error' }),
      isTuningError: state.matches({ tuning: 'error' }),
      jobId: state.context.jobId,
      jobStatus: state.context.jobStatus,
      networkLabel: state.context.networkLabel,
      networkType: state.context.networkType,
    };
  };

  const {
    stateValue,
    isTrainingError,
    isTuningError,
    jobId,
    jobStatus,
    networkLabel,
    networkType,
  } = useSelector(actor, selector);

  return (
    <>
      {nodeStatus === 'inactive' && (
        <Card className="w-[380px] bg-gray-100 dark:bg-muted">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{networkLabel}</CardTitle>
            <CardDescription>{nodeStatus}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-start">
            <Button onClick={handleActivation}>activate</Button>
          </CardFooter>
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
      {nodeStatus === 'active' && (
        <Card className="w-[380px] bg-green-100 dark:bg-teal-800">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{networkLabel}</CardTitle>
            <CardDescription>{nodeStatus}</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Train me!</AccordionTrigger>
                <AccordionContent>
                  <NetworkForm
                    onSubmitHandler={(formSubmitData) => {
                      actor.send({
                        type: 'start training',
                        data: { formData: formSubmitData },
                      });
                      toast({
                        title: 'You submitted the following values:',
                        description: (
                          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                            <code className="text-white">
                              {JSON.stringify(
                                { ...formSubmitData, ...data },
                                null,
                                2,
                              )}
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
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
      {nodeStatus === 'busy' && (
        <Card className="w-[380px] bg-yellow-100 dark:bg-amber-700">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{networkLabel}</CardTitle>
            <CardDescription>
              {Object.entries(stateValue)
                .map(([key, value]) => `${key}: ${value as string}`)
                .join('<br/>')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <p className="mb-2 text-3xl font-extrabold text-center">
                {jobId}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {jobStatus}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              onClick={() => {
                actor.send('cancel');
                toast({
                  title: 'Canceling job...',
                });
              }}
            >
              cancel
            </Button>
          </CardFooter>
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
      {nodeStatus === 'error' && (
        <Card className="w-[380px] bg-red-100 dark:bg-rose-700">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{networkLabel}</CardTitle>
            <CardDescription>
              {Object.entries(stateValue)
                .map(([key, value]) => `${key}: ${value as string}`)
                .join('<br/>')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <p className="mb-2 text-3xl font-extrabold text-center">
                {jobId}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {jobStatus}
              </p>
            </div>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Retry?</AccordionTrigger>
                <AccordionContent>
                  {isTrainingError && (
                    <NetworkForm
                      onSubmitHandler={(data) => {
                        actor.send({
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
                  )}
                  {isTuningError && (
                    <PrefilledForm
                      networkTypeName={networkType}
                      networkUserLabel={networkLabel}
                      onSubmitHandler={(data) => {
                        actor.send({
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
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
      {nodeStatus === 'success' && (
        <Card className="w-[380px] bg-blue-100 dark:bg-cyan-700">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{networkLabel}</CardTitle>
            <CardDescription>{nodeStatus}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <p className="mb-2 text-3xl font-extrabold text-center">
                {jobId}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {jobStatus}
              </p>
            </div>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Finetune?</AccordionTrigger>
                <AccordionContent>
                  <PrefilledForm
                    networkTypeName={networkType}
                    networkUserLabel={networkLabel}
                    onSubmitHandler={(data) => {
                      actor.send({
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
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
    </>
  );
}
