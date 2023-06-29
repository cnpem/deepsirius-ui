import { File, Folder, FolderOpen, TreeDeciduous, Type } from 'lucide-react';
import { useState } from 'react';
import { type NodeApi, type NodeRendererProps, Tree } from 'react-arborist';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { env } from '~/env.mjs';
import { treeFetcher, useTree } from '~/hooks/use-tree';
import { type nodeItem } from '~/types/nodeItem';

import { Skeleton } from './ui/skeleton';

type FsTreeProps = {
  path: string;
  handlePathChange: (path: string) => void;
  width: number;
  hidden?: boolean;
};

function Node({ node, style, dragHandle }: NodeRendererProps<nodeItem>) {
  const Icon =
    node.data.type === 'file' ? File : node.isOpen ? FolderOpen : Folder;

  return (
    <div style={style} ref={dragHandle} onClick={() => node.toggle()}>
      {node.isSelected ? (
        <div className="flex rounded-sm  bg-slate-300 dark:bg-slate-600">
          <Icon className="scale-100 pl-1" />
          <span className="ml-1 pr-2">{node.data.name}</span>
        </div>
      ) : (
        <div className="flex">
          <Icon className="scale-75" />
          <span className="ml-1">{node.data.name}</span>
        </div>
      )}
    </div>
  );
}

export function FsTreeDialog({
  children,
  handleSelect,
  message,
}: {
  children: React.ReactNode;
  handleSelect: (path: string) => void;
  message: { title: string; description: string };
}) {
  const treePath = env.NEXT_PUBLIC_TREE_PATH;
  const [path, setPath] = useState(treePath);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    setPath(treePath);
  };
  const onSelect = (path: string) => {
    handleSelect(path);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>{message.title}</DialogTitle>
          <DialogDescription>{message.description}</DialogDescription>
        </DialogHeader>
        <FsTree path={path} handlePathChange={setPath} width={800} />
        <DialogFooter>
          <Button className="w-full" onClick={() => onSelect(path)}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FsTree({ path, handlePathChange, width, hidden }: FsTreeProps) {
  const treePath = env.NEXT_PUBLIC_TREE_PATH;
  const { tree, mutate, isLoading } = useTree(treePath);
  const [hideTree, setHideTree] = useState(hidden);

  const handleReplaceNode = (nodePath: string, newNode: nodeItem) => {
    if (tree && tree[0]) {
      const updatedTree: nodeItem = replaceNode(tree[0], nodePath, newNode);
      void mutate([updatedTree], false);
    }
  };

  function replaceNode(
    node: nodeItem,
    nodePath: string,
    newNode: nodeItem,
  ): nodeItem {
    if (node.path === nodePath) {
      // Replace the node with a new node
      return newNode;
    }

    if (node.children) {
      // Recursively replace the children of the node
      const updatedChildren = node.children.map((child) =>
        replaceNode(child, nodePath, newNode),
      );
      return { ...node, children: updatedChildren };
    }

    return node;
  }
  const handleActivate = (node: NodeApi<nodeItem>) => {
    handlePathChange(node.data.path);
    if (node.isOpen && node.data.type === 'directory') {
      treeFetcher({ url: '/api/filesystem', path: node.data.path })
        .then((updatedNode) => {
          if (updatedNode && updatedNode[0]) {
            handleReplaceNode(node.data.path, updatedNode[0]);
          }
        })
        .catch((err) => console.log(err));
    }
  };
  const toUnixPath = (path: string) =>
    path.replace(/[\\/]+/g, '/').replace(/^([a-zA-Z]+:|\.\/)/, '');

  if (isLoading) {
    return <TreeSkeleton />;
  }

  return (
    <div className="sm:max-w-[825px]">
      <div className="grid gap-4 py-4">
        <div className="flex flex-col w-full space-y-2">
          <Label htmlFor="treepath">Selected Path</Label>
          <div className="flex space-x-1">
            <Button
              variant={hideTree ? 'outline' : 'default'}
              size="icon"
              onClick={() => setHideTree((s) => !s)}
              title={hideTree ? 'Ready to shake some trees?' : 'Type it in!'}
            >
              {hideTree ? <Type /> : <TreeDeciduous />}
            </Button>
            <Input
              id="path"
              className="grow"
              placeholder="path/to/somewhere"
              disabled={!hideTree}
              onChange={(e) => handlePathChange(toUnixPath(e.target.value))}
              value={path}
            />
          </div>
        </div>
        <div className="flex">
          {!hideTree && (
            <Tree
              idAccessor={(d) => d.path}
              data={tree}
              openByDefault={false}
              disableDrag={true}
              width={width}
              className="flex h-full w-full"
              rowClassName="flex w-full h-full"
              onActivate={(node) => handleActivate(node)}
            >
              {Node}
            </Tree>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeSkeleton() {
  return (
    <div className="sm">
      <div className="grid gap-4 py-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="email">Selected Path</Label>
          <div className="flex">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-6 grid-rows-3 gap-1 sm:max-w-[250px]">
          <Skeleton className="col-start-1 row-start-1 h-4 w-[80px]" />
          <Skeleton className="col-start-1 row-start-2 h-4 w-[80px]" />
          <Skeleton className="col-start-2 row-start-3 h-4 w-[80px]" />
        </div>
      </div>
    </div>
  );
}
