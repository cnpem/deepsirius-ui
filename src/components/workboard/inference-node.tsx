import { useActor, useInterpret } from '@xstate/react';
import { useCallback, useEffect, useState } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import { State, type StateFrom, assign, createMachine } from 'xstate';
import { shallow } from 'zustand/shallow';
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
  type FormType,
  InferenceForm,
} from '~/components/workboard/node-component-forms/inference-form';
import { type NodeData, type Status } from '~/hooks/use-store';
import useStore from '~/hooks/use-store';
import { api } from '~/utils/api';

interface JobEvent {
  type: 'done.invoke';
  data: { jobId?: string; jobStatus?: string; formData?: FormType };
}

const inferenceMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEsB2AzMAnMqDGYAdGgIZ4AuyAbmAMRmVUnlgDaADALqKgAOA9rGSV+qHiAAeiAIwA2AMyEAnCqUB2JQCYAHEoCs2te1kAaEAE9E82ZsJrNsvWoAsavUtnsdzgL4+zaJg4+EQM1HSw5CRY5BzcSCACQiJiCVIIzuxqhM6a0tp67tq60vLWZpYI1rb2jnoKes7S7OzafgEY2LgEhABGAK6w5oS8uBBoULQQokRoVPwA1kSw-b0AtsIAUvy9ceJJwsii4unarTnazvJn7HqamhraFYhOeoROmlrSV9Vl7SCBLohPqDYajVDjVCTbBYfhYEYAG2Y6Dha0IK3WWx2ewSBxSJxkOiUhHkVzU8nJmnkSmkBmeCAeb1qTjUcmk9n0-0BwR6AyGhCw-VQqAmUxmxFQ8yWEqC3SIfOGguFEwQc34eGYR1QcRxfEEh2OaUJuhJZIp8ipNLpFkQskMhBaam09yUZPuei5nR58tBAqFIqhYtQs0lixDsuBCr9yqhqtDGpSOuk8T1yS1BIQ0k+xNJ5sp1NpTxtCHctkdzoM0izzl8-gBXrlIP5SoDk2mwYlUvDQN5vpbKrVCa1Os0KcS+vxRsz2dNeYtBetlQUxL0WWdZJc2gtnojveb-tF7ZDXZlPZ9+5jUDj8yHoh18jHePTU-U2T08izdyyt2a8npziUdhlE+IwyircktB3M8m0VA9Aw1EIEV1cc00NUB0maZxtByPJLjtJRikA0xi2pZxlDURwKJrLCAOkKDvUIGE4VoHByCwcxkKfNDJBeFoHSdLMXGuRp1HpbRpHeFoWmkQCrgcLD6MbFY8AIWBYFodA0DAcghTYLh9gnZ90N4oC10Eq4CgAtR6QoiSiM0XImnfJ0lD8OtUH4CA4HEbk5QM1DUmMhAAFpiMqULFOBUgKHCfyDUCniMk0elrEUe5KNcdxPG8SKejCGg4snIKdDeXJ8go2QVAtBQUoUQh0qcTKPC8S5cvPSpU3ijMsOyMyHgskTrJIrIcgogwKTk8lZFrDpd3akYxgmQqjMS983j6oTLNE4tChXACAIc75qXkNqYOjVtlu4jCvCA1133Yax8iaYp6QMbDih0TRnLJGxTqYrBLoSjCbAku0XCUakFBrelPv4xxdGdZpvtO5TVPgXFDKumQDDeD8HK3ORDDOP9i0qiT3CrMrZCh0k3J8IA */
  id: 'inference',
  schema: {
    context: {} as {
      jobId: string;
      jobStatus: string;
      inputImages: Array<{ name: string; path: string }>;
    },
    events: {} as
      | { type: 'activate' }
      | { type: 'start'; data: { formData: FormType } }
      | { type: 'cancel' }
      | { type: 'retry'; data: { formData: FormType } }
      | { type: 'finetune'; data: { formData: FormType } },
  },
  initial: 'inactive',
  context: {
    jobId: '',
    jobStatus: '',
    inputImages: [],
  },
  states: {
    inactive: {
      on: {
        activate: 'active',
      },
    },

    active: {
      on: {
        start: 'busy',
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

export function InferenceNode({ id, data }: NodeProps<NodeData>) {
  const thisNodeNachine = inferenceMachine; // hack for writing the same functions for all nodes (TODO: there's a better way to do this)
  const createJob = api.remotejob.create.useMutation();
  const checkJob = api.remotejob.status.useMutation();
  const cancelJob = api.remotejob.cancel.useMutation();
  const updateNodeDbData = api.workspace.updateNodeData.useMutation();
  const { edges, onUpdateNode } = useStore(
    (state) => ({
      edges: state.edges,
      onUpdateNode: state.onUpdateNode,
    }),
    shallow,
  );

  // handle node activation if theres a source node connected to it
  const handleActivation = () => {
    const sourceNode = edges.find((edge) => edge.target === id)?.source;
    if (sourceNode) {
      send('activate');
    } else {
      // TODO: make this pretty
      alert('Please connect a source node to this node.');
    }
  };

  const [status, setStatus] = useState<Status>(data.status);

  const updateData = useCallback(
    (data: NodeData) => {
      console.log('useCallback on update node data', data);
      // updating in the store
      onUpdateNode({
        id: id, // this is the component id from the react-flow
        data: data,
      });
      // updating on the db
      void updateNodeDbData.mutate(
        data as { registryId: string; status: string; xState: string },
      );
    },
    [onUpdateNode, id, updateNodeDbData],
  );

  const prevXState = State.create(
    data.xState
      ? (JSON.parse(data.xState) as StateFrom<typeof thisNodeNachine>)
      : thisNodeNachine.initialState,
  );

  const defineStatus = (state: StateFrom<typeof thisNodeNachine>) => {
    return typeof state.value === 'object' ? 'busy' : (state.value as Status);
  };

  const actor = useInterpret(
    thisNodeNachine,
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
            const formData =
              event.type !== 'cancel' && event.type !== 'activate'
                ? event.data.formData
                : '';
            console.log('data submit: ', formData);
            const jobInput = {
              jobName: 'deepsirius-inference',
              output: 'output-do-pai-custom.txt',
              error: 'error-dos-outros-custom.txt',
              ntasks: 1,
              partition: 'dev-gcd',
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
      // subscribes to state changes and check if there is a status change to update the node data
      if (defineStatus(state) !== status) {
        console.log(
          'State Machine: status changed: ',
          status,
          ' => ',
          defineStatus(state),
        );
        setStatus(defineStatus(state));
        updateData({
          ...data,
          status: defineStatus(state),
          xState: JSON.stringify(state),
        });
      }
    },
  );

  const [
    // The current state of the actor
    state,
    // A function to send the machine events
    send,
  ] = useActor(actor);

  return (
    <Card
      data-state={status}
      className="w-[420px] data-[state=active]:bg-green-100 data-[state=busy]:bg-yellow-100
    data-[state=error]:bg-red-100 data-[state=inactive]:bg-gray-100
    data-[state=success]:bg-blue-100 data-[state=active]:dark:bg-teal-800
    data-[state=busy]:dark:bg-amber-700 data-[state=error]:dark:bg-rose-700
    data-[state=inactive]:dark:bg-muted data-[state=success]:dark:bg-cyan-700"
    >
      <Handle type="target" position={Position.Left} />
      <CardHeader>
        <CardTitle>{'inference'}</CardTitle>
        <CardDescription>{status}</CardDescription>
      </CardHeader>
      {state.matches('active') && (
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Want some inference?</AccordionTrigger>
              <AccordionContent>
                <InferenceForm
                  onSubmitHandler={(formSubmitData) => {
                    send({
                      type: 'start',
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
                <InferenceForm
                  inputImages={state.context.inputImages}
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
            <div>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Inferred images</AccordionTrigger>
                  <AccordionContent>
                    {state.context.inputImages.map((image, idx) => (
                      <div
                        key={idx}
                        className="rounded-md border border-sky-800 hover:bg-blue-200 dark:hover:bg-cyan-800 px-4 py-3 font-mono text-sm"
                      >
                        {image.name}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </CardContent>
      )}
      {state.matches('inactive') && (
        <CardFooter className="flex justify-start">
          <Button onClick={handleActivation}>activate</Button>
        </CardFooter>
      )}
    </Card>
  );
}
