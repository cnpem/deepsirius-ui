'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '~/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';

const patchSizes = ['16', '32', '64', '128', '256', '512', '1024'] as const;
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
  //
  // field dropClassifier of type z.boolean()
  dropClassifier: z.boolean(),
  // field of type z.enum() with options of '1', '2', '4'
  jobGPUs: z.enum(['1', '2', '4']),
  // field of type z.number() with a minimum value of 1
  iterations: z.coerce.number().gte(1, { message: 'Must be >= 1' }),
  // field of type z.number() with a minimum value of 1
  epochs: z.coerce.number().gte(1, { message: 'Must be >= 1' }),
  // field of type z.number() with a minimum value of 0
  learningRate: z.coerce.number().gt(0, { message: 'Must be greater than 0' }),
  // field of type z.enum() with options of 'Adam', 'SGD'
  optimizer: z.enum(['adam', 'SGD']),
  // field of type z.enum() with options of 'CrossEntropy', 'dice', 'xent_dice'
  // meaning cross entropy, dice or both combined
  lossFunction: z.enum(['CrossEntropy', 'dice', 'xent_dice']),
  // field of type z.enum() with options of 'unet2D', 'unet3D', 'vnet'
  networkTypeName: z.enum(['unet2d', 'unet3d', 'vnet']),
  // field of type z.enum() with options of powers of 2
  patchSize: z.enum(patchSizes),
});

export type NetworkForm = z.infer<typeof networkFormSchema>;
export type networkFormCallback = (data: NetworkForm) => void;

type NetworkFormProps = {
  onSubmitHandler: networkFormCallback;
};
export function NetworkForm({ onSubmitHandler }: NetworkFormProps) {
  const form = useForm<NetworkForm>({
    resolver: zodResolver(networkFormSchema),
    defaultValues: {
      networkUserLabel: '',
      networkTypeName: 'unet2d',
      dropClassifier: false,
      jobGPUs: '1',
      iterations: 1,
      epochs: 1,
      learningRate: 0.00001,
      optimizer: 'adam',
      patchSize: '32',
      lossFunction: 'CrossEntropy',
    },
  });

  type FieldItem = {
    label: string;
    value: string;
  };

  type FormFieldItems = FieldItem[];

  const networkOpts: FormFieldItems = [
    { label: 'unet 2D', value: 'unet2d' },
    { label: 'unet 3D', value: 'unet3d' },
    { label: 'vnet', value: 'vnet' },
  ];

  const optmizerOpts: FormFieldItems = [
    { label: 'Adam', value: 'adam' },
    { label: 'SGD', value: 'SGD' },
  ];

  const lossOpts: FormFieldItems = [
    { label: 'Cross Entropy', value: 'CrossEntropy' },
    { label: 'Dice', value: 'dice' },
    { label: 'Cross Entropy + Dice', value: 'xent_dice' },
  ];

  const onSubmit = () => {
    onSubmitHandler(form.getValues());
  };

  // function to round learningRate step value (to be used in the input form) to the nearest power of 10 if < 1 and to 1 if > 1
  const learningRateStep = () => {
    const lr = form.watch('learningRate');
    if (lr > 1) {
      return '1';
    } else {
      return lr
        .toString()
        .replace(/\d(?=.*[1-9]$)/g, '0')
        .replace(/[1-9]/g, '1');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
        className="grid items-center justify-center"
      >
        <FormField
          name="networkUserLabel"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network Label</FormLabel>
              <FormControl>
                <Input {...field} placeholder="MyFancyNetwork" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="networkTypeName"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex items-center justify-center rounded-lg py-4">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-2"
                >
                  {networkOpts.map((option) => (
                    <div key={option.value} className="items-center space-x-1">
                      <FormLabel>{option.label}</FormLabel>
                      <RadioGroupItem value={option.value} />
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="dropClassifier"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg py-2">
              <FormLabel className="text-base">Drop Classifier</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
                <Input {...field} type="number" step={learningRateStep()} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="optimizer"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg py-2">
              <FormLabel>Optimizer</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex justify-end"
                >
                  {optmizerOpts.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-1"
                    >
                      <FormLabel>{option.label}</FormLabel>
                      <RadioGroupItem value={option.value} />
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="lossFunction"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loss Function</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lossOpts.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="patchSize"
          render={({ field }) => (
            <FormItem className="py-2">
              <FormLabel>Patch Size</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patchSizes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
