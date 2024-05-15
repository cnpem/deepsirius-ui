'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQueryState } from 'nuqs';

import { api } from '~/utils/api';
import { cn } from '~/lib/utils';
import { useStore, useStoreActions, type NodeData } from '~/hooks/use-store';

import ErrorPage from 'next/error';
import { toast } from 'sonner';
import { type Node, type Edge } from 'reactflow';
import { Layout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import NodeIcon from '~/components/workboard/node-components/node-icon';
import { AvatarDrop } from '~/components/avatar-dropdown';
import Link from 'next/link';
import { useUser } from '~/hooks/use-user';
import { ArrowLeftIcon } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import { cva } from 'class-variance-authority';
import { ViewRemoteLog, ViewRemoteImages, Tensorboard } from '~/components/gallery-views';

const nodeStatusBadgeVariants = cva('', {
  variants: {
    status: {
      active: 'bg-green-500 hover:bg-green-600',
      busy: 'bg-yellow-500 hover:bg-yellow-600',
      error: 'bg-red-500 hover:bg-red-600',
      success: 'bg-blue-500 hover:bg-blue-600',
    },
  },
});

function Gallery({ user, workspace }: { user: string; workspace: string }) {
  const [nodeId] = useQueryState('nodeId');
  const [view, setView] = useQueryState('view');
  const { nodes } = useStore();
  const selectedNode = nodes.find((node) => node.id === nodeId);

  const getNodeName = () => {
    if (!selectedNode) return undefined;
    if (!selectedNode.type) return undefined;
    switch (selectedNode.type) {
      case 'dataset':
        return selectedNode.data?.datasetData?.name;
      case 'augmentation':
        return selectedNode.data?.augmentationData?.name;
      case 'network':
        return selectedNode.data?.networkData?.label;
      case 'finetune':
        const sourceLabel =
          selectedNode.data?.finetuneData?.sourceNetworkLabel ?? undefined;
        return sourceLabel
          ? `${sourceLabel} finetune_id: ${selectedNode.id}`
          : undefined;
      case 'inference':
        const outputPath =
          selectedNode.data?.inferenceData?.outputPath ?? undefined;
        return outputPath ? `inference ${outputPath}` : undefined;
      default:
        return undefined;
    }
  };

  if (!selectedNode || !selectedNode.type) {
    return (
      <div className="flex h-screen w-screen flex-col bg-light-ocean dark:bg-dark-ocean ">
        <div className="flex h-[8%] w-full flex-row justify-between">
          <BoardLink user={user} workspace={workspace} />
          <AvatarDrop />
        </div>
        <div className="flex h-[92%] flex-row">
          <p className="text-center text-slate-300">No node selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-light-ocean dark:bg-dark-ocean ">
      <div className="flex h-[8%] w-full flex-row justify-between">
        <BoardLink user={user} workspace={workspace} />
        <AvatarDrop />
      </div>
      <div className="flex h-[92%] gap-4 p-2">
        <div className="h-fit rounded-lg border p-2 shadow-lg">
          <div className="flex flex-col space-y-4 p-4">
            <div className="flex items-center">
              <NodeIcon nodeType={selectedNode.type} />
              <p className="ml-2 text-lg font-semibold">{getNodeName()}</p>
              <Badge
                className={cn(
                  'ml-auto text-xs rounded-full',
                  nodeStatusBadgeVariants({
                    status: selectedNode.data?.status,
                  }),
                )}
              >
                {selectedNode.data?.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {selectedNode.data?.message}
            </p>
            <Button
              onClick={() => void setView('log-output')}
              variant={(view === 'log-output' && 'default') || 'outline'}
            >
              Output Logs
            </Button>
            <Button
              onClick={() => void setView('log-err')}
              variant={(view === 'log-err' && 'default') || 'outline'}
            >
              Error Logs
            </Button>
            <Button
              onClick={() => void setView('preview-imgs')}
              variant={(view === 'preview-imgs' && 'default') || 'outline'}
              disabled={!['augmentation'].includes(selectedNode.type)}
            >
              Preview Images
            </Button>
            <Button
              onClick={() => void setView('tensorboard')}
              variant={(view === 'tensorboard' && 'default') || 'outline'}
              disabled={!['network', 'finetune'].includes(selectedNode.type)}
            >
              Tensorboard
            </Button>
          </div>
        </div>
        <div className="h-full w-full">
          <GalleryView view={view} node={selectedNode} />
        </div>
      </div>
    </div>
  );
}

function BoardLink({ user, workspace }: { user: string; workspace: string }) {
  return (
    <Link
      href={`/u/${user}/${workspace}`}
      className="flex flex-row items-center p-4 hover:underline"
    >
      <ArrowLeftIcon className="mr-2 h-4 w-4" />
      {'Back to'}
      <p className="ml-1 text-blue-800 dark:text-blue-500">{`"${workspace}"`}</p>
    </Link>
  );
}

function GalleryView({
  view,
  node,
}: {
  view: string | null;
  node: Node<NodeData>;
}) {
  const workspacePath = node.data.workspacePath;
  const jobId = node.data.jobId;
  const jobName = node.type ? `deepsirius-${node.type}` : '';
  const imagesPath =
    node.type === 'augmentation'
      ? node.data.augmentationData?.remotePreviewPath
      : '';
  switch (view) {
    case 'log-output':
      if (!jobId) return <p>Job Id not found</p>;
      if (!node.type) return <p>Node type not found</p>;
      return (
        <ViewRemoteLog
          path={`${workspacePath}/logs/log-${jobId}-${jobName}.out`}
        />
      );
    case 'log-err':
      if (!jobId) return <p>Job Id not found</p>;
      if (!node.type) return <p>Node type not found</p>;
      return (
        <ViewRemoteLog
          path={`${workspacePath}/logs/log-${jobId}-${jobName}.err`}
        />
      );
    case 'preview-imgs':
      if (!imagesPath) return <p>Images path not found</p>;
      return <ViewRemoteImages path={imagesPath} />;
    case 'tensorboard':
      return <Tensorboard logdir={`${node.data?.networkData?.remotePath ?? '/dummy'}/logs`} name={node.data?.networkData?.form.networkUserLabel ?? 'network'} />;
    default:
      return (
        <div className="flex h-full w-3/4 items-center justify-center rounded-lg border border-dashed">
          <p className="h-1/2 text-center text-muted-foreground">Select a view</p>
        </div>
      );
  }
}

export default function GalleryRouter() {
  const { initNodes, initEdges, setWorkspaceInfo, resetStore } =
    useStoreActions();
  const { workspaceInfo } = useStore();
  const storeWorkspace = workspaceInfo?.name;
  const router = useRouter();
  const sessionUser = useUser();

  const { user, workspace } = router.query; // Assuming 'user' and 'workspace' are dynamic segments
  const routeWorkspace = typeof workspace === 'string' ? workspace : '';
  const isGalleryRoute = router.pathname.includes('/gallery');

  const workspaceChanged = routeWorkspace !== storeWorkspace;

  const { data, error, isLoading } = api.db.getWorkspaceByName.useQuery(
    {
      name: routeWorkspace,
    },
    {
      enabled: workspaceChanged && !!routeWorkspace,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    if (!routeWorkspace) return;
    if (workspaceChanged && !!data?.path) {
      if (storeWorkspace) {
        toast.info(`Leaving workspace ${storeWorkspace}`);
      }
      toast.info(`Switching to workspace ${routeWorkspace}`);
      resetStore();
      setWorkspaceInfo({
        name: data.name,
        path: data.path,
      });
      if (!!data.state) {
        const { nodes, edges } = JSON.parse(data.state) as {
          nodes: Node<NodeData>[];
          edges: Edge[];
        };
        if (nodes) initNodes(nodes);
        if (edges) initEdges(edges);
      }
    }
  }, [
    data,
    workspaceChanged,
    resetStore,
    setWorkspaceInfo,
    initNodes,
    initEdges,
    storeWorkspace,
    routeWorkspace,
    workspace,
  ]);

  const workspaceLoaded = !workspaceChanged && workspaceInfo && routeWorkspace;
  const searchingWorkspace = workspaceChanged && !error;

  if (!sessionUser) {
    return <ErrorPage statusCode={401} />;
  }

  if (sessionUser.name !== user) {
    return <ErrorPage statusCode={403} />;
  }

  if (workspaceLoaded)
    return <Gallery user={sessionUser.name} workspace={workspaceInfo.name} />;

  if (searchingWorkspace) {
    return (
      <Layout>
        <div className="flex flex-row items-center justify-center gap-4">
          <p className="text-center text-slate-300">Loading workspace...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.error('error', error);
    return <ErrorPage statusCode={500} title={error.message} />;
  }

  console.error('Hey! Forbidden state!', {
    workspaceChanged,
    routeWorkspace,
    isGalleryRoute,
    data,
    isLoading,
    error,
  });

  return <ErrorPage statusCode={404} />;
}
