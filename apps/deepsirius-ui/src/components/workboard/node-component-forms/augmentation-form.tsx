'use client';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { slurmPartitionOptions } from '~/lib/constants';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';

const slurmOptions = z.object({
  partition: z.enum(slurmPartitionOptions),
});

export const augmentationSchema = z.object({
  slurmOptions,
  augmentedDatasetName: z
    .string()
    .min(1, { message: 'Must have a name!' })
    .refine((s) => !s.includes(' '), 'No Spaces!'),
  vflip: z.boolean(),
  hflip: z.boolean(),
  rotateClock: z.boolean(),
  rotateCClock: z.boolean(),
  contrast: z.boolean(),
  dropout: z.boolean(),
  linearContrast: z.boolean(),
  gaussianBlur: z.boolean(),
  poissonNoise: z.boolean(),
  averageBlur: z.boolean(),
  elasticDeformation: z.boolean(),
});

export type FormType = z.input<typeof augmentationSchema>;
export type FormCallback = (data: FormType) => void;

export type FormProps = {
  onSubmitHandler: FormCallback;
  name?: FormType['augmentedDatasetName'];
};

function useAugmentationForm(name: FormProps['name'] = '') {
  const form = useForm<FormType>({
    resolver: zodResolver(augmentationSchema),
    defaultValues: {
      augmentedDatasetName: name,
      vflip: false,
      hflip: false,
      rotateClock: false,
      rotateCClock: false,
      contrast: false,
      dropout: false,
      linearContrast: false,
      gaussianBlur: false,
      poissonNoise: false,
      averageBlur: false,
      elasticDeformation: false,
    },
  });

  return form;
}

export function AugmentationForm({ onSubmitHandler, name }: FormProps) {
  const form = useAugmentationForm(name);
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
          control={form.control}
          name="augmentedDatasetName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dataset Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="dataset++" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-x-4 rounded-md border border-dashed px-4">
          <FormField
            name="vflip"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Vertical Flip
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
          <FormField
            name="hflip"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Horizontal Flip
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
          <FormField
            name="rotateCClock"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Rotate 90
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
          <FormField
            name="rotateClock"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Rotate -90
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
          <FormField
            name="contrast"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Contrast
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
          <FormField
            name="linearContrast"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Linear Contrast
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
          <FormField
            name="dropout"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Dropout
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

          <FormField
            name="gaussianBlur"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Gaussian Blur
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

          <FormField
            name="poissonNoise"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Poisson Noise
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
          <FormField
            name="averageBlur"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Average Blur
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
          <FormField
            name="elasticDeformation"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className=" flex items-center space-x-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Elastic Deformation
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
        </div>
        <footer className="flex flex-row gap-2">
          <FormField
            control={form.control}
            name="slurmOptions.partition"
            render={({ field }) => (
              <FormItem className="w-1/2">
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
          <Button className="mt-2 w-1/2" type="submit" disabled>
            Submit Job
          </Button>
        </footer>
      </form>
    </Form>
  );
}
