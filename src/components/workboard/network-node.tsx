import { useInterpret, useSelector } from '@xstate/react';
import { useState } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import { State, type StateFrom, assign, createMachine } from 'xstate';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
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

import { type DatasetXState } from './dataset-node';

interface JobEvent {
  type: 'done.invoke';
  data: { jobId?: string; jobStatus?: string; formData?: NetworkFormType };
}

type FormSubmitEvent =
  | {
      type: 'create';
      data: { formData: NetworkFormType; connectedNodeName: string };
    }
  | {
      type: 'retry';
      data: { formData: NetworkFormType; connectedNodeName: string };
    }
  | {
      type: 'finetune';
      data: { formData: NetworkFormType; connectedNodeName: string };
    };

const networkMachine = createMachine({
  id: 'network',
  schema: {
    context: {} as {
      jobId: string;
      jobStatus: string;
      networkLabel: string;
      networkType: 'unet2d' | 'unet3d' | 'vnet';
    },
    events: {} as FormSubmitEvent | { type: 'cancel' },
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
        create: 'training',
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

export function NetworkNode(nodeProps: NodeProps<NodeData>) {
  const submitJob = api.remoteProcess.submitNetwork.useMutation();
  const checkJob = api.remotejob.status.useMutation();
  const cancelJob = api.remotejob.cancel.useMutation();
  const { getSourceData } = useStoreActions();
  const { onUpdateNode } = useStoreActions();
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>(
    nodeProps.data.status,
  );

  const prevXState = State.create(
    nodeProps.data.xState
      ? (JSON.parse(nodeProps.data.xState) as NetworkXState)
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
            const submitEvent = event as FormSubmitEvent;
            if (!submitEvent.data.formData)
              reject(new Error("This event shouldn't submit a job"));
            const formData = submitEvent.data.formData;
            const connectedNodeName = submitEvent.data.connectedNodeName;
            const submitType = submitEvent.type;
            submitJob
              .mutateAsync({
                workspacePath: nodeProps.data.workspacePath,
                datasetPath: connectedNodeName,
                trainingType: submitType,
                formData: formData,
              })
              .then((data) => {
                resolve({ ...data, formData });
              })
              .catch((err) => reject(err));
          });
        },
        jobStatus: (context) => {
          return new Promise((resolve, reject) => {
            // wait 5 seconds before checking the job status
            setTimeout(() => {
              checkJob
                .mutateAsync({ jobId: context.jobId })
                .then((data) => {
                  resolve(data);
                })
                .catch((err) => reject(err));
            }, 5000);
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
          id: nodeProps.id, // this is the component id from the react-flow
          data: {
            ...nodeProps.data,
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

  const getConnectedDatasetName = () => {
    const connectedNodeData = getSourceData(nodeProps.id);
    if (!connectedNodeData?.xState) return;
    const connectedXState = connectedNodeData.xState
      ? (JSON.parse(connectedNodeData.xState) as DatasetXState)
      : undefined;
    return connectedXState?.context.datasetName ?? undefined;
  };

  return (
    <>
      {nodeStatus === 'active' && (
        <Card className="w-[380px] bg-green-100 dark:bg-teal-800">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{networkLabel}</CardTitle>
            <CardDescription>{nodeStatus}</CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet open={nodeProps.selected} modal={false}>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Training</SheetTitle>
                </SheetHeader>
                <NetworkForm
                  onSubmitHandler={(data) => {
                    const connectedDatasetName = getConnectedDatasetName();
                    if (!connectedDatasetName) {
                      toast({
                        title: 'You need to connect a dataset first',
                        description: 'The network needs a dataset to train on.',
                      });
                      return;
                    }
                    actor.send({
                      type: 'create',
                      data: {
                        formData: data,
                        connectedNodeName: connectedDatasetName,
                      },
                    });
                    toast({
                      title: 'You submitted the following values:',
                      description: (
                        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                          <code className="text-white">
                            {JSON.stringify({ ...data }, null, 2)}
                          </code>
                        </pre>
                      ),
                    });
                  }}
                />
              </SheetContent>
            </Sheet>
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
            <Sheet open={nodeProps.selected} modal={false}>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Retry</SheetTitle>
                </SheetHeader>
                {isTrainingError && (
                  <NetworkForm
                    onSubmitHandler={(data) => {
                      const connectedDatasetName = getConnectedDatasetName();
                      if (!connectedDatasetName) {
                        toast({
                          title: 'You need to connect a dataset first',
                          description:
                            'The network needs a dataset to train on.',
                        });
                        return;
                      }
                      actor.send({
                        type: 'retry',
                        data: {
                          formData: data,
                          connectedNodeName: connectedDatasetName,
                        },
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
                      const connectedDatasetName = getConnectedDatasetName();
                      if (!connectedDatasetName) {
                        toast({
                          title: 'You need to connect a dataset first',
                          description:
                            'The network needs a dataset to train on.',
                        });
                        return;
                      }
                      actor.send({
                        type: 'retry',
                        data: {
                          formData: data,
                          connectedNodeName: connectedDatasetName,
                        },
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
              </SheetContent>
            </Sheet>
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
            <Sheet open={nodeProps.selected} modal={false}>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Finetune</SheetTitle>
                </SheetHeader>
                <PrefilledForm
                  networkTypeName={networkType}
                  networkUserLabel={networkLabel}
                  onSubmitHandler={(data) => {
                    const connectedDatasetName = getConnectedDatasetName();
                    if (!connectedDatasetName) {
                      toast({
                        title: 'You need to connect a dataset first',
                        description: 'The network needs a dataset to train on.',
                      });
                      return;
                    }
                    actor.send({
                      type: 'finetune',
                      data: {
                        formData: data,
                        connectedNodeName: connectedDatasetName,
                      },
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
              </SheetContent>
            </Sheet>
          </CardContent>
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
    </>
  );
}
