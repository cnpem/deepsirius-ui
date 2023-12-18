'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { slurmGPUOptions, slurmPartitionOptions } from '~/lib/constants';

const slurmOptions = z.object({
  partition: z.enum(slurmPartitionOptions),
  nGPU: z.enum(slurmGPUOptions),
});

const patchSizes = ['16', '32', '64', '128', '256', '512', '1024'] as const;
export const networkSchema = z.object({
  slurmOptions,
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
  // field of type z.number() with a minimum value of 0
  learningRate: z.coerce.number().gt(0, { message: 'Must be greater than 0' }),
  // field of type z.enum() with options of 'Adam', 'SGD'
  optimizer: z.enum([
    'adam',
    'momentum',
    'adagrad',
    'nesterov',
    'gradientdescent',
    'rmsprop',
  ]),
  // field of type z.enum() with options of 'CrossEntropy', 'dice', 'xent_dice'
  // meaning cross entropy, dice or both combined
  lossFunction: z.enum(['CrossEntropy', 'dice', 'xent_dice']),
  // field of type z.enum() with options of 'unet2D', 'unet3D', 'vnet'
  networkTypeName: z.enum(['unet2d', 'unet3d', 'vnet']),
  // field of type z.enum() with options of powers of 2
  patchSize: z.enum(patchSizes),
});

export type NetworkFormType = z.infer<typeof networkSchema>;
export type networkFormCallback = (data: NetworkFormType) => void;

type NetworkFormProps = {
  onSubmitHandler: networkFormCallback;
  networkUserLabel?: string;
  networkTypeName?: z.infer<typeof networkSchema>['networkTypeName'];
};

export function useNetworkForm({
  networkUserLabel = '',
  networkTypeName = 'unet2d',
}: {
  networkUserLabel?: string;
  networkTypeName?: z.infer<typeof networkSchema>['networkTypeName'];
}) {
  const form = useForm<NetworkFormType>({
    resolver: zodResolver(networkSchema),
    defaultValues: {
      networkUserLabel: networkUserLabel,
      networkTypeName: networkTypeName,
      dropClassifier: false,
      jobGPUs: '1',
      iterations: 1,
      learningRate: 0.00001,
      optimizer: 'adam',
      patchSize: '32',
      lossFunction: 'CrossEntropy',
      slurmOptions: {
        nGPU: '1',
      },
    },
  });

  return form;
}

const learningRateStep = 0.00001;

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

const optimizerOpts: FormFieldItems = [
  { label: 'Adam', value: 'adam' },
  { label: 'Momentum', value: 'momentum' },
  { label: 'Adagrad', value: 'adagrad' },
  { label: 'Nesterov', value: 'nesterov' },
  { label: 'Gradient Descent', value: 'gradientdescent' },
  { label: 'RMS Prop', value: 'rmsprop' },
];

const lossOpts: FormFieldItems = [
  { label: 'Cross Entropy', value: 'CrossEntropy' },
  { label: 'Dice', value: 'dice' },
  { label: 'Cross Entropy + Dice', value: 'xent_dice' },
];

export function DefaultForm({ onSubmitHandler }: NetworkFormProps) {
  const form = useNetworkForm({});

  const onSubmit = () => {
    onSubmitHandler(form.getValues());
  };

  return (
    <Form {...form}>
      <form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
        <FormField
          name="networkUserLabel"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={field.name}>Network Label</FormLabel>
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
                      <FormLabel htmlFor={option.label}>
                        {option.label}
                      </FormLabel>
                      <RadioGroupItem id={option.label} value={option.value} />
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
            <FormItem className="">
              <FormControl>
                <div className=" flex items-center space-x-4 py-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Drop Classifier
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
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
            name="learningRate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Learning Rate</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step={learningRateStep} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          name="optimizer"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Optimizer</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {optimizerOpts.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="lossFunction"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loss Function</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
              <FormItem>
                <FormLabel>Patch Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
        </div>
        <footer className="grid grid-cols-2 grid-rows-2 gap-4">
          <FormField
            control={form.control}
            name="slurmOptions.partition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Slurm Partition</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Slurm Partition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {slurmPartitionOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="hidden">
                  Please select a slurm partition assigned for your user for
                  submitting this job.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slurmOptions.nGPU"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Slurm gres GPUs</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Slurm GPUs" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {slurmGPUOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {`GPUs: ${item.toString()}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="hidden">
                  Please select the number of GPUs for this job.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="my-2 mx-0 col-span-2" type="submit">
            Submit
          </Button>
        </footer>
      </form>
    </Form>
  );
}

export function PrefilledForm({
  networkUserLabel,
  networkTypeName,
  onSubmitHandler,
}: NetworkFormProps) {
  const form = useNetworkForm({
    networkUserLabel,
    networkTypeName,
  });

  const onSubmit = () => {
    onSubmitHandler(form.getValues());
  };

  return (
    <Form {...form}>
      <form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
        <FormField
          name="dropClassifier"
          control={form.control}
          render={({ field }) => (
            <FormItem className="">
              <FormControl>
                <div className=" flex items-center space-x-4 py-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Drop Classifier
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <FormField
          name="optimizer"
          control={form.control}
          render={({ field }) => (
            <FormItem className="">
              <FormControl>
                <div className=" flex items-center space-x-4 rounded-md py-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Optimizer
                    </p>
                  </div>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex justify-end"
                  >
                    {optimizerOpts.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-1"
                      >
                        <FormLabel id="optimizer">{option.label}</FormLabel>
                        <RadioGroupItem value={option.value} />
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="lossFunction"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loss Function</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
              <FormItem>
                <FormLabel>Patch Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
        </div>
        <footer className="flex py-4">
          <Button className="w-full" type="submit">
            Submit
          </Button>
        </footer>
      </form>
    </Form>
  );
}
