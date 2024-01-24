'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { HoverCardTrigger } from '@radix-ui/react-hover-card';
import {
  BookmarkIcon,
  BookmarkPlusIcon,
  ImageIcon,
  ImagePlusIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { NautilusDialog } from '~/components/nautilus';
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
import { HoverCard, HoverCardContent } from '~/components/ui/hover-card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { slurmPartitionOptions } from '~/lib/constants';

const slurmOptions = z.object({
  partition: z.enum(slurmPartitionOptions),
});
const powerSizes = ['16', '32', '64', '128', '256', '512', '1024'] as const;
const strategies = ['uniform'] as const;
const dataSchema = z.object({
  image: z
    .string()
    .min(2, { message: 'Must be a valid image name!' })
    .regex(/^.*\.(tif|tiff|TIFF|hdf5|h5|raw|b)$/, {
      message: 'Must be a valid image extension!',
    }),
  label: z
    .string()
    .min(2, { message: 'Must be a valid image name!' })
    .regex(/^.*\.(tif|tiff|TIFF|hdf5|h5|raw|b)$/, {
      message: 'Must be a valid image extension!',
    }),
});

const augmentationSchema = z.object({
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

export const datasetSchema = z.object({
  slurmOptions,
  datasetName: z
    .string()
    .nonempty({ message: 'Must have a dataset name!' })
    .refine((s) => !s.includes(' '), 'No Spaces!'),
  data: dataSchema
    .array()
    .nonempty({ message: 'Must have at least one image!' }),
  augmentation: augmentationSchema,
  patchSize: z.enum(powerSizes),
  sampleSize: z.coerce.number().min(1),
  strategy: z.enum(strategies),
  classes: z.coerce.number().min(2),
});

// this should be named DatasetFormType
export type FormType = z.input<typeof datasetSchema>;
export type FormCallback = (data: FormType) => void;

export type FormProps = {
  onSubmitHandler: FormCallback;
  name?: FormType['datasetName'];
  data?: z.infer<typeof dataSchema>[];
};

function useDatasetForm(
  name: FormProps['name'] = '',
  data: FormProps['data'] = [],
) {
  const form = useForm<FormType>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      datasetName: name,
      data: data,
      augmentation: {
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
      patchSize: '64',
      sampleSize: 2,
      strategy: 'uniform',
      classes: 2,
    },
  });

  return form;
}

export function DatasetForm({ onSubmitHandler, name, data }: FormProps) {
  const form = useDatasetForm(name, data);
  const { fields, append, remove } = useFieldArray({
    name: 'data',
    control: form.control,
  });

  const onSubmit = () => {
    onSubmitHandler(form.getValues());
  };

  const onSelectImage = (path: string, index: number) => {
    form.register(`data.${index}.image`);
    form.setValue(`data.${index}.image`, path);
  };

  const onSelectLabel = (path: string, index: number) => {
    form.setValue(`data.${index}.label`, path);
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
      >
        <FormField
          control={form.control}
          name="datasetName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dataset Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="my_dataset" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="border p-2 rounded-md border-dashed">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-row gap-1 py-1 items-center justify-center"
            >
              <FormField
                control={form.control}
                name={`data.${index}.image`}
                key={`data.${index}.image`}
                render={({ field }) => (
                  <FormItem>
                    <HoverCard>
                      <NautilusDialog
                        trigger={
                          <HoverCardTrigger asChild>
                            <Button
                              className="data-[img=true]:border-violet-600 data-[img=true]:dark:border-violet-400"
                              data-img={!!field.value}
                              variant={'outline'}
                              size={'icon'}
                            >
                              {!!field.value ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <ImagePlusIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </HoverCardTrigger>
                        }
                        onSelect={(path) => onSelectImage(path, index)}
                      />
                      <HoverCardContent className="w-fit">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold">@image</h4>
                          <p className="font-medium text-xs text-violet-600 dark:text-violet-400">
                            {field.value.split('/').slice(-1)[0]}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {field.value}
                          </span>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                key={`data.${index}.label`}
                name={`data.${index}.label`}
                render={({ field }) => (
                  <FormItem>
                    <HoverCard>
                      <NautilusDialog
                        trigger={
                          <HoverCardTrigger asChild>
                            <Button
                              className="data-[img=true]:border-violet-600 data-[img=true]:dark:border-violet-400"
                              data-img={!!field.value}
                              variant={'outline'}
                              size={'icon'}
                            >
                              {!!field.value ? (
                                <BookmarkIcon className="h-4 w-4" />
                              ) : (
                                <BookmarkPlusIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </HoverCardTrigger>
                        }
                        onSelect={(path) => onSelectLabel(path, index)}
                      />
                      <HoverCardContent className="w-fit">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold">@label</h4>
                          <p className="font-medium text-xs text-violet-600 dark:text-violet-400">
                            {field.value.split('/').slice(-1)[0]}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {field.value}
                          </span>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                className="rounded-full h-6 w-6"
                variant={'destructive'}
                onClick={() => remove(index)}
                size={'icon'}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Button
              id="add-data"
              variant={'outline'}
              size={'icon'}
              type="button"
              onClick={() =>
                append({
                  image: '',
                  label: '',
                })
              }
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
            <Label htmlFor="add-data" className="text-xs text-muted-foreground">
              Add data
            </Label>
          </div>
        </div>
        <div className={'border p-2 rounded-md border-dashed text-xs'}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="classes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2" type="number" min={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sampleSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Size</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="100" type="number" min={1} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strategy</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {strategies.map((item) => (
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
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {powerSizes.map((item) => (
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
        </div>
        <footer className="flex flex-row justify-between items-center">
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
          <Button className="mt-2" type="submit">
            Create
          </Button>
        </footer>
      </form>
    </Form>
  );
}

function AugmentationPopover({
  form,
}: {
  form: ReturnType<typeof useDatasetForm>;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={'ghost'}>Augmentation</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            name="augmentation.vflip"
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
            name="augmentation.hflip"
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
            name="augmentation.rotateCClock"
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
            name="augmentation.rotateClock"
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
            name="augmentation.contrast"
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
            name="augmentation.linearContrast"
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
            name="augmentation.dropout"
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
            name="augmentation.gaussianBlur"
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
            name="augmentation.poissonNoise"
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
            name="augmentation.averageBlur"
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
            name="augmentation.elasticDeformation"
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
      </PopoverContent>
    </Popover>
  );
}
