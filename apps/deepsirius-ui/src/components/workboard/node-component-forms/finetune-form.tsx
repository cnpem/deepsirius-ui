"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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

const patchSizes = ["16", "32", "64", "128", "256", "512", "1024"] as const;
const batchSizes = ["2", "4", "8", "16", "32"] as const;
export const finetuneSchema = z.object({
  slurmOptions,
  dropClassifier: z.boolean(),
  iterations: z.coerce.number().gte(1, { message: "Must be >= 1" }),
  learningRate: z.coerce.number().gt(0, { message: "Must be greater than 0" }),
  optimizer: z.enum(["adam", "adagrad", "gradientdescent"]),
  lossFunction: z.enum(["CrossEntropy", "dice", "xent_dice"]),
  patchSize: z.enum(patchSizes),
  batchSize: z.enum(batchSizes),
});

export type FormType = z.infer<typeof finetuneSchema>;
type FormCallback = (data: FormType) => void;

type FormProps = {
  onSubmitHandler: FormCallback;
};

export function useFinetuneForm() {
  const form = useForm<FormType>({
    resolver: zodResolver(finetuneSchema),
    defaultValues: {
      dropClassifier: false,
      iterations: 1,
      learningRate: 0.00001,
      optimizer: "adam",
      patchSize: "32",
      batchSize: "32",
      lossFunction: "CrossEntropy",
      slurmOptions: {
        nGPU: "1",
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

const optimizerOpts: FormFieldItems = [
  { label: "Adam", value: "adam" },
  { label: "Adagrad", value: "adagrad" },
  { label: "Gradient Descent", value: "gradientdescent" },
];

const lossOpts: FormFieldItems = [
  { label: "Cross Entropy", value: "CrossEntropy" },
  { label: "Dice", value: "dice" },
  { label: "Cross Entropy + Dice", value: "xent_dice" },
];

export function FinetuneForm({ onSubmitHandler }: FormProps) {
  const userPartitions = api.job.userPartitions.useQuery();
  const form = useFinetuneForm();

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
        <footer className="flex flex-row items-center gap-1">
          <FormField
            control={form.control}
            name="slurmOptions.partition"
            render={({ field }) => (
              <FormItem className="w-1/3">
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
              <FormItem className="w-1/3">
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
          <Button className="mt-2 w-1/3 px-6" type="submit">
            Submit
          </Button>
        </footer>
      </form>
    </Form>
  );
}
