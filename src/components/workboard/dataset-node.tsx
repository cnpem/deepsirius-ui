import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  Handle,
  type NodeProps,
  Position,
  useUpdateNodeInternals,
} from 'reactflow';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
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

  const [cardStatus, setCardStatus] = useState(nodeProps.data.status);

  useEffect(() => {
    setCardStatus(nodeProps.data.status);
  }, [nodeProps.data.status, onUpdateNode]);

  return (
    <>
      <Card
        autoFocus
        data-state={cardStatus}
        className="w-[455px] data-[state=active]:bg-green-100 data-[state=busy]:bg-yellow-100
data-[state=error]:bg-red-100 data-[state=inactive]:bg-gray-100
data-[state=success]:bg-blue-100 data-[state=active]:dark:bg-teal-800
data-[state=busy]:dark:bg-amber-700 data-[state=error]:dark:bg-rose-700
data-[state=inactive]:dark:bg-muted data-[state=success]:dark:bg-cyan-700"
      >
        <CardHeader>
          <CardTitle>
            {nodeProps.data?.remotePath?.split('/').pop() ?? 'New Dataset'}
          </CardTitle>
          <CardDescription>{cardStatus}</CardDescription>
        </CardHeader>
        {cardStatus === 'active' && (
          <CardContent>
            <div className="flex flex-col">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {'Click to create a job'}
              </p>
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
        )}
        {cardStatus === 'busy' && (
          <>
            <CardContent>
              <div className="flex flex-col">
                <p className="mb-2 text-3xl font-extrabold text-center">
                  {nodeProps.data.jobId}
                </p>
                {checkStatusQuery.isFetching && (
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {'Checking job status...'}
                  </p>
                )}
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  {nodeProps.data.jobStatus}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
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
            </CardFooter>
          </>
        )}
        {cardStatus === 'error' && (
          <CardContent>
            <div className="flex flex-col">
              <p className="mb-2 text-3xl font-extrabold text-center">
                {nodeProps.data.jobId}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {nodeProps.data.jobStatus}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {nodeProps.data.message || 'Something went wrong'}
              </p>
            </div>
            <Sheet open={nodeProps.selected} modal={false}>
              <SheetContent>
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
        )}
        {cardStatus === 'success' && (
          <CardContent>
            <div className="flex flex-col">
              <p className="mb-2 text-3xl font-extrabold text-center">
                {nodeProps.data.jobId}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {nodeProps.data.jobStatus}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {nodeProps.data.message || 'Job finished successfully'}
              </p>
            </div>
          </CardContent>
        )}
        <Handle type="source" position={Position.Right} />
      </Card>
    </>
  );
}
