'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { FsTreeDialog } from '~/components/fs-treeview';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { slurmGPUOptions, slurmPartitionOptions } from '~/lib/constants';
import { cn } from '~/lib/utils';

const slurmOptions = z.object({
  partition: z.enum(slurmPartitionOptions),
  nGPU: z.enum(slurmGPUOptions),
});

const powerSizes = [
  '0',
  '16',
  '32',
  '64',
  '128',
  '256',
  '512',
  '1024',
] as const;
export const inferenceSchema = z.object({
  slurmOptions: slurmOptions,
  outputDir: z.string().nonempty({ message: 'Must have a valid output dir!' }),
  inputImages: z
    .array(
      z.object({
        name: z
          .string()
          .min(2, { message: 'Must be a valid image name!' })
          .regex(/^.*\.(tif|tiff|TIFF|hdf5|h5|raw|b)$/, {
            message: 'Must be a valid image extension!',
          }),
        path: z.string(),
      }),
    )
    .nonempty({ message: 'Must have at least one image!' }),
  saveProbMap: z.boolean(),
  normalize: z.boolean(),
  paddingSize: z.enum(powerSizes),
  patchSize: z.enum(powerSizes),
});

export type FormType = z.infer<typeof inferenceSchema>;
export type InferenceFormCallback = (data: FormType) => void;

type InferenceFormProps = {
  onSubmitHandler: InferenceFormCallback;
  outputDir?: string;
  inputImages?: z.infer<typeof inferenceSchema>['inputImages'][number][];
};

export function useInferenceForm(
  outputDir: string | undefined,
  inputImages: Array<{ name: string; path: string }> = [],
) {
  const form = useForm<FormType>({
    resolver: zodResolver(inferenceSchema),
    defaultValues: {
      inputImages: inputImages,
      saveProbMap: false,
      normalize: false,
      paddingSize: '32',
      patchSize: '32',
      slurmOptions: {
        nGPU: '1',
      },
    },
  });

  return form;
}

export function InferenceForm({
  onSubmitHandler,
  outputDir,
  inputImages,
}: InferenceFormProps) {
  const form = useInferenceForm(outputDir, inputImages);
  const { fields, append, remove } = useFieldArray({
    name: 'inputImages',
    control: form.control,
  });

  const onSubmit = () => {
    onSubmitHandler(form.getValues());
  };

  const onSelect = (path: string) => {
    const name = path.split('/').slice(-1)[0] ?? path;
    append({ name: name, path: path });
  };

  const onOutputDirSelect = (path: string) => {
    form.setValue('outputDir', path);
  };

  return (
    <Form {...form}>
      <form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
        <div>
          <FormField
            control={form.control}
            name="outputDir"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={'sr-only'}>Output Directory</FormLabel>
                <FormDescription className={'sr-only'}>
                  Select the output directory.
                </FormDescription>
                <FormControl>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    {!!field.value && <Input {...field} disabled />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FsTreeDialog
            handleSelect={onOutputDirSelect}
            message={{
              title: 'Select output directory',
              description:
                'Select the path to a valid output directory or paste it down below.',
            }}
          >
            <Button type="button" variant="link" size="sm" className="mt-1">
              Select output dir
            </Button>
          </FsTreeDialog>
        </div>
        <div>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`inputImages.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && 'sr-only')}>
                    Images
                  </FormLabel>
                  <FormDescription className={cn(index !== 0 && 'sr-only')}>
                    Add images to run inference on.
                  </FormDescription>
                  <FormControl>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                      <Input {...field} disabled />
                      <Button onClick={() => remove(index)} size={'icon'}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FsTreeDialog
            handleSelect={onSelect}
            message={{
              title: 'Select images',
              description:
                'Select the path to a valid image file or paste it down below.',
            }}
          >
            <Button type="button" variant="link" size="sm" className="mt-1">
              Add img
            </Button>
          </FsTreeDialog>
        </div>
        <FormField
          name="normalize"
          control={form.control}
          render={({ field }) => (
            <FormItem className="">
              <FormControl>
                <div className=" flex items-center space-x-4 py-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Normalize Images
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
          name="saveProbMap"
          control={form.control}
          render={({ field }) => (
            <FormItem className="">
              <FormControl>
                <div className=" flex items-center space-x-4 py-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Save as Probabilty Map
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
            control={form.control}
            name="paddingSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Padding Size</FormLabel>
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
