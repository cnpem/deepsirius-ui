import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { type NodeProps, useUpdateNodeInternals } from 'reactflow';
import { toast } from 'sonner';
import {
  InferenceForm,
  type FormType,
} from '~/components/workboard/node-component-forms/inference-form';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';
import NodeCard from './node-components/node-card';
import {
  ActiveSheet,
  BusySheet,
  ErrorSheet,
  SuccessSheet,
} from './node-components/node-sheet';
import { ScrollArea } from '../ui/scroll-area';
import { useUser } from '~/hooks/use-user';

export function InferenceNode(nodeProps: NodeProps<NodeData>) {
  const user = useUser();
  const [open, setOpen] = useState(false);

  const { onUpdateNode, getSourceData } = useStoreActions();

  const getSourceNetworkLabel = () => {
    const sourceNode = getSourceData(nodeProps.id);
    return sourceNode?.networkData?.label;
  };

  const [formData, setFormData] = useState<FormType | undefined>(
    nodeProps.data.inferenceData?.form,
  );

  useEffect(() => {
    const formEditState =
      nodeProps.selected &&
      ['active', 'error', 'success'].includes(nodeProps.data.status);
    setOpen(formEditState);
  }, [nodeProps.selected, nodeProps.data.status]);

  const updateNodeInternals = useUpdateNodeInternals();

  const { data: jobData } = api.job.checkStatus.useQuery(
    { jobId: nodeProps.data.jobId as string },
    {
      refetchOnMount: false,
      enabled: nodeProps.data.status === 'busy' && !!nodeProps.data.jobId,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );

  useEffect(() => {
    if (nodeProps.data.status !== 'busy') return;
    if (!jobData) return;
    if (jobData.jobStatus === 'COMPLETED') {
      const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
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
    } else if (jobData.jobStatus === 'FAILED' || jobData.jobStatus?.includes('CANCELLED')) {
      const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
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
      const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
      console.log('checkJob.onSuccess', jobData.jobStatus);
      onUpdateNode({
        id: nodeProps.id,
        data: {
          ...nodeProps.data,
          status: 'busy',
          jobId: nodeProps.data.jobId,
          jobStatus: jobData.jobStatus,
          message: `Job ${nodeProps.data.jobId ?? 'aa'} is ${
            jobData.jobStatus?.toLocaleLowerCase() ?? 'aa'
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
    onUpdateNode,
    updateNodeInternals,
  ]);

  const { mutateAsync: cancelJob } = api.job.cancel.useMutation();
  const { mutateAsync: submitJob } =
    api.deepsiriusJob.submitInference.useMutation();

  const handleSubmit = (formData: FormType) => {
    const sourceNetworkLabel = getSourceNetworkLabel();
    if (!sourceNetworkLabel) {
      toast.warning('Please connect a network');
      return;
    }
    submitJob({
      sourceNetworkLabel,
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
            remotePath: `${formData.outputDir}`,
            jobId: jobId,
            message: `Job ${jobId} submitted in ${dayjs().format(
              'YYYY-MM-DD HH:mm:ss',
            )}`,
            inferenceData: {
              networkLabel: sourceNetworkLabel,
              form: formData,
              outputPath: formData.outputDir,
            },
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
            inferenceData: {
              networkLabel: sourceNetworkLabel,
              form: formData,
              outputPath: '',
            },
          },
        });
        updateNodeInternals(nodeProps.id);
      });
  };

  const handleCancel = () => {
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

  if (!user) return null;
  if (!nodeProps.data.workspacePath) return null;

  const workspaceName = nodeProps.data.workspacePath.split('/').pop();
  if (!workspaceName) return null;
  const nodeIdParams = new URLSearchParams({
    nodeId: nodeProps.id,
  });
  const galleryUrl =
    user.route + '/' + workspaceName + '/gallery?' + nodeIdParams.toString();

  if (nodeProps.data.status === 'active') {
    return (
      <>
        <NodeCard
          title={'inference'}
          subtitle={'click to make an inference'}
          {...nodeProps}
        />
        <ActiveSheet selected={nodeProps.selected} title={'Inference'}>
          <InferenceForm onSubmitHandler={handleSubmit} />
        </ActiveSheet>
      </>
    );
  }

  if (nodeProps.data.status === 'busy') {
    return (
      <>
        <NodeCard
          title={'inference'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'jobStatus'
          }`}
          {...nodeProps}
        />
        <BusySheet
          selected={nodeProps.selected}
          title={'Details'}
          jobId={nodeProps.data.jobId}
          jobStatus={nodeProps.data.jobStatus}
          updatedAt={nodeProps.data.updatedAt}
          message={nodeProps.data.message}
          handleCancel={handleCancel}
          hrefToGallery={galleryUrl}
        />
      </>
    );
  }

  if (nodeProps.data.status === 'success') {
    return (
      <>
        <NodeCard
          title={'inference'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'jobStatus'
          }`}
          {...nodeProps}
        />
        <SuccessSheet
          selected={nodeProps.selected}
          message={nodeProps.data.message}
          hrefToGallery={galleryUrl}
        >
          <div className="flex flex-col gap-2 rounded-md border border-input p-2 font-mono">
            <div className="flex flex-row items-center justify-between gap-1">
              <p className="font-medium">id</p>
              <p className="text-violet-600">{nodeProps.data.jobId}</p>
            </div>
            <div className="flex flex-row items-center justify-between gap-1">
              <p className="font-medium">status</p>
              <p className="lowercase text-violet-600">
                {nodeProps.data.jobStatus}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-1">
              <p className="font-medium">updated at</p>
              <p className="text-end text-violet-600">
                {nodeProps.data.updatedAt}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-1">
              <p className="font-medium">output dir</p>
              <p className="break-all text-end text-violet-600">
                {formData?.outputDir}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-1">
              <p className="font-medium">normalize</p>
              <p className="text-end text-violet-600">
                {formData?.normalize ? 'yes' : 'no'}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-1">
              <p className="font-medium">save prob map</p>
              <p className="text-end text-violet-600">
                {formData?.saveProbMap ? 'yes' : 'no'}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-1">
              <p className="font-medium">padding size</p>
              <p className="text-end text-violet-600">
                {formData?.paddingSize}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-1">
              <p className="font-medium">patch size</p>
              <p className="text-end text-violet-600">{formData?.patchSize}</p>
            </div>
          </div>
          <hr />
          <div className="flex flex-col gap-1">
            <ScrollArea className="h-[125px]">
              {formData?.inputImages.map((d, i) => (
                <div
                  key={i}
                  className="flex flex-col items-start odd:bg-violet-200 even:bg-muted dark:odd:bg-violet-900"
                >
                  <p className="w-full text-ellipsis px-2 py-1 text-sm font-medium">
                    {d.name}
                  </p>
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
          title={'inference'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'Error'
          }`}
          {...nodeProps}
        />
        <ErrorSheet
          selected={nodeProps.selected}
          message={nodeProps.data.message}
          hrefToGallery={galleryUrl}
        >
          <InferenceForm
            outputDir={formData?.outputDir ?? ''}
            inputImages={formData?.inputImages ?? []}
            onSubmitHandler={handleSubmit}
          />
        </ErrorSheet>
      </>
    );
  }

  return null;
}
