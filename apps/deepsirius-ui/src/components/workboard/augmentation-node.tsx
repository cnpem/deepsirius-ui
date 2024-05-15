import {
  type FormType,
  AugmentationForm,
} from './node-component-forms/augmentation-form';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { type NodeProps, useUpdateNodeInternals } from 'reactflow';
import { toast } from 'sonner';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';
import NodeCard from './node-components/node-card';
import {
  ActiveSheet,
  BusySheet,
  ErrorSheet,
  SuccessSheet,
} from './node-components/node-sheet';
import { type DataSchema } from './node-component-forms/dataset-form';
import { useUser } from '~/hooks/use-user';

export function AugmentationNode(nodeProps: NodeProps<NodeData>) {
  const user = useUser();
  const [open, setOpen] = useState(false);

  const { onUpdateNode, getSourceData } = useStoreActions();

  const [formData, setFormData] = useState<FormType | undefined>(
    nodeProps.data.augmentationData?.form,
  );

  const getSourceDatasetData = () => {
    const sourceNode = getSourceData(nodeProps.id);
    if (sourceNode?.datasetData) {
      const images = sourceNode.datasetData.form.data.map(
        ({ image }: DataSchema) => image,
      );

      return {
        sourceDatasetName: sourceNode.datasetData.name,
        images: images,
      };
    }
    return {
      sourceDatasetName: '',
      images: [] as string[],
    };
  };

  const getSuggestedName = () => {
    const { sourceDatasetName } = getSourceDatasetData();
    return sourceDatasetName
      ? sourceDatasetName + '_augmented'
      : 'source_not_found';
  };

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
            nodeProps.data.jobId ?? 'Err'
          } finished successfully in ${date}`,
          updatedAt: date,
        },
      });
      updateNodeInternals(nodeProps.id);
    } else if (jobData.jobStatus === 'FAILED') {
      const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
      console.log('Job failed');
      toast.error('Job failed');
      onUpdateNode({
        id: nodeProps.id,
        data: {
          ...nodeProps.data,
          status: 'error',
          jobId: nodeProps.data.jobId,
          jobStatus: jobData.jobStatus,
          message: `Job ${nodeProps.data.jobId ?? 'Err'} failed in ${date}`,
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
          message: `Job ${nodeProps.data.jobId ?? 'Err'} is ${
            jobData.jobStatus?.toLocaleLowerCase() ?? 'Err'
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
    api.deepsiriusJob.submitAugmentation.useMutation();

  const handleSubmit = (formData: FormType) => {
    const { sourceDatasetName, images } = getSourceDatasetData();
    if (!sourceDatasetName) {
      toast.warning('Please connect a dataset');
      return;
    }
    submitJob({
      formData,
      sourceDatasetName,
      workspacePath: nodeProps.data.workspacePath,
      baseDatasetFullImages: images,
    })
      .then(({ jobId }) => {
        onUpdateNode({
          id: nodeProps.id,
          data: {
            ...nodeProps.data,
            status: 'busy',
            remotePath: `${nodeProps.data.workspacePath}/datasets/${formData.augmentedDatasetName}.h5`,
            jobId: jobId,
            message: `Job ${jobId} submitted in ${dayjs().format(
              'YYYY-MM-DD HH:mm:ss',
            )}`,
            augmentationData: {
              sourceDatasetName,
              form: formData,
              name: formData.augmentedDatasetName,
              remotePath: `${nodeProps.data.workspacePath}/datasets/${formData.augmentedDatasetName}.h5`,
              remotePreviewPath: `${nodeProps.data.workspacePath}/datasets/${formData.augmentedDatasetName}_preview/`,
            },
          },
        });
        updateNodeInternals(nodeProps.id);
        setFormData(formData);
        setOpen(!open);
        toast.success('Job submitted');
      })
      .catch((e) => {
        toast.error('Error submitting job');
        console.error(e);
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
            message: `Job ${nodeProps.data.jobId ?? 'Err'} canceled in ${date}`,
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
          title={'augmentation'}
          subtitle={'click to augment a dataset'}
          {...nodeProps}
        />
        <ActiveSheet
          selected={nodeProps.selected}
          title={'Dataset Augmentation'}
        >
          <AugmentationForm
            onSubmitHandler={handleSubmit}
            name={getSuggestedName()}
          />
        </ActiveSheet>
      </>
    );
  }

  if (nodeProps.data.status === 'busy') {
    return (
      <>
        <NodeCard
          title={nodeProps.data.augmentationData?.name || 'augmentation'}
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
          title={nodeProps.data.augmentationData?.name || 'augmentation'}
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
            <p>Show something here</p>
          </div>
        </SuccessSheet>
      </>
    );
  }

  if (nodeProps.data.status === 'error') {
    return (
      <>
        <NodeCard
          title={nodeProps.data.augmentationData?.name || 'augmentation'}
          subtitle={`${nodeProps.data.jobId || 'jobId'} -- ${
            nodeProps.data.jobStatus || 'jobStatus'
          }`}
          {...nodeProps}
        />
        <ErrorSheet
          selected={nodeProps.selected}
          message={nodeProps.data.message}
          hrefToGallery={galleryUrl}
        >
          <AugmentationForm
            onSubmitHandler={handleSubmit}
            name={nodeProps.data.augmentationData?.name || 'augmentation'}
          />
        </ErrorSheet>
      </>
    );
  }

  return null;
}
