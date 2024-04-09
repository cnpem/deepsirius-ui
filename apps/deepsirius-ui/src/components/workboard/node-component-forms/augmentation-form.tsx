'use client';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { slurmGPUOptions, slurmPartitionOptions } from '~/lib/constants';
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
import { ScrollArea } from '~/components/ui/scroll-area';

const slurmOptions = z.object({
  partition: z.enum(slurmPartitionOptions),
  nGPU: z.enum(slurmGPUOptions),
});

const floatInterval = z
  .tuple([z.number(), z.number()])
  .refine(([min, max]) => min < max, 'Min must be less than max')
  .refine(([min, max]) => min >= 0 && max >= 0, 'Must be greater than 0')
  .optional();

const intInterval = z
  .tuple([z.number(), z.number()])
  .refine(([min, max]) => min < max, 'Min must be less than max')
  .refine(([min, max]) => min >= 0 && max >= 0, 'Must be greater than 0')
  .refine(
    ([min, max]) => Number.isInteger(min) && Number.isInteger(max),
    'Must be an integer',
  )
  .optional();

const augmentationArgs = z.object({
  rot90: z.boolean(),
  rot270: z.boolean(),
  flipHorizontal: z.boolean(),
  flipVertical: z.boolean(),
  elastic: z.object({
    select: z.boolean(),
    alpha: floatInterval,
    sigma: floatInterval,
  }),
  gaussianBlur: z.object({
    select: z.boolean(),
    sigma: floatInterval,
  }),
  contrast: z.object({
    select: z.boolean(),
    factor: floatInterval,
  }),
  averageBlur: z.object({
    select: z.boolean(),
    kernelSize: intInterval,
  }),
  linearContrast: z.object({
    select: z.boolean(),
    factor: floatInterval,
  }),
  dropout: z.object({
    select: z.boolean(),
    factor: floatInterval,
  }),
  poissonNoise: z.object({
    select: z.boolean(),
    scale: floatInterval,
  }),
});

