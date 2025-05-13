"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FolderIcon, PlusIcon, X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { NautilusDialog } from "~/components/nautilus";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { slurmGPUOptions } from "~/lib/constants";
import { api } from "~/utils/api";

const slurmOptions = z.object({
  partition: z.string(),
  nGPU: z.enum(slurmGPUOptions),
});

const paddingSizes = ["0", "2", "4", "8"] as const;
const patchSizes = ["0", "2", "4", "8", "16"] as const;
export const inferenceSchema = z.object({
  slurmOptions: slurmOptions,
  outputDir: z
    .string()
    .endsWith("/", { message: "Must be a valid directory!" }),
  inputImages: z
    .array(
      z.object({
        name: z
          .string()
          .min(2, { message: "Must be a valid image name!" })
          .regex(/^.*\.(tif|tiff|TIFF|hdf5|h5|raw|b)$/, {
            message: "Must be a valid image extension!",
          }),
        path: z.string(),
      }),
    )
    .nonempty({ message: "Must have at least one image!" }),
  saveProbMap: z.boolean(),
  normalize: z.boolean(),
  paddingSize: z.enum(paddingSizes),
  patchSize: z.enum(patchSizes),
});

export type FormType = z.infer<typeof inferenceSchema>;
export type InferenceFormCallback = (data: FormType) => void;

type InferenceFormProps = {
  onSubmitHandler: InferenceFormCallback;
  outputDir?: string;
  inputImages?: z.infer<typeof inferenceSchema>["inputImages"][number][];
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
      paddingSize: "0",
      patchSize: "0",
      slurmOptions: {
        nGPU: "1",
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
  const userPartitions = api.job.userPartitions.useQuery();
  const form = useInferenceForm(outputDir, inputImages);
  const { fields, append, remove } = useFieldArray({
    name: "inputImages",
    control: form.control,
  });

  const onSubmit = () => {
    onSubmitHandler(form.getValues());
  };

  const onSelect = (path: string) => {
    const name = path.split("/").slice(-1)[0] ?? path;
    append({ name: name, path: path });
  };

  const onOutputDirSelect = (path: string) => {
    form.setValue("outputDir", path);
  };

  const toUnixPath = (path: string) =>
    path.replace(/[\\/]+/g, "/").replace(/^([a-zA-Z]+:|\.\/)/, "");

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
      >
        <FormField
          control={form.control}
          name="outputDir"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className={"sr-only"}>Output Directory</FormLabel>
              <FormDescription className={"sr-only"}>
                Select the output directory.
              </FormDescription>
              <FormControl>
                <div className="flex flex-row items-center gap-1">
                  <NautilusDialog
                    onSelect={onOutputDirSelect}
                    trigger={
                      <Button size="icon" variant="outline">
                        <FolderIcon className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Input
                    {...field}
                    className="text-ellipsis"
                    placeholder="Output directory"
                    value={toUnixPath(field.value ?? "")}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`inputImages.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center">
                      <Input {...field} className="text-ellipsis" disabled />
                      <Button
                        onClick={() => remove(index)}
                        size={"icon"}
                        variant="ghost"
                      >
                        <X className="h-[14px] w-[14px]" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <NautilusDialog
            onSelect={onSelect}
            trigger={
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-1"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  Add images
                </span>
              </div>
            }
          />
        </div>
        <FormField
          name="normalize"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-center justify-between">
                <FormLabel className="text-sm font-medium leading-none">
                  Normalize Images
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
        <FormField
          name="saveProbMap"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-center justify-between">
                <FormLabel className="text-sm font-medium leading-none">
                  Save as Probabilty Map
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <FormField
            control={form.control}
            name="paddingSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volume Padding</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a value for the volume padding size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paddingSizes.map((item) => (
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
                <FormLabel>Patch Border</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select value for the patch border size" />
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
        <footer className="flex flex-row items-center justify-end gap-1.5">
          <FormField
            control={form.control}
            name="slurmOptions.partition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Slurm Partition</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  disabled={userPartitions.isError || userPartitions.isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Slurm Partition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {userPartitions.data?.partitions.map((option) => (
                      <SelectItem
                        key={option.partition}
                        value={option.partition}
                        className="!text-justify"
                      >
                        <span className="mr-2 font-bold">
                          {option.partition}
                        </span>
                        <span className="text-sm text-gray-500">
                          <span className="text-sm text-green-500">
                            {option.cpus.free}
                          </span>
                          /{option.cpus.max} cpus,{" "}
                          <span className="text-sm text-green-500">
                            {option.gpus.free}
                          </span>
                          /{option.gpus.max} gpus
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="hidden">
                  Please select a slurm partition assigned for your user for
                  submitting this job.
                </FormDescription>
                <FormMessage className="max-w-60 text-wrap">
                  {userPartitions.isError &&
                    `Error loading partitions: ${userPartitions.error.message}`}
                  {userPartitions.isLoading && `Searching user partitions...`}
                </FormMessage>
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
                            GPUs:{" "}
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
