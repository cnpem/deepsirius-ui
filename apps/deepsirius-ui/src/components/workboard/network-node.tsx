import dayjs from 'dayjs';
import { AlertTriangleIcon, DumbbellIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Handle,
  type NodeProps,
  Position,
  useUpdateNodeInternals,
} from 'reactflow';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import {
  type FormType,
  NetworkForm,
} from '~/components/workboard/node-component-forms/network-form';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';

export function NetworkNode(nodeProps: NodeProps<NodeData>) {
  const [open, setOpen] = useState(false);

  const formEditState =
    nodeProps.selected &&
    ['active', 'error', 'success'].includes(nodeProps.data.status);

  useEffect(() => {
    setOpen(formEditState);
  }, [formEditState]);

  const updateNodeInternals = useUpdateNodeInternals();

  const {} = api.job.checkStatus.useQuery(
    { jobId: nodeProps.data.jobId as string },
    {
      enabled: nodeProps.data.status === 'busy' && !!nodeProps.data.jobId,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      onSuccess: (data) => {
        console.log('checkJob.onSuccess', data);
        // TODO: the enabled flag should be enough to prevent this from happening
        // check why it's not
        if (!nodeProps.data.jobId) {
          console.error('checkJob.onSuccess', 'no job id', data);
        }
        const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
        if (data.jobStatus === 'COMPLETED') {
          toast.success('Job completed');
          onUpdateNode({
            id: nodeProps.id,
            data: {
              ...nodeProps.data,
              status: 'success',
              jobId: nodeProps.data.jobId,
              jobStatus: data.jobStatus,
              message: `Job ${
                nodeProps.data.jobId ?? 'aa'
              } finished successfully in ${date}`,
              updatedAt: date,
            },
          });
          updateNodeInternals(nodeProps.id);
        } else if (data.jobStatus === 'FAILED') {
          toast.error('Job failed');
          onUpdateNode({
            id: nodeProps.id,
            data: {
              ...nodeProps.data,
              status: 'error',
              jobId: nodeProps.data.jobId,
              jobStatus: data.jobStatus,
              message: `Job ${nodeProps.data.jobId ?? 'aa'} failed in ${date}`,
              updatedAt: date,
            },
          });
          updateNodeInternals(nodeProps.id);
        } else {
          console.log('checkJob.onSuccess', data.jobStatus);
          onUpdateNode({
            id: nodeProps.id,
            data: {
              ...nodeProps.data,
              status: 'busy',
              jobId: nodeProps.data.jobId,
              jobStatus: data.jobStatus,
              message: `Job ${nodeProps.data.jobId ?? 'aa'} is ${
                data.jobStatus?.toLocaleLowerCase() ?? 'aa'
              }, last checked at ${date}`,
              updatedAt: date,
            },
          });
          updateNodeInternals(nodeProps.id);
        }
      },
    },
  );
  const { mutateAsync: cancelJob } = api.job.cancel.useMutation();
  const { mutateAsync: submitJob } =
    api.deepsiriusJob.submitNetwork.useMutation();
  const { onUpdateNode, getSourceData } = useStoreActions();

  const [formData, setFormData] = useState<FormType | undefined>(
    nodeProps.data.form as FormType,
  );

  type NetworkFormSubmitType = 'create' | 'retry' | 'finetune';

  const handleSubmit = (
    formData: FormType,
    submitType: NetworkFormSubmitType,
  ) => {
    console.log('handleSubmitJob');
    const connectedNodeData = getSourceData(nodeProps.id);
    if (!connectedNodeData || !connectedNodeData.remotePath) {
      toast.info('Please connect a dataset');
      return;
    }
    submitJob({
      datasetPath: connectedNodeData.remotePath
        .split('/')
        .pop()
        ?.replace('.h5', '') as string, // should be dataset name?
      trainingType: submitType,
      workspacePath: nodeProps.data.workspacePath,
      formData,
    })
      .then(({ jobId }) => {
        console.log('handleSubmitJob then?', 'jobId', jobId);
        if (!jobId) {
          console.error('handleSubmitJob then?', 'no jobId');
          toast.error('Error submitting job');
          return;
        }
        setFormData(formData);
        console.log();
        onUpdateNode({
          id: nodeProps.id,
          data: {
            ...nodeProps.data,
            status: 'busy',
            remotePath: `${nodeProps.data.workspacePath}/networks/${formData.networkUserLabel}`,
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
      });
  };

  if (nodeProps.data.status === 'active') {
    return (
      <Card
        data-selected={nodeProps.selected}
        className="w-fit border-green-800 bg-green-100 text-green-800 data-[selected=true]:border-green-500 dark:bg-muted dark:text-green-400"
      >
        <CardContent className="p-4 pr-8">
          <div className=" flex flex-row items-center gap-4">
            <DumbbellIcon className="inline-block" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none text-green-800 dark:text-green-400">
                {'new network'}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                {'Click to create a job'}
              </p>
            </div>
          </div>
          <Sheet open={nodeProps.selected} modal={false}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Training</SheetTitle>
              </SheetHeader>
              <NetworkForm
                jobType="create"
                onSubmitHandler={(formData) => handleSubmit(formData, 'create')}
              />
            </SheetContent>
          </Sheet>
        </CardContent>
        <Handle
          className="!bg-green-400 active:!bg-green-500 dark:!bg-muted dark:active:!bg-green-400"
          type="target"
          position={Position.Left}
        />
        <Handle
          className="!bg-green-400 active:!bg-green-500 dark:!bg-muted dark:active:!bg-green-400"
          type="source"
          position={Position.Right}
        />
      </Card>
    );
  }

  if (nodeProps.data.status === 'busy') {
    return (
      <Card
        data-selected={nodeProps.selected}
        className="w-fit border-yellow-800 bg-yellow-100 text-yellow-800 data-[selected=true]:border-yellow-600 dark:bg-muted dark:text-yellow-400"
      >
        <CardContent className="p-4 pr-8">
          <div className=" flex flex-row items-center gap-4">
            <DumbbellIcon className="inline-block" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-none text-yellow-800 dark:text-yellow-400">
                {nodeProps.data?.remotePath?.split('/').pop()}
              </p>
              <p className="text-sm lowercase text-yellow-600">
                {`${nodeProps.data.jobId || 'jobId'} -- ${
                  nodeProps.data.jobStatus || 'checking status..'
                }`}
              </p>
            </div>
            <Sheet open={nodeProps.selected} modal={false}>
              <SheetContent className="flex flex-col gap-4">
                <Alert>
                  <AlertDescription>{nodeProps.data.message}</AlertDescription>
                </Alert>
                <SheetHeader>
                  <SheetTitle>Details</SheetTitle>
                </SheetHeader>
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
                </div>
                <hr />
                <Button
                  onClick={() => {
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
                              nodeProps.data.jobId ?? 'aa'
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
                  }}
                >
                  cancel
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
        <Handle
          className="!bg-yellow-400 active:!bg-yellow-500 dark:!bg-muted dark:active:!bg-yellow-400"
          type="target"
          position={Position.Left}
        />
        <Handle
          className="!bg-yellow-400 active:!bg-yellow-500 dark:!bg-muted dark:active:!bg-yellow-400"
          type="source"
          position={Position.Right}
        />
      </Card>
    );
  }

  if (nodeProps.data.status === 'success') {
    return (
      <Card
        data-selected={nodeProps.selected}
        className="w-fit border-blue-800 bg-blue-100 text-blue-800 data-[selected=true]:border-blue-500 dark:bg-muted dark:text-blue-400"
      >
        <CardContent className="p-4 pr-8">
          <div className=" flex flex-row items-center gap-4">
            <DumbbellIcon className="inline-block" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-none text-blue-800 dark:text-blue-400">
                {nodeProps.data?.remotePath?.split('/').pop()}
              </p>
              <p className="text-sm lowercase text-blue-600">
                {`${nodeProps.data.jobId || 'jobId'} -- ${
                  nodeProps.data.jobStatus || 'jobStatus'
                }`}
              </p>
            </div>
          </div>
          <Sheet open={nodeProps.selected} modal={false}>
            <SheetContent className="flex flex-col gap-4">
              <Alert>
                <AlertDescription>{nodeProps.data.message}</AlertDescription>
              </Alert>
              <SheetHeader>
                <SheetTitle>Finetune</SheetTitle>
              </SheetHeader>
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
              </div>
              <NetworkForm
                networkTypeName={formData?.networkTypeName || 'vnet'}
                networkUserLabel={formData?.networkUserLabel || 'network'}
                jobType="finetune"
                onSubmitHandler={(data) => {
                  handleSubmit(data, 'finetune');
                }}
              />
            </SheetContent>
          </Sheet>
        </CardContent>
        <Handle
          className="!bg-blue-400 active:!bg-blue-500 dark:!bg-muted dark:active:!bg-blue-400"
          type="target"
          position={Position.Left}
        />
        <Handle
          className="!bg-blue-400 active:!bg-blue-500 dark:!bg-muted dark:active:!bg-blue-400"
          type="source"
          position={Position.Right}
        />
      </Card>
    );
  }

  if (nodeProps.data.status === 'error') {
    return (
      <Card
        data-selected={nodeProps.selected}
        className="w-fit border-red-800 bg-red-100 text-red-800 data-[selected=true]:border-red-500 dark:bg-muted dark:text-red-400"
      >
        <CardContent className="relative p-4 pr-8">
          <div className=" flex flex-row items-center gap-4">
            <DumbbellIcon className="inline-block" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-none text-red-800 dark:text-red-400">
                {nodeProps.data?.remotePath?.split('/').pop()}
              </p>
              <p className="text-sm lowercase text-red-600">
                {`${nodeProps.data.jobId || 'jobId'} -- ${
                  nodeProps.data.jobStatus || 'jobStatus'
                }`}
              </p>
            </div>
          </div>
          <Sheet open={nodeProps.selected} modal={false}>
            <SheetContent className="flex flex-col gap-4">
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {nodeProps.data.message || 'Something went wrong'}
                </AlertDescription>
              </Alert>
              <SheetHeader>
                <SheetTitle>Retry</SheetTitle>
              </SheetHeader>
              <NetworkForm
                networkTypeName={formData?.networkTypeName || 'vnet'}
                networkUserLabel={formData?.networkUserLabel || 'network'}
                jobType="retry"
                onSubmitHandler={(data) => {
                  handleSubmit(data, 'retry');
                }}
              />
            </SheetContent>
          </Sheet>
        </CardContent>
        <Handle
          className="!bg-red-400 active:!bg-red-500 dark:!bg-muted dark:active:!bg-red-400"
          type="target"
          position={Position.Left}
        />
        <Handle
          className="!bg-red-400 active:!bg-red-500 dark:!bg-muted dark:active:!bg-red-400"
          type="source"
          position={Position.Right}
        />
      </Card>
    );
  }

  return null;
}
