import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { type NodeProps, useUpdateNodeInternals } from 'reactflow';
import { toast } from 'sonner';
import { ScrollArea } from '~/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import {
  DatasetForm,
  type FormType,
} from '~/components/workboard/node-component-forms/dataset-form';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';
import NodeCard from './node-components/node-card';
import {
  BusySheet,
  ErrorSheet,
  SuccessSheet,
} from './node-components/node-sheet';

export function DatasetNode(nodeProps: NodeProps<NodeData>) {
  const formEditState =
    nodeProps.selected &&
    ['active', 'error', 'success'].includes(nodeProps.data.status);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(formEditState);
  }, [formEditState]);

  const [formData, setFormData] = useState<FormType | undefined>(
    nodeProps.data.form as FormType,
  );

  const updateNodeInternals = useUpdateNodeInternals();
  const { onUpdateNode } = useStoreActions();

  const { data: jobData } = api.job.checkStatus.useQuery(
    { jobId: nodeProps.data.jobId as string },
    {
      enabled: nodeProps.data.status === 'busy' && !!nodeProps.data.jobId,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    },
  );

  useEffect(() => {
    if (nodeProps.data.status !== 'busy') return;
    if (!jobData) return;
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    if (jobData.jobStatus === 'COMPLETED') {
      toast.success('Job completed');
      onUpdateNode({
        id: nodeProps.id,
        data: {
          ...nodeProps.data,
          status: 'success',
          jobId: nodeProps.data.jobId,
          jobStatus: jobData.jobStatus,
          message: `Job ${
            nodeProps.data.jobId ?? 'aa'
          } finished successfully in ${date}`,
          updatedAt: date,
        },
      });
      updateNodeInternals(nodeProps.id);
    } else if (jobData.jobStatus === 'FAILED') {
      toast.error('Job failed');
      onUpdateNode({
        id: nodeProps.id,
        data: {
          ...nodeProps.data,
          status: 'error',
          jobId: nodeProps.data.jobId,
          jobStatus: jobData.jobStatus,
          message: `Job ${nodeProps.data.jobId ?? 'aa'} failed in ${date}`,
          updatedAt: date,
        },
      });
      updateNodeInternals(nodeProps.id);
    } else {
      onUpdateNode({
        id: nodeProps.id,
        data: {
          ...nodeProps.data,
          status: 'busy',
          jobId: nodeProps.data.jobId,
          jobStatus: jobData.jobStatus,
          message: `Job ${nodeProps.data.jobId ?? 'aa'} is ${
            jobData.jobStatus?.toLocaleLowerCase() ?? 'no status'
          }, last checked at ${date}`,
          updatedAt: date,
        },
      });
      updateNodeInternals(nodeProps.id);
    }
  }, [
    jobData,
    nodeProps.data,
    nodeProps.id,
    updateNodeInternals,
    onUpdateNode,
  ]);

  const { mutateAsync: cancelJob } = api.job.cancel.useMutation();
  const { mutateAsync: submitJob } =
    api.deepsiriusJob.submitDataset.useMutation();

  const handleSubmitJob = (formData: FormType) => {
    submitJob({
      formData,
      workspacePath: nodeProps.data.workspacePath,
    })
      .then(({ jobId }) => {
        console.log('handleSubmitJob then?', 'jobId', jobId);
        if (!jobId) {
          console.error('handleSubmitJob then?', 'no jobId');
          toast.error('Error submitting job');
          return;
        }
        setFormData(formData);
        onUpdateNode({
          id: nodeProps.id,
          data: {
            ...nodeProps.data,
            status: 'busy',
            remotePath: `${nodeProps.data.workspacePath}/datasets/${formData.datasetName}.h5`,
            jobId: jobId,
            message: `Job ${jobId} submitted in ${dayjs().format(
              'YYYY-MM-DD HH:mm:ss',
            )}`,
            form: formData,
          },
        });
        updateNodeInternals(nodeProps.id);
        setOpen(!open);
      })
      .catch(() => {
        toast.error('Error submitting job');
        setFormData(formData);
        onUpdateNode({
          id: nodeProps.id,
          data: {
            ...nodeProps.data,
            status: 'error',
            remotePath: ``,
            jobId: '',
            message: `Error submitting job in ${dayjs().format(
              'YYYY-MM-DD HH:mm:ss',
            )}`,
            form: formData,
          },
        });
        updateNodeInternals(nodeProps.id);
      });
  };

  const handleCancelJob = () => {
    cancelJob({ jobId: nodeProps.data.jobId as string })
      .then(() => {
        const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
        toast.success('Job canceled');
        onUpdateNode({
          id: nodeProps.id,
          data: {
            ...nodeProps.data,
            status: 'error',
            jobId: nodeProps.data.jobId,
            jobStatus: 'CANCELLED',
            message: `Job ${nodeProps.data.jobId ?? 'aa'} canceled in ${date}`,
            updatedAt: date,
          },
        });
        updateNodeInternals(nodeProps.id);
      })
      .catch(() => {
        toast.error('Error canceling job');
      });
    toast.info('Canceling job..');
  };

  if (nodeProps.data.status === 'active') {
    return (
      <>
        <NodeCard
          nodeType="dataset"
          nodeStatus="active"
          selected={nodeProps.selected}
          title="new dataset"
          subtitle="Click to create a job"
        />
        <Sheet open={nodeProps.selected} modal={false}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create</SheetTitle>
            </SheetHeader>
            <DatasetForm onSubmitHandler={handleSubmitJob} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  if (nodeProps.data.status === 'busy') {
    return (
      <>
        <NodeCard
          nodeType="dataset"
          nodeStatus="busy"
          selected={nodeProps.selected}
          title={nodeProps.data?.remotePath?.split('/').pop() ?? 'new dataset'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'checking status..'
          }`}
        />
        <BusySheet
          selected={nodeProps.selected}
          title={'Details'}
          jobId={nodeProps.data.jobId}
          jobStatus={nodeProps.data.jobStatus}
          updatedAt={nodeProps.data.updatedAt}
          message={nodeProps.data.message}
          handleCancel={handleCancelJob}
        />
      </>
    );
  }

  if (nodeProps.data.status === 'success') {
    return (
      <>
        <NodeCard
          nodeType="dataset"
          nodeStatus="success"
          selected={nodeProps.selected}
          title={nodeProps.data?.remotePath?.split('/').pop() ?? 'new dataset'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'jobStatus'
          }`}
        />
        <SuccessSheet
          selected={nodeProps.selected}
          message={nodeProps.data.message}
        >
          <div className="flex flex-col gap-2 rounded-md border border-input p-2 font-mono">
            {formData &&
              Object.entries(formData)
                .filter(
                  ([_, value]) =>
                    typeof value === 'string' || typeof value === 'number',
                )
                .map(([key, value], index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <div
                      key={key}
                      className="flex flex-row items-center justify-between gap-1"
                    >
                      <p className="font-medium">
                        {key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}
                      </p>
                      <p
                        data-even={isEven}
                        className="text-end data-[even=true]:text-violet-600 "
                      >
                        {value as string}
                      </p>
                    </div>
                  );
                })}
          </div>
          <hr />
          <div className="flex flex-col gap-1">
            <ScrollArea className="h-[125px]">
              {formData?.data.map((d, i) => (
                <div key={i} className="flex flex-col items-start">
                  <p className="w-full text-ellipsis bg-muted px-2 py-1 text-sm font-medium">
                    {d.image.split('/').slice(-1)}
                  </p>
                  <p className="w-full  text-ellipsis bg-violet-200 px-2 py-1 text-sm font-medium dark:bg-violet-900">
                    {d.label.split('/').slice(-1)}
                  </p>
                  {!!d.weightMap && (
                    <p className="w-full text-ellipsis bg-violet-300 px-2 py-1 text-sm font-medium dark:bg-violet-900">
                      {d.weightMap?.split('/').slice(-1)}
                    </p>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>
        </SuccessSheet>
      </>
    );
  }

  if (nodeProps.data.status === 'error') {
    return (
      <>
        <NodeCard
          nodeType="dataset"
          nodeStatus="error"
          selected={nodeProps.selected}
          title={nodeProps.data?.remotePath?.split('/').pop() ?? 'new dataset'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'jobStatus'
          }`}
        />
        <ErrorSheet
          selected={nodeProps.selected}
          message={nodeProps.data.message}
        >
          <DatasetForm
            name={formData?.datasetName ?? ''}
            data={formData?.data ?? []}
            onSubmitHandler={handleSubmitJob}
          />
        </ErrorSheet>
      </>
    );
  }

  return null;
}
