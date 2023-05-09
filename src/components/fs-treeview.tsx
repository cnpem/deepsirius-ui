import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { type NodeRendererProps, Tree, type NodeApi } from "react-arborist";
import { File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { type nodeItem } from "~/types/nodeItem";
import { useTree, treeFetcher } from "~/hooks/tree";
import { env } from "~/env.mjs";
import { Skeleton } from "./ui/skeleton";

type FsTreeProps = {
  path: string;
  handlePathChange: (path: string) => void;
  width: number;
};

function Node({ node, style, dragHandle }: NodeRendererProps<nodeItem>) {
  const Icon =
    node.data.type === "file" ? File : node.isOpen ? FolderOpen : Folder;

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

export function FsTreeDialog() {
  const treePath = env.NEXT_PUBLIC_TREE_PATH;
  const [path, setPath] = useState(treePath);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    setPath(treePath);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">...</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>Select workspace path</DialogTitle>
          <DialogDescription>
            {
              "Select the path to the existing workspace or a path to create one."
            }
          </DialogDescription>
        </DialogHeader>
        <FsTree path={path} handlePathChange={setPath} width={800} />
        <DialogFooter>
          <Button className="w-full">Select</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FsTree({ path, handlePathChange, width }: FsTreeProps) {
  const treePath = env.NEXT_PUBLIC_TREE_PATH;
  const { tree, mutate, isLoading } = useTree(treePath);

  const handleReplaceNode = (nodePath: string, newNode: nodeItem) => {
    if (tree && tree[0]) {
      const updatedTree: nodeItem = replaceNode(tree[0], nodePath, newNode);
      void mutate([updatedTree], false);
    }
  };

  function replaceNode(
    node: nodeItem,
    nodePath: string,
    newNode: nodeItem
  ): nodeItem {
    if (node.path === nodePath) {
      // Replace the node with a new node
      return newNode;
    }

    if (node.children) {
      // Recursively replace the children of the node
      const updatedChildren = node.children.map((child) =>
        replaceNode(child, nodePath, newNode)
      );
      return { ...node, children: updatedChildren };
    }

    return node;
  }
  const handleActivate = (node: NodeApi<nodeItem>) => {
    handlePathChange(node.data.path);
    if (node.isOpen && node.data.type === "directory") {
      treeFetcher({ url: "/api/filesystem", path: node.data.path })
        .then((updatedNode) => {
          if (updatedNode && updatedNode[0]) {
            handleReplaceNode(node.data.path, updatedNode[0]);
          }
        })
        .catch((err) => console.log(err));
    }
  };

  if (isLoading) {
    return <TreeSkeleton />;
  }

  return (
    <div className="sm:max-w-[825px]">
      <div className="grid gap-4 py-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="email">Selected Path</Label>
          <Input
            id="path"
            placeholder="path/to/somewhere"
            disabled
            value={path}
          />
        </div>
        <div className="flex">
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
