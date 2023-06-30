import { useMachine } from '@xstate/react';
import { useCallback, useEffect } from 'react';
import { Handle, type NodeProps, Position, useReactFlow } from 'reactflow';
import { assign, createMachine } from 'xstate';
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
import { type NodeData } from '~/components/workboard/nodes';
import { api } from '~/utils/api';

interface JobEvent {
  type: 'done.invoke';
  data: { jobId?: string; jobStatus?: string; formData?: NetworkFormType };
}

const networkState = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDswBcDuB7ATgawDoBLZAQwGM0iA3MAYgqutLTAG0AGAXUVAAcssIlSzJeIAB6IAjADYAzAQCcKlbOkAOeUoBMOgOwAaEAE9EG6QQCsHWxyVX1sjUo76Avu+OpMuQoxp6WDRSHDQAAjQcUhISKE4eJBABIRExJKkEABY3AiydTXzpLKz9RyzjMwQLazt7RzkXN09vdGx8AiiY5DiCPjBkCDi6CFEwYmRqLDxx2ABXACMAW2EAKSwFhPEU4SJRcUydJX0CA1klLPkreQ1bOVlKmX1NAmkrOWk9DWf7WRaQHztQhdWLIKB9AZDMF0MA4HC4PoAGxYADNcEsCPNlmsNlskjs0gdEEcTmcLlcbndZA9TDIsi95BwrHomUpbhx5Dp-oC-J1oqDwTg5sgetDRqgJlMZgQeR0QaLBcKFQgSFNyCw9sgEnj+IJdvsMjJORwCLJ7PlZDpmTobvJHghpPpZCcrPoOcbiqVndy2rz5b0hSLhuLxqrpuNZcD+QqCIHlWH1WltdJErrUpqiQgyoppPIFHn3ozZFkrPaPiarBpi9cOLdqZafb45dGA0rg2NJeGZb7m91W0GwSrJlhE5rtTpU8k9YTDVnrq88-IC7mONWy7JKwRa8WNDp1LdGo2gXy+2DY22xR2w9LIyeBeeB1Ah2qNaJtfJJwSM7OstSCJybhtGw3RtGkqjkJdai0fQyiUaR7E5I8-RbM842GdVkHIMBER1Kd0wNUBMmuUlPXeeCNEufQlDLYjrCsZkKXrfQNCsJDe3vWF4RwOgcHQHATFwr8CMkRAlAUAgNCrK49z0K5mTLK0TTNHQEOKPQFA0NjCHmcgsNgWA6BREh0GFdhuG2adv0IxBLXteRLi3Owl0ZJQKV-LTOmFXp+kGdsJWvWZFhWNB1k2cz8Us4TMnOCs2Vcy5jl-Xd7WYjQF1uVwNwo7R5A8tAvLPHyoSgGE4QRPhkTQNEcAxLFgtCwTIvSayEBi6w4vs7R9CSnR7SySTTjg84XHOJcdCrPKCsVR8RivYcbx7YEpofeNh1HN9uEa-DmpEh0lyU80ZOtW0y1rSwfguX84OkFRJpjNDL38+aI0Wzz7ovJ8E1fLVNpTCztszaRilkPJK05fR5H0K15CB+1nArKHXOKd4VErO7+wVWanqlF6myW97H2fEdvvHT8msB4HQa0AxIeh2HaSzcat0Rs0Ot-P4vABV78oJzGQ07Ba8bejG4iJ9afq4NgP3+-UdsyFilFNEsLEuakslcaQUo5PILhYqwxJ0fIjnR1CProDCsJw8K01lzNXIrPMShu51XBKOHciselnkhylay5Tnbx53pONwHi+IE628Nt2dc1dU5a06-rNAKCoGeNaxJNdN5Y9c1juSwCA4HESMZZnFqAFpvleI5ORJGCrWce1y6sZRVF1z42XsDhpA8kgAloUurN2-J7V3Ry7AcJwmg8APXv7sBB6i4kWLyAo9becbXLA8wdHH2xJ8aVwZ9aIX-TBRe5cQcvtGr1y9GOevHA0MsINeDgU9-GwOByLI8pQ8EipxAvpmNK3xVwwXfnobqtd1yuQINmG6iVtDfD-qeaaCpgGzhsIrCGzELiuFcDJMsENLC-g3o4JkN1LioI4mVHAmCWrkRbv1feeCWJ2gZnIXIoESx5lsN1caHkdJ6XgBFAGMdLQg1dBYFw7xKLUlOloU48ELhlCrN-f2J9jxB3PmI6OLUrhZFeLoakqVHQ5GfgzG0ihawsX6mRJ2S4TYAMhEAvRZdh7v2MXuZ0klzG1hSuJCGYlmJA2uHIPOWi-TLQelABhu1XA2P1pnJ0FFdBGAZgePILCOTHA3IbZxBAQ70PcUPTIxRmISXfrYsoVExKpyqM6Uk98YbHBUlDPOnggA */
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
        'start training': 'training',
      },
    },
    training: {
      initial: 'pending',
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
      on: {
        finetune: {
          target: 'tuning',
          actions: assign({ jobStatus: '', jobId: '' }),
        },
      },
    },
    tuning: {
      initial: 'pending',
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

export function NetworkNode({ id, data }: NodeProps) {
  const createJob = api.remotejob.create.useMutation();
  const checkJob = api.remotejob.status.useMutation();
  const cancelJob = api.remotejob.cancel.useMutation();
  const { getNodes, addNodes } = useReactFlow();

  console.log('network node data', data);

  const updateNodeData = useCallback(
    (data: NodeData) => {
      const nodes = getNodes();
      const node = nodes.find((node) => node.id === id);
      if (node) {
        addNodes([
          {
            ...node,
            data: {
              ...data,
            },
          },
        ]);
      }
    },
    [addNodes, getNodes, id],
  );

  // const setNodeData = useStore((state) => state.setNodeData);
  // const nodeId = useNodeId();
  // // defining node id as string to avoid error on updateNodeMachineState
  // const nodeIdDefined = typeof nodeId === 'string' ? nodeId : 'undefined';

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
          const jobInput = {
            jobName: 'deepsirius-network',
            output: 'output-do-pai-custom.txt',
            error: 'error-dos-outros-custom.txt',
            ntasks: 1,
            partition: 'dev-gcd',
            command:
              'echo "' +
              JSON.stringify(formData) +
              '" \n sleep 5 \n echo "job completed."',
          };
          if (state.matches('tuning') || event.type === 'finetune') {
            console.log('tuning');
          }
          if (state.matches('training') || event.type === 'start training') {
            console.log('training');
          }

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

  const isBusy = [
    { training: 'pending' },
    { training: 'running' },
    { tuning: 'pending' },
    { tuning: 'running' },
  ].some((s) => state.matches(s));
  const isError = [{ training: 'error' }, { tuning: 'error' }].some((s) =>
    state.matches(s),
  );

  // defining status as a high level machineState
  const status = typeof state.value === 'object' ? 'busy' : state.value;

  useEffect(() => {
    console.log('useEffect on state: ', status);
    // defining a networkLabel to avoid error on updateNodeMachineState
    const networkLabelDefined =
      typeof state.context.networkLabel === 'string'
        ? state.context.networkLabel
        : 'undefined';
    // data do be updated on node
    const updateData: NodeData = {
      label: networkLabelDefined,
      xState: status,
    };
    // updating node data
    updateNodeData(updateData);
  }, [state.context.networkLabel, status, updateNodeData]);

  return (
    <>
      {state.matches('inactive') && (
        <Card className="w-[380px] bg-gray-100 dark:bg-muted">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{state.context.networkLabel}</CardTitle>
            <CardDescription>{state.value}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-start">
            <Button onClick={() => send('activate')}>activate</Button>
          </CardFooter>
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
      {state.matches('active') && (
        <Card className="w-[380px] bg-green-100 dark:bg-teal-800">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{state.context.networkLabel}</CardTitle>
            <CardDescription>{state.value}</CardDescription>
          </CardHeader>
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
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
      {isBusy && (
        <Card className="w-[380px] bg-yellow-100 dark:bg-amber-700">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{state.context.networkLabel}</CardTitle>
            <CardDescription>
              {Object.entries(state.value)
                .map(([key, value]) => `${key}: ${value as string}`)
                .join('<br/>')}
            </CardDescription>
          </CardHeader>
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
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
      {isError && (
        <Card className="w-[380px] bg-red-100 dark:bg-rose-700">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{state.context.networkLabel}</CardTitle>
            <CardDescription>
              {Object.entries(state.value)
                .map(([key, value]) => `${key}: ${value as string}`)
                .join('<br/>')}
            </CardDescription>
          </CardHeader>
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
                  {state.matches('training.error') && (
                    <NetworkForm
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
                  )}
                  {state.matches('tuning.error') && (
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
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
      {state.matches('success') && (
        <Card className="w-[380px] bg-blue-100 dark:bg-cyan-700">
          <Handle type="target" position={Position.Left} />
          <CardHeader>
            <CardTitle>{state.context.networkLabel}</CardTitle>
            <CardDescription>{JSON.stringify(state.value)}</CardDescription>
          </CardHeader>
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
          <Handle type="source" position={Position.Right} />
        </Card>
      )}
    </>
  );
}
