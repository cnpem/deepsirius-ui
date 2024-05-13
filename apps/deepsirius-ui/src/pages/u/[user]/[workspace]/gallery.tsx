import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// import { useSearchParams } from 'next/navigation';

import { api } from '~/utils/api';
import { cn } from '~/lib/utils';
import {
  useStore,
  useStoreActions,
  type NodeData,
} from '~/hooks/use-store';

import ErrorPage from 'next/error';
import { toast } from 'sonner';
import { type Node, type Edge } from 'reactflow';
// import { LayoutNav } from '~/components/layout-nav';
import { Layout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import NodeIcon from '~/components/workboard/node-components/node-icon';
import AugmentationGallery from '~/components/workboard/node-components/gallery-components/augmentation-gallery';
import { AvatarDrop } from '~/components/avatar-dropdown';
import Link from 'next/link';
import { useUser } from '~/hooks/use-user';
import { ArrowLeftIcon } from 'lucide-react';

type NodeTypes =
  | 'dataset'
  | 'augmentation'
  | 'network'
  | 'finetune'
  | 'inference';

function Gallery({ user, workspace }: { user: string; workspace: string }) {
  const { nodes } = useStore();
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | undefined>(
    nodes.find((node) => node.selected) ?? undefined,
  );

  const onNodeSelect = (node: Node<NodeData>) => {
    setSelectedNode(node);
  };

  const completeNodes = nodes.filter((node) => node.data.status === 'success');

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
        <SidePanel
          className="h-full w-1/6 border-r border-blue-600 "
          nodes={completeNodes}
          selectedNode={selectedNode}
          onNodeSelect={onNodeSelect}
        />
        <div className="h-full w-5/6 ">
          <GallerySwitch selectedNode={selectedNode} />
        </div>
      </div>
    </div>
  );
}

function GallerySwitch({
  selectedNode,
}: {
  selectedNode: Node<NodeData> | undefined;
}) {
  if (!selectedNode)
    return (
      <div className="p-4 text-center text-slate-300">
        <p>Select a node to see details</p>
      </div>
    );
  switch (selectedNode.type) {
    case 'augmentation': {
      if (!selectedNode.data.augmentationData) return null;
      return (
        <AugmentationGallery
          augmentationData={selectedNode.data.augmentationData}
        />
      );
    }
    default:
      return <GenericGallery selectedNode={selectedNode} />;
  }
}

function GenericGallery({ selectedNode }: { selectedNode: Node<NodeData> }) {
  return (
    <div>
      <h2>Generic</h2>
      <p>status: {selectedNode.data.status}</p>
      <p>type: {selectedNode.type}</p>
    </div>
  );
}

interface SidePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  nodes: Node<NodeData>[];
  selectedNode: Node<NodeData> | undefined;
  onNodeSelect: (node: Node<NodeData>) => void;
}
function SidePanel({
  nodes,
  selectedNode,
  onNodeSelect,
  className,
}: SidePanelProps) {
  const isNodeSelected = (node: Node<NodeData>) => {
    return selectedNode && selectedNode.id === node.id;
  };

  const networkNodes = nodes.filter((node) => node.type === 'network');
  const datasetNodes = nodes.filter((node) => node.type === 'dataset');
  const augmentationNodes = nodes.filter(
    (node) => node.type === 'augmentation',
  );
  const finetuneNodes = nodes.filter((node) => node.type === 'finetune');
  const inferenceNodes = nodes.filter((node) => node.type === 'inference');

  const NodeButton = ({ node }: { node: Node<NodeData> }) => {
    const getButtonName = (nodeType: NodeTypes | unknown) => {
      switch (nodeType) {
        case 'dataset':
          return node.data.datasetData?.name ?? '';
        case 'augmentation':
          return node.data.augmentationData?.name ?? '';
        case 'network':
          return node.data.networkData?.label ?? '';
        case 'finetune':
          return node.data.finetuneData
            ? `${node.data.finetuneData.sourceNetworkLabel}_finetune`
            : '';
        case 'inference':
          return node.data.inferenceData
            ? `${node.data.inferenceData.networkLabel}_inference`
            : '';
        default:
          return null;
      }
    };

    if (!node.type) return null;

    return (
      <Button
        variant="link"
        size={'sm'}
        className="w-full justify-start p-0 text-muted-foreground data-[selected=true]:font-extrabold data-[selected=true]:text-blue-800 data-[selected=true]:hover:text-accent-foreground "
        onClick={() => onNodeSelect(node)}
        data-selected={isNodeSelected(node)}
      >
        {getButtonName(node.type)}
      </Button>
    );
  };

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="text-md my-2 px-4 font-semibold tracking-tight">
            <NodeIcon nodeType={'dataset'} className="mr-1 w-5" />
            Datasets
          </h2>
          <div className="ml-4 -space-y-1">
            {datasetNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
          <h2 className="text-md my-2 px-4 font-semibold tracking-tight">
            <NodeIcon nodeType={'augmentation'} className="mr-1 w-5" />
            Augmented Datasets
          </h2>
          <div className="ml-4 -space-y-1">
            {augmentationNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
          <h2 className="text-md my-2 px-4 font-semibold tracking-tight">
            <NodeIcon nodeType={'network'} className="mr-1 w-5" />
            Networks
          </h2>
          <div className="ml-4 -space-y-1">
            {networkNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
          <h2 className="text-md my-2 px-4 font-semibold tracking-tight">
            <NodeIcon nodeType={'finetune'} className="mr-1 w-5" />
            Finetune
          </h2>
          <div className="ml-4 -space-y-1">
            {finetuneNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
          <h2 className="text-md my-2 px-4 font-semibold tracking-tight">
            <NodeIcon nodeType={'inference'} className="mr-1 w-5" />
            Inferences
          </h2>
          <div className="ml-4 -space-y-1">
            {inferenceNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
