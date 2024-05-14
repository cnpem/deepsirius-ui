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
import { ViewRemoteLog, ViewRemoteImages } from '~/components/gallery-views';
// import { logPaths } from '~/server/api/routers/deepsirius-job';

type NodeTypes =
  | 'dataset'
  | 'augmentation'
  | 'network'
  | 'finetune'
  | 'inference';

const nodeStatusBadgeVariants = cva('', {
  variants: {
    status: {
      active: 'bg-green-500',
      busy: 'bg-yellow-500',
      error: 'bg-red-500',
      success: 'bg-blue-500',
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
          <Link
            href={`/u/${user}/${workspace}`}
            className="flex flex-row items-center p-4 "
          >
            <ArrowLeftIcon className="h-5 w-5 " />
            {'Back to'}
            <p className="ml-1 text-blue-800 dark:text-blue-500">{workspace}</p>
            {"'s board."}
          </Link>
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
        <Link
          href={`/u/${user}/${workspace}`}
          className="flex flex-row items-center p-4 "
        >
          <ArrowLeftIcon className="h-5 w-5 " />
          {'Back to'}
          <p className="ml-1 text-blue-800 dark:text-blue-500">{workspace}</p>
          {"'s board."}
        </Link>
        <AvatarDrop />
      </div>
      <div className="flex h-[92%] flex-row">
        <div className="h-full w-1/6 border-r border-blue-600 ">
          <div className="flex flex-col space-y-4 p-4">
            <div className="flex flex-row">
              <NodeIcon nodeType={selectedNode.type} />
              <p className="ml-2 text-lg font-bold">{getNodeName()}</p>
            </div>
            <div className="flex flex-row">
              <p className="text-md font-bold">Status:</p>
              <Badge
                className={cn(
                  'mx-2 text-sm',
                  nodeStatusBadgeVariants({
                    status: selectedNode.data?.status,
                  }),
                )}
              >
                {selectedNode.data?.status}
              </Badge>
            </div>
            <p className="text-md font-bold">Job Message:</p>
            <p>{selectedNode.data?.message}</p>
            {/* formData needs to be customized for each node type */}
            <p className="text-md font-bold">Form Data:</p>
            {/* view selection */}
            <p className="text-md font-bold">Views:</p>
            <Button
              onClick={() => void setView('log-output')}
              variant={(view === 'log-output' && 'default') || 'secondary'}
            >
              Output Logs
            </Button>
            <Button
              onClick={() => void setView('log-err')}
              variant={(view === 'log-err' && 'default') || 'secondary'}
            >
              Error Logs
            </Button>
            <Button
              onClick={() => void setView('preview-imgs')}
              variant={(view === 'preview-imgs' && 'default') || 'secondary'}
              disabled={!['augmentation'].includes(selectedNode.type)}
            >
              Preview Images
            </Button>
            <Button
              onClick={() => void setView('tensorboard')}
              variant={(view === 'tensorboard' && 'default') || 'secondary'}
              disabled={!['network', 'finetune'].includes(selectedNode.type)}
            >
              Tensorboard
            </Button>
          </div>
          {/* side panel */}
        </div>
        <div className="h-full w-5/6 ">
          <GalleryView view={view} node={selectedNode} />
        </div>
      </div>
    </div>
  );
}

function GalleryView({ view, node }: { view: string | null; node: Node<NodeData> }) {
  const workspacePath = node.data.workspacePath;
  const jobId = node.data.jobId;
  const jobName = node.type ? `deepsirius-${node.type}` : '';
  const imagesPath = node.type === 'augmentation' ? node.data.augmentationData?.remotePreviewPath : '';
  switch (view) {
    case 'log-output':
      if (!jobId) return <p>Job Id not found</p>;
      if (!node.type) return <p>Node type not found</p>;
      return <ViewRemoteLog path={`${workspacePath}/logs/log-${jobId}-${jobName}.out`} />;
    case 'log-err':
      if (!jobId) return <p>Job Id not found</p>;
      if (!node.type) return <p>Node type not found</p>;
      return <ViewRemoteLog path={`${workspacePath}/logs/log-${jobId}-${jobName}.err`} />;
    case 'preview-imgs':
      if (!imagesPath) return <p>Images path not found</p>;
      return <ViewRemoteImages path={imagesPath} />;
    case 'tensorboard':
      return <p>Tensorboard</p>;
    default:
      return <p>View not found</p>;
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
          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-4 border-sky-600"></div>
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
