'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { HoverCardTrigger } from '@radix-ui/react-hover-card';
import {
  BookmarkIcon,
  BookmarkPlusIcon,
  FileIcon,
  FilePlusIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

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
  weightMap: z
    .string()
    .min(2, { message: 'Must be a valid image name!' })
    .regex(/^.*\.(tif|tiff|TIFF|hdf5|h5|raw|b)$/, {
      message: 'Must be a valid image extension!',
    })
    .optional(),
});

export const datasetSchema = z.object({
  slurmOptions,
  datasetName: z
    .string()
    .min(1, { message: 'Must have a name!' })
    .refine((s) => !s.includes(' '), 'No Spaces!'),
  data: dataSchema
    .array()
    .nonempty({ message: 'Must have at least one image!' }),
  patchSize: z.enum(powerSizes),
  sampleSize: z.coerce.number().min(1),
  strategy: z.enum(strategies),
  classes: z.coerce.number().min(2),
});

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

  const onSelectWeight = (path: string, index: number) => {
    form.setValue(`data.${index}.weightMap`, path);
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
        <div className="rounded-md border border-dashed p-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-row items-center justify-center gap-1 py-1"
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
                              className="w-fill gap-1 data-[img=true]:border-violet-600 data-[img=true]:dark:border-violet-400"
                              data-img={!!field.value}
                              variant={'outline'}
                              // size={'icon'}
                            >
                              {!!field.value ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <ImagePlusIcon className="h-4 w-4" />
                              )}
                              Image
                            </Button>
                          </HoverCardTrigger>
                        }
                        onSelect={(path) => onSelectImage(path, index)}
                      />
                      <HoverCardContent className="w-fit">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold">@image</h4>
                          <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
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
                              className="w-fill gap-1 data-[img=true]:border-violet-600 data-[img=true]:dark:border-violet-400"
                              data-img={!!field.value}
                              variant={'outline'}
                              // size={'icon'}
                            >
                              {!!field.value ? (
                                <BookmarkIcon className="h-4 w-4" />
                              ) : (
                                <BookmarkPlusIcon className="h-4 w-4" />
                              )}
                              Label
                            </Button>
                          </HoverCardTrigger>
                        }
                        onSelect={(path) => onSelectLabel(path, index)}
                      />
                      <HoverCardContent className="w-fit">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold">@label</h4>
                          <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
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
              {/* weight map */}
              <FormField
                control={form.control}
                key={`data.${index}.weightMap`}
                name={`data.${index}.weightMap`}
                render={({ field }) => (
                  <FormItem>
                    <HoverCard>
                      <NautilusDialog
                        trigger={
                          <HoverCardTrigger asChild>
                            <Button
                              className="w-fill gap-1 data-[img=true]:border-violet-600 data-[img=true]:dark:border-violet-400"
                              data-img={!!field.value}
                              variant={'outline'}
                              // size={'icon'}
                            >
                              {!!field.value ? (
                                <FileIcon className="h-4 w-4" />
                              ) : (
                                <FilePlusIcon className="h-4 w-4" />
                              )}
                              Weight
                            </Button>
                          </HoverCardTrigger>
                        }
                        onSelect={(path) => onSelectWeight(path, index)}
                      />
                      <HoverCardContent className="w-fit">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold">@weights</h4>
                          <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                            {field.value?.split('/').slice(-1)[0] || ''}
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
                className="h-5 w-5 rounded-full"
                variant={'destructive'}
                onClick={() => remove(index)}
                size={'icon'}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2">
            <Button
              id="add-data"
              variant={'outline'}
              className="w-full gap-1"
              type="button"
              onClick={() =>
                append({
                  image: '',
                  label: '',
                })
              }
            >
              <PlusIcon className="h-4 w-4" />
              {fields.length === 0 ? 'Add Data' : 'More!'}
            </Button>
            <Label
              htmlFor="add-data"
              className="sr-only text-xs text-muted-foreground"
            >
              More data
            </Label>
          </div>
        </div>
        <div className={'rounded-md border border-dashed p-2 text-xs'}>
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
        <footer className="flex flex-row items-center justify-between gap-2">
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
          <Button className="mt-2 w-1/2" type="submit">
            Create
          </Button>
        </footer>
      </form>
    </Form>
  );
}
