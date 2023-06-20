'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { FsTree } from '~/components/fs-treeview';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
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
import { env } from '~/env.mjs';
import { cn } from '~/lib/utils';

const powerSizes = ['16', '32', '64', '128', '256', '512', '1024'] as const;
const inferenceSchema = z.object({
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
  inputImages?: Array<{ name: string; path: string }>;
};

export function useInferenceForm(
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
    },
  });

  return form;
}

export function InferenceForm({
  onSubmitHandler,
  inputImages,
}: InferenceFormProps) {
  const form = useInferenceForm(inputImages);
  const { fields, append, remove } = useFieldArray({
    name: 'inputImages',
    control: form.control,
  });

  const onSubmit = () => {
    onSubmitHandler(form.getValues());
  };

  const onSelect = (path: string) => {
    const nameArr = path.split('/');
    const name = nameArr[nameArr.length - 1] ?? path;
    append({ name: name, path: path });
  };

  return (
    <Form {...form}>
      <form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
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
                      <Button onClick={() => remove(index)} size={'sm'}>
                        <X />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FsTreeDialog handleSelect={onSelect} />
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
        <footer className="flex py-4">
          <Button className="w-full" type="submit">
            Submit
          </Button>
        </footer>
      </form>
    </Form>
  );
}

function FsTreeDialog({
  handleSelect,
}: {
  handleSelect: (path: string) => void;
}) {
  const treePath = env.NEXT_PUBLIC_TREE_PATH;
  const [path, setPath] = useState(treePath);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    setPath(treePath);
  };
  const onSelect = (path: string) => {
    handleSelect(path);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="link" size="sm" className="mt-1">
          Add img
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>Select images</DialogTitle>
          <DialogDescription>
            {'Select the path to a valid image file to run inference on.'}
          </DialogDescription>
        </DialogHeader>
        <FsTree path={path} handlePathChange={setPath} width={800} />
        <DialogFooter>
          <Button className="w-full" onClick={() => onSelect(path)}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
