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
const batchSizes = ['2', '4', '8', '16', '32'] as const;
export const networkSchema = z.object({
  slurmOptions,
  networkUserLabel: z
    .string()
    .min(2, {
      message: 'Network label name must be at least 2 characters.',
    })
    .regex(/^[a-zA-Z0-9_]*$/, {
      message:
        'Network label name must contain only letters, numbers underscores and no spaces.',
    }),
  dropClassifier: z.boolean(),
  jobGPUs: z.enum(['1', '2', '4']),
  iterations: z.coerce.number().gte(1, { message: 'Must be >= 1' }),
  learningRate: z.coerce.number().gt(0, { message: 'Must be greater than 0' }),
  optimizer: z.enum(['adam', 'adagrad', 'gradientdescent']),
  lossFunction: z.enum(['CrossEntropy', 'dice', 'xent_dice']),
  networkTypeName: z.enum(['unet2d', 'unet3d', 'vnet']),
  patchSize: z.enum(patchSizes),
  batchSize: z.enum(batchSizes),
});

export type FormType = z.infer<typeof networkSchema>;
type FormCallback = (data: FormType) => void;

type NetworkFormProps = {
  onSubmitHandler: FormCallback;
  networkUserLabel?: string;
  networkTypeName?: z.infer<typeof networkSchema>['networkTypeName'];
  jobType: 'create' | 'retry';
};

export function useNetworkForm({
  networkUserLabel = '',
  networkTypeName = 'vnet',
}: {
  networkUserLabel?: string;
  networkTypeName?: z.infer<typeof networkSchema>['networkTypeName'];
}) {
  const form = useForm<FormType>({
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
      batchSize: '32',
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
  { label: 'Adagrad', value: 'adagrad' },
  { label: 'Gradient Descent', value: 'gradientdescent' },
];

const lossOpts: FormFieldItems = [
  { label: 'Cross Entropy', value: 'CrossEntropy' },
  { label: 'Dice', value: 'dice' },
  { label: 'Cross Entropy + Dice', value: 'xent_dice' },
];

export function NetworkForm({
  networkUserLabel,
  networkTypeName,
  onSubmitHandler,
}: NetworkFormProps) {
  const form = useNetworkForm({ networkUserLabel, networkTypeName });

  const onSubmit = () => {
    onSubmitHandler(form.getValues());
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
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
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>Network Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex justify-center gap-1"
                >
                  {networkOpts.map((option) => (
                    <div key={option.value} className="flex">
                      <RadioGroupItem
                        className="peer sr-only"
                        id={option.label}
                        value={option.value}
                      />
                      <FormLabel
                        htmlFor={option.label}
                        className="cursor-pointer rounded-sm border p-2 peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-400 dark:peer-data-[state=checked]:bg-violet-800 peer-data-[state=checked]:[&>p]:text-violet-700"
                      >
                        {option.label}
                      </FormLabel>
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
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>Drop Classifier</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex flex-row items-center gap-1">
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
        <div className="flex justify-center gap-1">
          <FormField
            control={form.control}
            name="patchSize"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Patch Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="px-4">
                      <SelectValue />
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
          <FormField
            control={form.control}
            name="batchSize"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Batch Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="px-4">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {batchSizes.map((item) => (
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

        <div className="flex flex-row items-center gap-1">
          <FormField
            name="optimizer"
            control={form.control}
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Optimizer</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
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
          <FormField
            name="lossFunction"
            control={form.control}
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Loss Function</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
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
        </div>
        <footer className="flex flex-row items-center justify-end gap-1.5">
          <FormField
            control={form.control}
            name="slurmOptions.partition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Slurm Partition</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          <span className="text-xs">Slurm Partition</span>
                        }
                      />
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
                    <SelectTrigger className="px-4">
                      <SelectValue placeholder="Slurm GPUs" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {slurmGPUOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        <p className="flex flex-row items-center gap-1">
                          <span className="mr-2 text-xs text-muted-foreground">
                            GPUs:{' '}
                          </span>
                          <span>{item.toString()}</span>
                        </p>
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
          <Button className="mt-2 grow px-6" size="sm" type="submit">
            Submit
          </Button>
        </footer>
      </form>
    </Form>
  );
}
