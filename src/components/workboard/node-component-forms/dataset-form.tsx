'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { HoverCardTrigger } from '@radix-ui/react-hover-card';
import { Image, Plus, Settings2, Tag, X } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { FsTreeDialog } from '~/components/fs-treeview';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog';
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
import { Switch } from '~/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
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
  datasetName: z.string().nonempty({ message: 'Must have a dataset name!' }),
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
      patchSize: '256',
      sampleSize: 100,
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
      <form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
        {!name && (
          <FormField
            control={form.control}
            name="datasetName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dataset Name</FormLabel>
                <Input {...field} placeholder="my_dataset" />
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <SettingsDialog form={form} />
        <div className={'relative border p-2 rounded-md border-dashed my-6'}>
          <div className="relative">
            <Label className="absolute rounded-full p-1 text-sm scale-50 -translate-y-6 border-2 inset-x-0 top-0 text-center bg-muted ">
              Data
            </Label>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 py-2 grid-cols-3">
              <FormField
                control={form.control}
                name={`data.${index}.image`}
                key={`data.${index}.image`}
                render={({ field }) => (
                  <FormItem>
                    <HoverCard>
                      <FsTreeDialog
                        message={{
                          title: 'Select image',
                          description: 'Select the path to a valid image file.',
                        }}
                        handleSelect={(path) => onSelectImage(path, index)}
                      >
                        <HoverCardTrigger asChild>
                          {field.value.split('/').slice(-1)[0] === 'image' ? (
                            <Button size={'sm'}>
                              <Image className="mr-2 h-4 w-4" /> {`# ${index}`}
                            </Button>
                          ) : (
                            <Button className="relative" size={'sm'}>
                              <div className="absolute top-0 right-0 translate-x-1 -translate-y-1">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                  <span className=" relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                                </span>
                              </div>
                              <Image className="mr-2 h-4 w-4" /> {`# ${index}`}
                            </Button>
                          )}
                        </HoverCardTrigger>
                      </FsTreeDialog>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">@image</h4>
                            <p className="text-sm">
                              {field.value.split('/').slice(-1)[0]}
                            </p>
                            <div className="flex items-center pt-2">
                              <span className="text-xs text-muted-foreground">
                                {field.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <FormMessage />
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
                      <FsTreeDialog
                        handleSelect={(path) => onSelectLabel(path, index)}
                        message={{
                          title: 'Select label',
                          description: 'Select the path to a valid label file.',
                        }}
                      >
                        <HoverCardTrigger asChild>
                          {field.value.split('/').slice(-1)[0] === 'label' ? (
                            <Button size={'sm'}>
                              <Tag className="mr-2 h-4 w-4" /> {`# ${index}`}
                            </Button>
                          ) : (
                            <Button className="relative" size={'sm'}>
                              <div className="absolute top-0 right-0 translate-x-1 -translate-y-1">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                  <span className=" relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                                </span>
                              </div>
                              <Tag className="mr-2 h-4 w-4" /> {`# ${index}`}
                            </Button>
                          )}
                        </HoverCardTrigger>
                      </FsTreeDialog>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">@label</h4>
                            <p className="text-sm">
                              {field.value.split('/').slice(-1)[0]}
                            </p>
                            <div className="flex items-center pt-2">
                              <span className="text-xs text-muted-foreground">
                                {field.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="absolute mr-2 end-0"
                variant={'destructive'}
                onClick={() => remove(index)}
                size={'icon'}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            className="w-full"
            variant={'outline'}
            type="button"
            onClick={() =>
              append({
                image: '/path/to/my/image',
                label: '/path/to/my/label',
              })
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <footer className="grid grid-cols-2 gap-4">
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
          <Button className="my-2 mx-0" type="submit">
            Create
          </Button>
        </footer>
      </form>
    </Form>
  );
}

function SettingsDialog({ form }: { form: ReturnType<typeof useDatasetForm> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={'ghost'}
          size={'icon'}
          className="absolute m-2 top-0 right-0"
        >
          <Settings2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[825px]">
        <Tabs defaultValue="sampling">
          <TabsList>
            <TabsTrigger value="sampling">Sampling</TabsTrigger>
            <TabsTrigger value="augmentation">Augmentation</TabsTrigger>
          </TabsList>
          <TabsContent value="augmentation">
            <div className="grid grid-cols-3 gap-4 border p-2 rounded-md border-dashed">
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
                name="augmentation.rotateClock"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="">
                    <FormControl>
                      <div className=" flex items-center space-x-4 py-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Rotate +90
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
          </TabsContent>
          <TabsContent value="sampling">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classes</FormLabel>
                    <Input {...field} placeholder="2" type="number" min={2} />
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
                    <Input {...field} placeholder="100" type="number" min={1} />
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
