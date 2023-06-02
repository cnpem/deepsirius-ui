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
import { Switch } from '~/components/ui/switch';

// TODO: create schema in and form controls for custom options for each network type (patch dimensions)
const networkBaseSchema = z.object({
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
});

// field of  with options of 'unet2D', 'unet3D', 'vnet'
const networkType = z.enum(['unet2d', 'unet3d', 'vnet']);

const unet2dSchema = networkBaseSchema.extend({
  networkTypeName: z.literal(networkType.enum.unet2d),
  hue: z.enum(['1', '2', '4']),
});

const unet3dSchema = networkBaseSchema.extend({
  networkTypeName: z.literal(networkType.enum.unet3d),
  hue: z.enum(['5', '6', '7']),
});

const vnetSchema = networkBaseSchema.extend({
  networkTypeName: z.literal(networkType.enum.vnet),
  hue: z.enum(['8', '9', '10']),
});

const networkFormSchema = z.discriminatedUnion('networkTypeName', [
  unet2dSchema,
  unet3dSchema,
  vnetSchema,
]);

export type NetworkForm = z.infer<typeof networkFormSchema>;
export type networkFormCallback = (data: NetworkForm) => void;

type NetworkFormProps = {
  onSubmitHandler: networkFormCallback;
};
export function NetworkForm({ onSubmitHandler }: NetworkFormProps) {
  const form = useForm<NetworkForm>({
    resolver: zodResolver(networkFormSchema),
    defaultValues: {
      networkUserLabel: 'NewName',
      networkTypeName: 'unet2d',
      hue: '1',
      dropClassifier: false,
      jobGPUs: '1',
      iterations: 1,
      epochs: 1,
      learningRate: 0.00001,
      optimizer: 'adam',
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

  const selectHueOpts: FormFieldItems = (network: string) => {
    switch (network) {
      case 'unet2d':
        return [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '4', value: '4' },
        ];
      case 'unet3d':
        return [
          { label: '5', value: '5' },
          { label: '6', value: '6' },
          { label: '7', value: '7' },
        ];
      case 'vnet':
        return [
          { label: '8', value: '8' },
          { label: '9', value: '9' },
          { label: '10', value: '10' },
        ];
    }
  };

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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="networkTypeName"
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
                  {networkOpts.map((option) => (
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
          name="hue"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>hue</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={selectHueOpts(form.watch('networkTypeName'))}
                  className="flex items-center justify-center space-x-2"
                >
                  {selectHueOpts(form.watch('networkTypeName')).map(
                    (option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-1"
                      >
                        <FormLabel>{option.label}</FormLabel>
                        <RadioGroupItem value={option.value} />
                      </div>
                    ),
                  )}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="dropClassifier"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Drop Classifier</FormLabel>
              </div>
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
                <Input {...field} type="number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="optimizer"
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
              <FormLabel>Network Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center justify-center space-x-2"
                >
                  {lossOpts.map((option) => (
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
