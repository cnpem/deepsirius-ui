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
import { sbatchDummyContent, submitJob } from '~/server/remote-job';

import { type NodeData, NodeWrapper } from './common-node-utils';

const nodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDsD2EwFsCGBjAFgJbJgB0xeALoQG5gDEVt2lYA2gAwC6ioADqliFqqZLxAAPRAFoArADZSATgDMARiXyATCs0cVADhXyANCACeiFQBZFSrQesGA7CtcGOsg-IC+Ps2gYOATEZEx09LCU2ABOlAAElDHYxMRQnDxIIAJCImJZUghq3qROSkoGOhw6HqYWVrbKDrbOzt7V9n4B6Fh4RCSkAEYArrDm9AAqAJIAwgDSGeI5woSi4oWGWqRaHC7WzvKy+sYqZpYIWtZqpLo7arryztayugZdIIG9IQMjY-QAcgB5QEABUWWWWeXWiB01wMtQ08nkalaWi0Zxh+lKsg0WjU92csms70+wX6ZDAMRiqBi9BiYCS5nB-EEKzWBUQxUUZQqVRqHDq52snlKzS8Kn0HhUshJPTJoVIsGGuFwcFg9AAZqFKMMSMzsqyoRyiiUeZUJfzBYhbComo55I4OKoicTZRh4FlSX1QktDat8qBCtJYcp1EpnEojpclPcMUU1LJlDiY0oOsjNL5-B85d6BhRcNQ6L7cv7oQhpMVbaoNBGo9YY6d6hcVFstMijPpw2phZ43V9yaRwmBi2yA5JEPJrKUDOU29V9E9G+cbM5RY4XG5DJ5vH35T9RucWSX2YGrC9SoupRwDqnZHGbFsbDjbNZdBVZE9d7mKVSaSOjaeCCTtO5SOG0bgcK+cbCom9iOOKkr6DKWZet8ZBKiqar-qWxrAWa+xGM4kFLtaeHNA6wrOtYrp+EAA */
  id: 'nodemachine',
  initial: 'inactive',
  context: {
    counter: 0,
    jobId: '',
  },
  states: {
    inactive: {
      on: {
        activate: 'active',
      },
    },

    active: {
      on: { 'start training': 'busy' },
    },

    busy: {
      invoke: {
        src: (context) =>
          interval(1000).pipe(
            map(() =>
              context.counter > 3 ? { type: 'NOOP' } : { type: 'TICK' },
            ),
          ),
      },
      on: {
        TICK: {
          target: 'busy',
          actions: assign({
            counter: (context) => context.counter + 1,
          }),
        },
        NOOP: {
          target: 'inactive',
          actions: assign({
            counter: 0,
          }),
        },
      },
    },

    error: {
      on: { retry: 'busy' },
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const onSubmit: SubmitHandler<FormData> = (data) => {
    try {
      console.log(data);
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
    </form>
  );
}

type NetworkNode = Node<NodeData>;
export function NetworkNode({ data }: NodeProps<NodeData>) {
  const { label = 'network' } = data;
  const nodeId = useNodeId() || '';
  const [state, send] = useMachine(nodeMachine);

  return (
    <NodeWrapper label={label + nodeId} state={state.value.toString()}>
      <Handle type="target" position={Position.Top} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>{`I'm the ${label} ${nodeId}`}</div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Lets props!</AccordionTrigger>
          <AccordionContent>
            <div>my state now: {state.value.toString()}</div>
            <div className="flex p-2">
              <Button onClick={() => send('inactive')}>inactive</Button>
              <Button onClick={() => send('activate')}>active</Button>
              <Button onClick={() => send('start training')}>
                start training
              </Button>
              <Button onClick={() => send('check status')}>check status</Button>
              <Button onClick={() => send('cancel')}>cancel</Button>
            </div>
            <Form />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
}
