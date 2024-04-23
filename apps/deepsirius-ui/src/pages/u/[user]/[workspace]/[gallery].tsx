import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// import { useSearchParams } from 'next/navigation';

import { api } from '~/utils/api';
import { cn } from '~/lib/utils';
import {
  WorkspaceInfo,
  useStore,
  useStoreActions,
  type NodeData,
} from '~/hooks/use-store';

import ErrorPage from 'next/error';
import { toast } from 'sonner';
import { type Node, type Edge } from 'reactflow';
import { LayoutNav } from '~/components/layout-nav';
import { Button } from '~/components/ui/button';
import NodeIcon from '~/components/workboard/node-components/node-icon';
import {
  type DatasetData,
  type AugmentationData,
  type NetworkData,
  type FinetuneData,
  type InferenceData,
} from '~/hooks/use-store';
import Image from 'next/image';
import { Dialog, DialogTrigger, DialogContent } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';

type NodeTypes =
  | 'dataset'
  | 'augmentation'
  | 'network'
  | 'finetune'
  | 'inference';

function Gallery() {
  const { nodes } = useStore();
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | undefined>(
    undefined,
  );

  const onNodeSelect = (node: Node<NodeData>) => {
    setSelectedNode(node);
    toast.info(
      `Selected node ${node.type ?? 'missing type'} with status ${
        node.data.status
      } `,
    );
  };

  return (
    <div className="mx-auto flex h-full w-3/4 flex-row items-center justify-center gap-4">
      <SidePanel
        className=" h-full w-1/4 rounded-sm border border-blue-400 bg-white text-blue-800 shadow-md dark:border-blue-600 dark:bg-slate-900 dark:text-blue-500"
        nodes={nodes.filter((node) => node.data.status === 'success')}
        selectedNode={selectedNode}
        onNodeSelect={onNodeSelect}
      />
      <div className="h-full w-3/4 rounded-sm border border-blue-400 bg-white text-blue-800 shadow-md dark:border-blue-600 dark:bg-slate-900 dark:text-blue-500">
        <GallerySwitch selectedNode={selectedNode} />
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

function camelToSnake(s: string) {
  return s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function AugmentationGallery({
  augmentationData,
}: {
  augmentationData: AugmentationData;
}) {
  const {
    remotePath,
    form: { augmentedDatasetName, augmentationArgs },
  } = augmentationData;

  const outputImgDir = `${remotePath
    .split('/')
    .slice(0, -1)
    .join('/')}/${augmentedDatasetName}_preview/`;

  const { data, error, isLoading } = api.ssh.unzipImagesFromPath.useQuery(
    {
      dirPath: outputImgDir,
    },
    {
      enabled: !!outputImgDir,
      refetchOnMount: false,
    },
  );

  return (
    <div className="h-full">
      <div className="flex h-1/5 flex-col px-4 pt-4">
        <h2>Augmentation</h2>
        <p>{augmentedDatasetName}</p>
        <p>output: {outputImgDir}</p>
      </div>
      {data && (
        <div className="grid h-4/5 grid-rows-[auto,1fr] px-4 pb-4">
          <div className="overflow-y-scroll">
            {data.srcList
              .sort((a, b) => {
                if (a.name === 'original') return -1;
                return a.name.localeCompare(b.name);
              })
              .map(({ name, src }) => (
                <ImageDialog key={name} src={src} name={name} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageDialog({ src, name }: { src: string; name: string }) {
  return (
    <Dialog>
      <DialogTrigger className="mx-3 my-1 rounded-md">
        <Image
          src={src}
          alt={name}
          width={128}
          height={128}
          className="rounded-md"
        />
        <Label>{name}</Label>
      </DialogTrigger>
      <DialogContent className="flex flex-shrink flex-col items-center gap-1 p-10 ">
        <Image
          src={src}
          alt={name}
          width={512}
          height={512}
          className="mb-4 rounded-md"
        />
        <Label>{name}</Label>
      </DialogContent>
    </Dialog>
  );
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
          return node.data.datasetData?.name ?? '?';
        case 'augmentation':
          return node.data.augmentationData?.name ?? '?';
        case 'network':
          return node.data.networkData?.label ?? '?';
        case 'finetune':
          return node.data.finetuneData
            ? `${node.data.finetuneData.sourceNetworkLabel}_finetune`
            : '?';
        case 'inference':
          return node.data.inferenceData
            ? `${node.data.inferenceData.networkLabel}_inference`
            : '?';
        default:
          return null;
      }
    };

    if (!node.type) return null;

    return (
      <Button
        variant="secondary"
        className="w-full justify-start gap-2"
        onClick={() => onNodeSelect(node)}
        data-selected={isNodeSelected(node)}
      >
        <NodeIcon nodeType={node.type} className="w-5" />
        {getButtonName(node.type)}
      </Button>
    );
  };

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Datasets
          </h2>
          <div className="space-y-1">
            {datasetNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Augmented Datasets
          </h2>
          <div className="space-y-1">
            {augmentationNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Networks
          </h2>
          <div className="space-y-1">
            {networkNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Finetune
          </h2>
          <div className="space-y-1">
            {finetuneNodes.map((node) => (
              <NodeButton key={node.id} node={node} />
            ))}
          </div>
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Inferences
          </h2>
          <div className="space-y-1">
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
  const routeWorkspace = router.query.workspace as string; // parent component should handle the case when workspace is undefined
  const workspaceChanged = routeWorkspace !== storeWorkspace;

  const { data, error, isLoading } = api.db.getWorkspaceByName.useQuery(
    {
      name: routeWorkspace,
    },
    {
      enabled: workspaceChanged,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
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
  ]);

  const canCreateWorkspace = !workspaceChanged && workspaceInfo;
  const searchingWorkspace = workspaceChanged && !error;

  if (canCreateWorkspace)
    return (
      <LayoutNav title="Loading workspace...">
        <Gallery />
      </LayoutNav>
    );

  if (searchingWorkspace) {
    return (
      <LayoutNav title="Loading workspace...">
        <div className="flex flex-row items-center justify-center gap-4">
          <p className="text-center text-slate-300">Loading workspace...</p>
          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-4 border-sky-600"></div>
        </div>
      </LayoutNav>
    );
  }

  if (error) {
    console.error('error', error);
    return <ErrorPage statusCode={500} title={error.message} />;
  }

  console.error('Forbidden state!');
  console.error('workspaceChanged', workspaceChanged);
  console.error('workspaceInfo', workspaceInfo);
  console.error('workspaceInRoute', routeWorkspace);
  console.error('data', data);
  console.error('isLoading', isLoading);
  console.error('error', error);

  return <ErrorPage statusCode={404} />;
}
