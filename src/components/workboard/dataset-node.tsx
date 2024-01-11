import dayjs from 'dayjs';
import { AlertTriangleIcon, DatabaseIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Handle,
  type NodeProps,
  Position,
  useUpdateNodeInternals,
} from 'reactflow';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { toast } from '~/components/ui/use-toast';
import {
  DatasetForm,
  type FormType,
} from '~/components/workboard/node-component-forms/dataset-form';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';

export function DatasetNode(nodeProps: NodeProps<NodeData>) {
  const formEditState =
    nodeProps.selected &&
    ['active', 'error', 'success'].includes(nodeProps.data.status);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(formEditState);
  }, [formEditState]);

  const [formData, setFormData] = useState({
    datasetName:
      nodeProps.data?.remotePath?.split('/').pop()?.replace('.h5', '') ??
      'NewDataset',
    data: [
      {
        image: '/path/to/image',
        label: '/path/to/label',
      },
    ],
  });

  const updateNodeInternals = useUpdateNodeInternals();

  const checkStatusQuery = api.remotejob.checkStatus.useQuery(
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
        if (data.jobStatus === 'COMPLETED') {
          toast({
            title: 'Job finished',
            description: 'The job has finished successfully',
          });
          onUpdateNode({
            id: nodeProps.id,
            data: {
              ...nodeProps.data,
              status: 'success',
              jobId: nodeProps.data.jobId,
              jobStatus: data.jobStatus,
              message: `Job ${
                nodeProps.data.jobId ?? 'aa'
              } finished successfully in ${dayjs().format(
                'YYYY-MM-DD HH:mm:ss',
              )}`,
            },
          });
          updateNodeInternals(nodeProps.id);
        } else if (data.jobStatus === 'FAILED') {
          toast({
            title: 'Job failed',
            description: 'The job has failed',
          });
          onUpdateNode({
            id: nodeProps.id,
            data: {
              ...nodeProps.data,
              status: 'error',
              jobId: nodeProps.data.jobId,
              jobStatus: data.jobStatus,
              message: `Job ${
                nodeProps.data.jobId ?? 'aa'
              } failed in ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
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
              jobStatus: data.jobStatus,
              message: `Job ${nodeProps.data.jobId ?? 'aa'} is ${
                data.jobStatus ?? 'aa'
              } in ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
            },
          });
          updateNodeInternals(nodeProps.id);
        }
      },
    },
  );
  const { mutateAsync: cancelJob } = api.remotejob.cancel.useMutation();
  const { mutateAsync: submitJob } =
    api.remoteProcess.submitDataset.useMutation();
  const { onUpdateNode } = useStoreActions();

  const handleSubmitJob = (formData: FormType) => {
    console.log('handleSubmitJob');
    submitJob({
      formData,
      workspacePath: nodeProps.data.workspacePath,
    })
      .then(({ jobId }) => {
        console.log('handleSubmitJob then?', 'jobId', jobId);
        if (!jobId) {
          console.error('handleSubmitJob then?', 'no jobId');
          toast({
            title: 'Error submitting job',
            description: 'Something went wrong',
          });
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
          },
        });
        updateNodeInternals(nodeProps.id);
        setOpen(!open);
      })
      .catch((error) => {
        toast({
          title: 'Error submitting job',
          description: (error as Error).message,
        });
      });
  };

  if (nodeProps.data.status === 'active') {
    return (
      <Card className="w-fit bg-green-100 text-green-800 active:border-green-500 border-green-800 dark:bg-muted dark:text-green-400">
        <CardContent className="p-4 pr-8">
          <div className=" flex flex-row items-center gap-4">
            <DatabaseIcon className="inline-block" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none text-green-800 dark:text-green-400">
                {'new dataset'}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                {'Click to create a job'}
              </p>
            </div>
          </div>
          <Sheet open={nodeProps.selected} modal={false}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create</SheetTitle>
              </SheetHeader>
              <DatasetForm
                name={formData.datasetName}
                data={formData.data}
                onSubmitHandler={handleSubmitJob}
              />
            </SheetContent>
          </Sheet>
        </CardContent>
        <Handle type="source" position={Position.Right} />
      </Card>
    );
  }

  if (nodeProps.data.status === 'busy') {
    return (
      <Card className="w-fit bg-yellow-100 text-yellow-800 active:border-yellow-600 border-yellow-800 dark:bg-muted dark:text-yellow-400">
        <CardContent className="p-4 pr-8">
          <div className=" flex flex-row items-center gap-4">
            <DatabaseIcon className="inline-block" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-none text-yellow-800 dark:text-yellow-400">
                {nodeProps.data?.remotePath?.split('/').pop()}
              </p>
              <p className="text-sm text-yellow-600 lowercase">
                {`${nodeProps.data.jobId || 'jobId'} -- ${
                  nodeProps.data.jobStatus || 'jobStatus'
                }`}
              </p>
            </div>
            <Sheet open={nodeProps.selected} modal={false}>
              <SheetContent>
                <Button
                  onClick={() => {
                    //   actor.send('cancel');
                    cancelJob({ jobId: nodeProps.data.jobId as string })
                      .then(() => {
                        toast({
                          title: 'Job canceled',
                          description: 'The job has been canceled',
                        });
                        onUpdateNode({
                          id: nodeProps.id,
                          data: {
                            ...nodeProps.data,
                            status: 'error',
                            jobId: nodeProps.data.jobId,
                            message: `Job ${
                              nodeProps.data.jobId ?? 'aa'
                            } canceled in ${dayjs().format(
                              'YYYY-MM-DD HH:mm:ss',
                            )}`,
                          },
                        });
                        updateNodeInternals(nodeProps.id);
                      })
                      .catch((error) => {
                        toast({
                          title: 'Error canceling job',
                          description: (error as Error).message,
                        });
                      });
                    toast({
                      title: 'Canceling job...',
                    });
                  }}
                >
                  cancel
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
        <Handle type="source" position={Position.Right} />
      </Card>
    );
  }

  if (nodeProps.data.status === 'success') {
    return (
      <Card className="w-fit bg-blue-100 text-blue-800 active:border-blue-500 border-blue-800 dark:bg-muted dark:text-blue-400">
        <CardContent className="p-4 pr-8">
          <div className=" flex flex-row items-center gap-4">
            <DatabaseIcon className="inline-block" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-none text-blue-800 dark:text-blue-400">
                {nodeProps.data?.remotePath?.split('/').pop()}
              </p>
              <p className="text-sm text-blue-600 lowercase">
                {`${nodeProps.data.jobId || 'jobId'} -- ${
                  nodeProps.data.jobStatus || 'jobStatus'
                }`}
              </p>
            </div>
          </div>
          <Sheet open={nodeProps.selected} modal={false}>
            <SheetContent></SheetContent>
          </Sheet>
        </CardContent>
        <Handle type="source" position={Position.Right} />
      </Card>
    );
  }

  if (nodeProps.data.status === 'error') {
    return (
      <Card className="w-fit bg-red-100 text-red-800 active:border-red-500 border-red-800 dark:bg-muted dark:text-red-400">
        <CardContent className="p-4 relative pr-8">
          <div className=" flex flex-row items-center gap-4">
            <DatabaseIcon className="inline-block" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-none text-red-800 dark:text-red-400">
                {nodeProps.data?.remotePath?.split('/').pop()}
              </p>
              <p className="text-sm text-red-600 lowercase">
                {`${nodeProps.data.jobId || 'jobId'} -- ${
                  nodeProps.data.jobStatus || 'jobStatus'
                }`}
              </p>
            </div>
          </div>
          <Sheet open={nodeProps.selected} modal={false}>
            <SheetContent>
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

              <DatasetForm
                name={formData.datasetName}
                data={formData.data}
                onSubmitHandler={handleSubmitJob}
              />
            </SheetContent>
          </Sheet>
        </CardContent>
        <Handle type="source" position={Position.Right} />
      </Card>
    );
  }
}
