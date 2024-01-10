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
  type FormType,
  InferenceForm,
} from '~/components/workboard/node-component-forms/inference-form';
import {
  type NodeData,
  type NodeStatus,
  useStoreActions,
} from '~/hooks/use-store';
import { api } from '~/utils/api';

import { type NetworkXState } from './network-node';

interface JobEvent {
  type: 'done.invoke';
  data: { jobId?: string; jobStatus?: string; formData?: FormType };
}

type FormSubmitEvent =
  | { type: 'start'; data: { formData: FormType; connectedNodeName: string } }
  | { type: 'retry'; data: { formData: FormType; connectedNodeName: string } };

const inferenceMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEsB2AzMAnMqDGYAdGgIZ4AuyAbmAMRmVUnlgDaADALqKgAOA9rGSV+qHiAAeiAIwA2AMyEAnCqUB2JQCYAHEoCs2te1kAaEAE9E82ZsJrNsvWoAsavUtnsdzgL4+zaJg4+EQM1HSw5CRY5BzcSCACQiJiCVIIzuxqhM6a0tp67tq60vLWZpYI1rb2jnoKes7S7OzafgEY2LgEhABGAK6w5oS8uBBoULQQokRoVPwA1kSw-b0AtsIAUvy9ceJJwsii4unarTnazvJn7HqamhraFYhOeoROmlrSV9Vl7SCBLohPqDYajVDjVCTbBYfhYEYAG2Y6Dha0IK3WWx2ewSBxSJxkOiUhHkVzU8nJmnkSmkBmeCAeb1qTjUcmk9n0-0BwR6AyGhCw-VQqAmUxmxFQ8yWEqC3SIfOGguFEwQc34eGYR1QcRxfEEh2OaUJuhJZIp8ipNLpFkQskMhBaam09yUZPuei5nR58tBAqFIqhYtQs0lixDsuBCr9yqhqtDGpSOuk8T1yS1BIQ0k+xNJ5sp1NpTxtCHctkdzoM0izzl8-gBXrlIP5SoDk2mwYlUvDQN5vpbKrVCa1Os0KcS+vxRsz2dNeYtBetlQUxL0WWdZJc2gtnojveb-tF7ZDXZlPZ9+5jUDj8yHoh18jHePTU-U2T08izdyyt2a8npziUdhlE+IwyircktB3M8m0VA9Aw1EIEV1cc00NUB0maZxtByPJLjtJRikA0xi2pZxlDURwKJrLCAOkKDvUIGE4VoHByCwcxkKfNDJBeFoHSdLMXGuRp1HpbRpHeFoWmkQCrgcLD6MbFY8AIWBYFodA0DAcghTYLh9gnZ90N4oC10Eq4CgAtR6QoiSiM0XImnfJ0lD8OtUH4CA4HEbk5QM1DUmMhAAFpiMqULFOBUgKHCfyDUCniMk0elrEUe5KNcdxPG8SKejCGg4snIKdDeXJ8go2QVAtBQUoUQh0qcTKPC8S5cvPSpU3ijMsOyMyHgskTrJIrIcgogwKTk8lZFrDpd3akYxgmQqjMS983j6oTLNE4tChXACAIc75qXkNqYOjVtlu4jCvCA1133Yax8iaYp6QMbDih0TRnLJGxTqYrBLoSjCbAku0XCUakFBrelPv4xxdGdZpvtO5TVPgXFDKumQDDeD8HK3ORDDOP9i0qiT3CrMrZCh0k3J8IA */
  id: 'inference',
  schema: {
    context: {} as {
      jobId: string;
      jobStatus: string;
      inputImages: Array<{ name: string; path: string }>;
    },
    events: {} as FormSubmitEvent | { type: 'cancel' },
  },
  initial: 'active',
  context: {
    jobId: '',
    jobStatus: '',
    inputImages: [],
  },
  states: {
    active: {
      tags: ['active'],
      on: {
        start: 'busy',
      },
    },
    busy: {
      tags: ['busy'],
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
                inputImages: (context, event: JobEvent) => {
                  return event.data.formData?.inputImages ?? [];
                },
              }),
            },
            onError: {
              target: '#inference.error',
            },
          },
        },
        running: {
          invoke: {
            src: 'jobStatus',
            onDone: [
              {
                target: '#inference.success',
                cond: 'isCompleted',
              },
              {
                target: '#inference.error',
                cond: 'isFailed',
              },
              {
                target: '#inference.error',
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
      tags: ['error'],
      on: {
        retry: {
          target: 'busy',
          actions: assign({ jobStatus: '' }),
        },
      },
    },
    success: {
      tags: ['success'],
    },
  },
  predictableActionArguments: true,
});
export type InferenceXState = StateFrom<typeof inferenceMachine>;