export const augmentationSchema = z.object({
  slurmOptions,
  augmentedDatasetName: z
    .string()
    .min(1, { message: 'Must have a name!' })
    .refine((s) => !s.includes(' '), 'No Spaces!'),
  augmentationArgs,
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
      augmentationArgs: {
        rot90: false,
        rot270: false,
        flipHorizontal: false,
        flipVertical: false,
        elastic: {
          select: false,
          alpha: [25, 50],
          sigma: [4, 6],
        },
        gaussianBlur: {
          select: false,
          sigma: [0.25, 1.0],
        },
        contrast: {
          select: false,
          factor: [0.1, 1.9],
        },
        averageBlur: {
          select: false,
          kernelSize: [1, 2],
        },
        linearContrast: {
          select: false,
          factor: [0.4, 1.6],
        },
        dropout: {
          select: false,
          factor: [0.0, 0.2],
        },
        poissonNoise: {
          select: false,
          scale: [0.0, 0.1],
        },
      },
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
        <ScrollArea className="h-96 rounded-md border border-dashed p-4">
          <div className="my-2 flex flex-row items-center justify-between">
            <FormLabel>Rotation</FormLabel>
            <FormField
              name="augmentationArgs.rot90"
              control={form.control}
              render={({ field }) => (
                <FormItem className="">
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">90°</p>
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
              name="augmentationArgs.rot270"
              control={form.control}
              render={({ field }) => (
                <FormItem className="">
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">270°</p>
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
          <div className="my-2 flex flex-row items-center justify-between">
            <FormLabel>Flip</FormLabel>
            <FormField
              name="augmentationArgs.flipHorizontal"
              control={form.control}
              render={({ field }) => (
                <FormItem className="">
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 space-y-1">
                        <FormLabel className="text-sm font-medium leading-none">
                          Horizontal
                        </FormLabel>
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
              name="augmentationArgs.flipVertical"
              control={form.control}
              render={({ field }) => (
                <FormItem className="">
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 space-y-1">
                        <FormLabel className="text-sm font-medium leading-none">
                          Vertical
                        </FormLabel>
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
          <FormField
            name="augmentationArgs.elastic"
            control={form.control}
            render={() => (
              <FormItem className="">
                <FormControl>
                  <div className="my-2 flex flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <FormLabel>Elastic Deformation</FormLabel>
                      <FormField
                        name="augmentationArgs.elastic.select"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('augmentationArgs.elastic.select') && (
                      <div className="flex flex-col">
                        <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                          <FormLabel>Alpha</FormLabel>
                          <FormField
                            name="augmentationArgs.elastic.alpha.0"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormLabel className="text-muted-foreground">
                                  from
                                </FormLabel>
                                <Input
                                  {...field}
                                  type="number"
                                  className="mt-0"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name="augmentationArgs.elastic.alpha.1"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormLabel className="text-muted-foreground">
                                  to
                                </FormLabel>
                                <Input
                                  {...field}
                                  type="number"
                                  className="my-0"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                          <FormLabel>Sigma</FormLabel>
                          <FormField
                            name="augmentationArgs.elastic.sigma.0"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormLabel className="text-muted-foreground">
                                  from
                                </FormLabel>
                                <Input
                                  {...field}
                                  type="number"
                                  className="mt-0"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name="augmentationArgs.elastic.sigma.1"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormLabel className="text-muted-foreground">
                                  to
                                </FormLabel>
                                <Input
                                  {...field}
                                  type="number"
                                  className="my-0"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="augmentationArgs.gaussianBlur"
            control={form.control}
            render={() => (
              <FormItem className="">
                <FormControl>
                  <div className="my-2 flex flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <FormLabel>Gaussian Blur</FormLabel>
                      <FormField
                        name="augmentationArgs.gaussianBlur.select"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('augmentationArgs.gaussianBlur.select') && (
                      <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                        <FormLabel>Sigma</FormLabel>
                        <FormField
                          name="augmentationArgs.gaussianBlur.sigma.0"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                from
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="mt-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="augmentationArgs.gaussianBlur.sigma.1"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                to
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="my-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="augmentationArgs.contrast"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className="my-2 flex flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <FormLabel>Contrast</FormLabel>
                      <FormField
                        name="augmentationArgs.contrast.select"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('augmentationArgs.contrast.select') && (
                      <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                        <FormLabel>Factor</FormLabel>
                        <FormField
                          name="augmentationArgs.contrast.factor.0"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                from
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="mt-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="augmentationArgs.contrast.factor.1"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                to
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="my-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="augmentationArgs.averageBlur"
            control={form.control}
            render={() => (
              <FormItem className="">
                <FormControl>
                  <div className="my-2 flex flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <FormLabel>Average Blur</FormLabel>
                      <FormField
                        name="augmentationArgs.averageBlur.select"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('augmentationArgs.averageBlur.select') && (
                      <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                        <FormLabel>Kernel Size</FormLabel>
                        <FormField
                          name="augmentationArgs.averageBlur.kernelSize.0"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                from
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="mt-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="augmentationArgs.averageBlur.kernelSize.1"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                to
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="my-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="augmentationArgs.linearContrast"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className="my-2 flex flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <FormLabel>Linear Contrast</FormLabel>
                      <FormField
                        name="augmentationArgs.linearContrast.select"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('augmentationArgs.linearContrast.select') && (
                      <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                        <FormLabel>Factor</FormLabel>
                        <FormField
                          name="augmentationArgs.linearContrast.factor.0"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                from
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="mt-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="augmentationArgs.linearContrast.factor.1"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                to
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="my-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="augmentationArgs.dropout"
            control={form.control}
            render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className="my-2 flex flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <FormLabel>Dropout</FormLabel>
                      <FormField
                        name="augmentationArgs.dropout.select"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('augmentationArgs.dropout.select') && (
                      <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                        <FormLabel>Factor</FormLabel>
                        <FormField
                          name="augmentationArgs.dropout.factor.0"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                from
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="mt-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="augmentationArgs.dropout.factor.1"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                to
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="my-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="augmentationArgs.poissonNoise"
            control={form.control}
            render={() => (
              <FormItem className="">
                <FormControl>
                  <div className="my-2 flex flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <FormLabel>Poisson Noise</FormLabel>
                      <FormField
                        name="augmentationArgs.poissonNoise.select"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('augmentationArgs.poissonNoise.select') && (
                      <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                        <FormLabel>Scale</FormLabel>
                        <FormField
                          name="augmentationArgs.poissonNoise.scale.0"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                from
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="mt-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="augmentationArgs.poissonNoise.scale.1"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormLabel className="text-muted-foreground">
                                to
                              </FormLabel>
                              <Input
                                {...field}
                                type="number"
                                className="my-0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </ScrollArea>
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
          <Button className="mt-2 w-1/2" type="submit">
            Submit Job
          </Button>
        </footer>
      </form>
    </Form>
  );
}
