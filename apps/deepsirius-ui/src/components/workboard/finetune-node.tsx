import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { type NodeProps, useUpdateNodeInternals } from 'reactflow';
import { toast } from 'sonner';
import {
  FinetuneForm,
  type FormType,
} from '~/components/workboard/node-component-forms/finetune-form';
import { type NodeData, useStoreActions, useStore } from '~/hooks/use-store';
import { api } from '~/utils/api';
import NodeCard from './node-components/node-card';
import {
  ActiveSheet,
  BusySheet,
  ErrorSheet,
  SuccessSheet,
} from './node-components/node-sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { useUser } from '~/hooks/use-user';
import { checkStatusRefetchInterval } from '~/lib/constants';

export function FinetuneNode(nodeProps: NodeProps<NodeData>) {
  const user = useUser();
  const [open, setOpen] = useState(false);

  const { onUpdateNode } = useStoreActions();

  function getSourceData(nodeId: string) {
    const sourceNodesId = useStore
      .getState()
      .edges.filter((edge) => edge.target === nodeId);
    const sourceNodes = sourceNodesId.map((id) =>
      useStore.getState().nodes.find((node) => node.id === id.source),
    );
    const sourceDataset = sourceNodes.find((node) => node?.type === 'dataset');
    const sourceAugmentedDataset = sourceNodes.find(
      (node) => node?.type === 'augmentation',
    );
    const sourceNetwork = sourceNodes.find((node) => node?.type === 'network');
    const sourceFinetune = sourceNodes.find(
      (node) => node?.type === 'finetune',
    );

    return {
      sourceDatasetName:
        sourceDataset?.data?.datasetData?.name ??
        sourceAugmentedDataset?.data?.augmentationData?.sourceDatasetName,
      sourceNetworkLabel:
        sourceNetwork?.data?.networkData?.label ??
        sourceFinetune?.data?.finetuneData?.sourceNetworkLabel,
      sourceNetworkType:
        sourceNetwork?.data?.networkData?.networkType ??
        sourceFinetune?.data?.finetuneData?.sourceNetworkType,
    };
  }

  const [formData, setFormData] = useState<FormType | undefined>(
    nodeProps.data.finetuneData?.form,
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
      refetchInterval: checkStatusRefetchInterval,
      refetchIntervalInBackground: true,
    },
  );

  useEffect(() => {
    if (nodeProps.data.status !== 'busy') return;
    if (!jobData) return;
    if (jobData.jobStatus === 'COMPLETED') {
      const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
      toast.success('Job completed');
      const finetuneData = nodeProps.data.finetuneData;
      if (!finetuneData) {
        toast.warning('Finetune data not found');
        return;
      }
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
          finetuneData: {
            ...finetuneData,
          },
        },
      });
      updateNodeInternals(nodeProps.id);
    } else if (
      jobData.jobStatus === 'FAILED' ||
      jobData.jobStatus?.includes('CANCELLED')
    ) {
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
    formData,
    jobData,
    nodeProps.data,
    nodeProps.id,
    onUpdateNode,
    updateNodeInternals,
  ]);

  const { mutateAsync: cancelJob } = api.job.cancel.useMutation();
  const { mutateAsync: submitJob } =
    api.deepsiriusJob.submitFinetune.useMutation();

  const handleSubmit = (formData: FormType) => {
    const { sourceDatasetName, sourceNetworkLabel, sourceNetworkType } =
      getSourceData(nodeProps.id);
    if (!sourceDatasetName) {
      toast.warning('Please connect a dataset');
      return;
    }
    if (!sourceNetworkLabel || !sourceNetworkType) {
      toast.warning('Please connect a network');
      return;
    }
    submitJob({
      sourceDatasetName,
      sourceNetworkLabel,
      sourceNetworkType,
      workspacePath: nodeProps.data.workspacePath,
      formData,
    })
      .then(({ jobId }) => {
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
            remotePath: ``,
            jobId: jobId,
            message: `Job ${jobId} submitted in ${dayjs().format(
              'YYYY-MM-DD HH:mm:ss',
            )}`,
            finetuneData: {
              sourceDatasetName,
              sourceNetworkLabel,
              sourceNetworkType,
              form: formData,
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
            message: `Job ${
              nodeProps.data.jobId ?? '[jobId not found]'
            } canceled in ${date}`,
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
          title={'finetune'}
          subtitle={'click to finetune a network'}
          {...nodeProps}
        />
        <ActiveSheet selected={nodeProps.selected} title={'Finetune Network'}>
          <FinetuneForm
            onSubmitHandler={(formData) => handleSubmit(formData)}
          />
        </ActiveSheet>
      </>
    );
  }

  if (nodeProps.data.status === 'busy') {
    return (
      <>
        <NodeCard
          title={'finetune'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'UNDEFINED'
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
          title={'finetune'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'jobStatus'
          }`}
          {...nodeProps}
        />
        <SuccessSheet
          selected={nodeProps.selected}
          message={nodeProps.data.message}
          title="Overview"
          hrefToGallery={galleryUrl}
        >
          <div className="flex flex-col gap-1 rounded-md border border-input p-2 font-mono">
            {formData &&
              Object.entries(formData)
                .filter(
                  ([_, value]) =>
                    typeof value === 'string' ||
                    typeof value === 'number' ||
                    typeof value === 'boolean',
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
                        {value.toString()}
                      </p>
                    </div>
                  );
                })}
          </div>
        </SuccessSheet>
      </>
    );
  }

  if (nodeProps.data.status === 'error') {
    return (
      <>
        <NodeCard
          title={'finetune'}
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
          <FinetuneForm
            onSubmitHandler={(formData) => {
              handleSubmit(formData);
            }}
          />
        </ErrorSheet>
      </>
    );
  }

  return null;
}
