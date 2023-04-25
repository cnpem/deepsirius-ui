import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { type NodeRendererProps, Tree, type NodeApi } from "react-arborist";
import { File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { env } from "~/env.mjs";

type nodeItem = {
  name: string;
  path: string;
  relativePath: string;
  type: string;
  isSymbolicLink: boolean;
  sizeInBytes: number;
  size: string;
  children?: nodeItem[];
};

function Node({ node, style, dragHandle }: NodeRendererProps<nodeItem>) {
  const Icon =
    node.data.type === "file" ? File : node.isOpen ? FolderOpen : Folder;

  return (
    <div style={style} ref={dragHandle} onClick={() => node.toggle()}>
      {node.isSelected ? (
        <div className="flex rounded-sm  bg-slate-300 dark:bg-slate-600">
          <Icon className="scale-90 pl-1" />
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

type fetchParams = {
  path: string;
  url: string;
};
async function fetcher(props: fetchParams): Promise<nodeItem[]> {
  const { url, path } = props;
  const params = { path: path };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const item: nodeItem = await res.json();
      return [item];
    } else {
      throw new Error("Network response was not ok");
    }
  } catch (err) {
    throw err;
  }
}

function useTree(path: string) {
  const { data, isLoading, mutate } = useSWR<nodeItem[]>(
    { url: "/api/filesystem", path: path },
    fetcher,
    {
      fallbackData: new Array<nodeItem>(),
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  return {
    tree: data,
    isLoading,
    mutate,
  };
}

export function FsTreeView() {
  const treePath = env.NEXT_PUBLIC_TREE_PATH;
  const [path, setPath] = useState(treePath);
  const [open, setOpen] = useState(false);
  const { tree, mutate } = useTree(treePath);
  // const [tree, setTree] = useState(new Array<nodeItem>());

  // useEffect(()=>{
  //   async function fetchTree(){
  //     const arvore = await fetcher({url:"/api/filesystem",path:home});
  //     setTree(arvore);
  //   }
  //   void fetchTree();
  // },[])

  const handleReplaceNode = (nodePath: string, newNode: nodeItem) => {
    if (tree && tree[0]) {
      const updatedTree: nodeItem = replaceNode(tree[0], nodePath, newNode);
      // setTree([updatedTree]);
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
    setPath(node.data.path);
    if (node.isOpen && node.data.type === "directory") {
      fetcher({ url: "/api/filesystem", path: node.data.path })
        .then((updatedNode) => {
          if (updatedNode && updatedNode[0]) {
            handleReplaceNode(node.data.path, updatedNode[0]);
          }
        })
        .catch((err) => console.log(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {tree && <Button onClick={()=>setPath(treePath)} variant="outline">...</Button>}
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
              width={800}
              className="flex h-full w-full"
              rowClassName="flex w-full h-full"
              onActivate={(node) => handleActivate(node)}
            >
              {Node}
            </Tree>
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full">Select</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
