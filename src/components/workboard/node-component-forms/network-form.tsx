'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '~/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

const networkFormSchema = z.object({
  // field of type z.string() with no spaces or special characters allowed
  networkUserLabel: z
    .string()
    .min(2, {
      message: 'Network label name must be at least 2 characters.',
    })
    .regex(/^[a-zA-Z0-9_]*$/, {
      message:
        'Network label name must contain only letters, numbers underscores and no spaces.',
    }),
  // field of  with options of 'unet2D', 'unet3D', 'vnet'
  networkType: z.enum(['unet2d', 'unet3d', 'vnet']),
  // field of type z.enum() with options of '1', '2', '4'
  jobGPUs: z.enum(['1', '2', '4']),
  // field of type z.number() with a minimum value of 1
  iterations: z.number().gte(1, { message: 'Must be >= 1' }),
  // field of type z.number() with a minimum value of 1
  epochs: z.number().gte(1, { message: 'Must be >= 1' }),
  // field of type z.number() with a minimum value of 0
  learningRate: z.number().gt(0, { message: 'Must be greater than 0' }),
  // field of type z.enum() with options of 'Adam', 'SGD'
  optimizer: z.enum(['adam', 'SGD']),
  // field of type z.enum() with options of 'CrossEntropy', 'dice', 'xent_dice'
  // meaning cross entropy, dice or both combi
  lossFunction: z.enum(['CrossEntropy', 'dice', 'xent_dice']),
});

export type NetworkForm = z.infer<typeof networkFormSchema>;
export type networkFormCallback = (data: NetworkForm) => void;

export function NetworkForm() {
  // 1. Define your form.
  const form = useForm<NetworkForm>({
    resolver: zodResolver(networkFormSchema),
    defaultValues: {
      networkUserLabel: 'NewName',
      networkType: 'unet2d',
      jobGPUs: '1',
      iterations: 1,
      epochs: 1,
      learningRate: 0.00001,
      optimizer: 'adam',
      lossFunction: 'CrossEntropy',
    },
  });

  // 2. Define a submit handler.
  // function onSubmit(values: NetworkForm) {
  //   // Do something with the form values.
  //   // ✅ This will be type-safe and validated.
  //   console.log('hey');
  //   console.log(values);
  // }
  const onSubmit = (data: NetworkForm, e) => {
    console.log(data);
    // onSubmitHandler(data);
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid items-center justify-center"
      >
        <FormField
          name="networkUserLabel"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Give your network a name!</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="networkType"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center justify-center space-x-2"
                >
                  <div className="flex items-center space-x-1">
                    <FormLabel>unet2D</FormLabel>
                    <RadioGroupItem value="unet2d" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <FormLabel>unet3D</FormLabel>
                    <RadioGroupItem value="unet3d" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <FormLabel>vnet</FormLabel>
                    <RadioGroupItem value="vnet" />
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the type of network you would like to create.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          name="jobGPUs"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of GPUs</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center justify-center space-x-2"
                >
                  <div className="flex items-center space-x-1">
                    <FormLabel>1</FormLabel>
                    <RadioGroupItem value="1" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <FormLabel>2</FormLabel>
                    <RadioGroupItem value="2" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <FormLabel>4</FormLabel>
                    <RadioGroupItem value="4" />
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the number of GPUs you would like to use.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          name="iterations"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Iterations</FormLabel>
              <FormControl>
                <Input {...field} type="number" />
              </FormControl>
              <FormDescription>
                Select the number of iterations you would like to use.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="epochs"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Epochs</FormLabel>
              <FormControl>
                <Input {...field} type="number" />
              </FormControl>
              <FormDescription>
                Select the number of epochs you would like to use.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="learningRate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Learning Rate</FormLabel>
              <FormControl>
                <Input {...field} type="number" />
              </FormControl>
              <FormDescription>
                Select the learning rate you would like to use.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="optimizer"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Optimizer</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center justify-center space-x-2"
                >
                  <div className="flex items-center space-x-1">
                    <FormLabel>Adam</FormLabel>
                    <RadioGroupItem value="adam" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <FormLabel>SGD</FormLabel>
                    <RadioGroupItem value="SGD" />
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the optimizer you would like to use.
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          name="lossFunction"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loss Function</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center justify-center space-x-2"
                >
                  <div className="flex items-center space-x-1">
                    <FormLabel>Cross Entropy</FormLabel>
                    <RadioGroupItem value="CrossEntropy" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <FormLabel>Dice</FormLabel>
                    <RadioGroupItem value="dice" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <FormLabel>Cross Entropy + Dice</FormLabel>
                    <RadioGroupItem value="xent_dice" />
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the loss function you would like to use.
              </FormDescription>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