export function InferenceNode(nodeProps: NodeProps<NodeData>) {
  // const createJob = api.remotejob.create.useMutation();
  const checkJob = api.remotejob.status.useMutation();
  const cancelJob = api.remotejob.cancel.useMutation();
  const submitJob = api.remoteProcess.submitInference.useMutation();
  const { getSourceData } = useStoreActions();
  const { onUpdateNode } = useStoreActions();
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>(
    nodeProps.data.status,
  );

  const prevXState = State.create(
    nodeProps.data.xState
      ? (JSON.parse(nodeProps.data.xState) as InferenceXState)
      : inferenceMachine.initialState,
  );

  const actor = useInterpret(
    inferenceMachine,
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
        submitJob: (_, event) => {
          return new Promise((resolve, reject) => {
            const submitEvent = event as FormSubmitEvent;
            if (!submitEvent.data.formData)
              reject(new Error("This event shouldn't submit a job"));
            const formData = submitEvent.data.formData;
            const connectedNodeName = submitEvent.data.connectedNodeName;
            submitJob
              .mutateAsync({
                workspacePath: nodeProps.data.workspacePath,
                networkName: connectedNodeName,
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
      // subscribes to state changes and check if there is a status change to update the node data
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

  const selector = (state: InferenceXState) => {
    return {
      jobId: state.context.jobId,
      jobStatus: state.context.jobStatus,
      inputImages: state.context.inputImages,
    };
  };

  const { jobId, jobStatus, inputImages } = useSelector(actor, selector);

  const getConnectedNetworkLabel = () => {
    const connectedNodeData = getSourceData(nodeProps.id);
    if (!connectedNodeData?.xState) return;
    const connectedXState = JSON.parse(
      connectedNodeData.xState,
    ) as NetworkXState;
    return connectedXState.context.networkLabel ?? undefined;
  };

  return (
    <Card
      data-state={nodeStatus}
      className="w-[420px] data-[state=active]:bg-green-100 data-[state=busy]:bg-yellow-100
    data-[state=error]:bg-red-100 data-[state=inactive]:bg-gray-100
    data-[state=success]:bg-blue-100 data-[state=active]:dark:bg-teal-800
    data-[state=busy]:dark:bg-amber-700 data-[state=error]:dark:bg-rose-700
    data-[state=inactive]:dark:bg-muted data-[state=success]:dark:bg-cyan-700"
    >
      <Handle type="target" position={Position.Left} />
      <CardHeader>
        <CardTitle>{'inference'}</CardTitle>
        <CardDescription>{nodeStatus}</CardDescription>
      </CardHeader>
      {nodeStatus === 'active' && (
        <CardContent>
          <Sheet open={nodeProps.selected} modal={false}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Run Inference</SheetTitle>
              </SheetHeader>
              <InferenceForm
                onSubmitHandler={(formSubmitData) => {
                  const connectedNetworkLabel = getConnectedNetworkLabel();
                  if (!connectedNetworkLabel) {
                    toast({
                      title: 'Error',
                      description: 'Please connect a network node.',
                    });
                    return;
                  }
                  actor.send({
                    type: 'start',
                    data: {
                      formData: formSubmitData,
                      connectedNodeName: connectedNetworkLabel,
                    },
                  });
                  toast({
                    title: 'You submitted the following values:',
                    description: (
                      <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                        <code className="text-white">
                          {JSON.stringify(
                            { ...formSubmitData, ...nodeProps.data },
                            null,
                            2,
                          )}
                        </code>
                      </pre>
                    ),
                  });
                }}
              />
            </SheetContent>
          </Sheet>
        </CardContent>
      )}
      {nodeStatus === 'busy' && (
        <>
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
        </>
      )}
      {nodeStatus === 'error' && (
        <CardContent>
          <div className="flex flex-col">
            <p className="mb-2 text-3xl font-extrabold text-center">{jobId}</p>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {jobStatus}
            </p>
          </div>
          <Sheet open={nodeProps.selected} modal={false}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Retry</SheetTitle>
              </SheetHeader>
              <InferenceForm
                inputImages={inputImages}
                onSubmitHandler={(formSubmitData) => {
                  const connectedNetworkLabel = getConnectedNetworkLabel();
                  if (!connectedNetworkLabel) {
                    toast({
                      title: 'Error',
                      description: 'Please connect a network node.',
                    });
                    return;
                  }
                  actor.send({
                    type: 'retry',
                    data: {
                      formData: formSubmitData,
                      connectedNodeName: connectedNetworkLabel,
                    },
                  });
                  toast({
                    title: 'You submitted the following values:',
                    description: (
                      <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                        <code className="text-white">
                          {JSON.stringify(formSubmitData, null, 2)}
                        </code>
                      </pre>
                    ),
                  });
                }}
              />
            </SheetContent>
          </Sheet>
        </CardContent>
      )}
      {nodeStatus === 'success' && (
        <CardContent>
          <div className="flex flex-col">
            <p className="mb-2 text-3xl font-extrabold text-center">{jobId}</p>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {jobStatus}
            </p>
            <div>
              <Sheet open={nodeProps.selected} modal={false}>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Inference Results</SheetTitle>
                  </SheetHeader>
                  {inputImages.map((image, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-sky-800 hover:bg-blue-200 dark:hover:bg-cyan-800 px-4 py-3 font-mono text-sm"
                    >
                      {image.name}
                    </div>
                  ))}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
