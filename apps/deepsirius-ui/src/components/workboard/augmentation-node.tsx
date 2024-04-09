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

export function AugmentationNode(nodeProps: NodeProps<NodeData>) {
  const [open, setOpen] = useState(false);

  const { onUpdateNode, getSourceData } = useStoreActions();

  const [formData, setFormData] = useState<FormType | undefined>(
    nodeProps.data.form as FormType,
  );

  const getSourceDatasetName = () => {
    const sourceNode = getSourceData(nodeProps.id);
    if (sourceNode?.remotePath) {
      try {
        return (
          sourceNode.remotePath.split('/')?.pop()?.replace('.h5', '') || ''
        );
      } catch (e) {
        console.error(e);
      }
    }
    return '';
  };

  const getSuggestedName = () => {
    const name = getSourceDatasetName();
    return name ? name + '_augmented' : '';
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
    if (!jobData) return;
    if (jobData.jobStatus === 'COMPLETED') {
      const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
      console.log('Job completed');
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
          message: `Job ${nodeProps.data.jobId ?? 'aa'} failed in ${date}`,
          updatedAt: date,
        },
      });
      updateNodeInternals(nodeProps.id);
    } else {
      const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
      console.log('Job is busy');
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
    api.deepsiriusJob.submitAugmentation.useMutation();

  const handleSubmit = (formData: FormType) => {
    const baseDatasetName = getSourceDatasetName();
    if (!baseDatasetName) {
      toast.warning('Please connect a dataset');
      return;
    }
    submitJob({
      formData,
      baseDatasetName,
      workspacePath: nodeProps.data.workspacePath,
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
            form: formData,
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
          nodeType={nodeProps.type}
          selected={nodeProps.selected}
          title={'augmentation'}
          subtitle={'Click to augment a dataset'}
          nodeStatus={nodeProps.data.status}
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
          nodeType={nodeProps.type}
          selected={nodeProps.selected}
          title={'augmentation'}
          subtitle={'Busy'}
          nodeStatus={nodeProps.data.status}
        />
        <BusySheet
          selected={nodeProps.selected}
          title={'Details'}
          jobId={nodeProps.data.jobId}
          jobStatus={nodeProps.data.jobStatus}
          updatedAt={nodeProps.data.updatedAt}
          message={nodeProps.data.message}
          handleCancel={handleCancel}
        />
      </>
    );
  }

  if (nodeProps.data.status === 'success') {
    return (
      <>
        <NodeCard
          nodeType={nodeProps.type}
          selected={nodeProps.selected}
          title={'augmentation'}
          subtitle={'Success'}
          nodeStatus={nodeProps.data.status}
        />
        <SuccessSheet
          selected={nodeProps.selected}
          message={nodeProps.data.message}
        >
          <div className="flex flex-col gap-2 rounded-md border border-input p-2 font-mono">
            {formData &&
              Object.entries(formData)
                .filter(([_, value]) => typeof value === 'string')
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-row items-center justify-between gap-1"
                  >
                    <p className="font-medium">{key}</p>
                    <p className="text-end text-violet-600">
                      {value as string}
                    </p>
                  </div>
                ))}
          </div>
        </SuccessSheet>
      </>
    );
  }

  if (nodeProps.data.status === 'error') {
    return (
      <>
        <NodeCard
          nodeType={nodeProps.type}
          selected={nodeProps.selected}
          title={'augmentation'}
          subtitle={'Error'}
          nodeStatus={nodeProps.data.status}
        />
        <ErrorSheet
          selected={nodeProps.selected}
          message={nodeProps.data.message}
        >
          <AugmentationForm
            onSubmitHandler={handleSubmit}
            name={formData?.augmentedDatasetName || ''}
          />
        </ErrorSheet>
      </>
    );
  }

  return null;
}
