import { Layout } from "~/components/layout";
import { type NextPage } from "next";
import Head from "next/head";
("use client");

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
import { useCallback, useEffect, useState } from "react";
import useSWR, { preload } from "swr";
import { useImmer } from "use-immer";
import { type Stats } from "fs";

type nodeItem = {
  name: string;
  path: string;
  relativePath: string;
  type: string;
  isSymbolicLink: boolean;
  sizeInBytes: number;
  size: string;
  stat: Stats;
  children?: nodeItem[];
};

function Node({ node, style, dragHandle }: NodeRendererProps<nodeItem>) {
  const Icon = node.isLeaf ? File : node.isOpen ? FolderOpen : Folder;

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
function fetcher(props: fetchParams): Promise<nodeItem[]> {
  const { url, path } = props;
  const params = { path: path };
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        (err: string) => {
          throw new Error(err);
        };
      }
    })
    .then((item: nodeItem) => new Array<nodeItem>(item))
    .catch((err) => {
      throw err;
    });
}
function useTree(path: string) {
  const { data, isLoading } = useSWR<nodeItem[]>(
    { url: "/api/filesystem", path: path },
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  return {
    tree: data,
    isLoading,
  };
}
export function DialogDemo() {
  useEffect(() => {
    preload({ url: "/api/filesystem", path: path }, fetcher);
  }, []);

  const [path, setPath] = useState("/home/matheus");
  const [open, setOpen] = useState(false);
  const { tree: initialTree, isLoading } = useTree("/home/matheus");
  // const initialTree = fetcher({url:"/api/filesystem",path:"/home/matheus"});
  // const { data:initialTree } = useSWR<nodeItem[]>(
  //   { url: "/api/filesystem", path: path },
  //   fetcher
  // );
  // const { tree: pathTree, isLoading } = useTree(path);

  const [tree, setTree] = useImmer(initialTree);

  function searchTree(element: nodeItem, matchingName: string) {
    if (element.name == matchingName) {
      return element;
    } else if (element.children != null) {
      let result = null;
      for (let i = 0; result == null && i < element.children.length; i++) {
        result = searchTree(element.children[i], matchingName);
      }
      return result;
    }
    return null;
  }
  const handleActivate = (node: NodeApi<nodeItem>) => {
    setPath(node.data.path);
    if (node.data.type === "directory") {
      const candidate = fetcher({url:"/api/filesystem",path:node.data.path});
      setTree((draft) => {
        let n = searchTree(draft[0], node.data.name);
        n = candidate;
      });
    }
  }
  if (isLoading) return <div>{"Loading.."}</div>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {tree && <Button variant="outline">Load</Button>}
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
              idAccessor={(d) => d.stat.ino.toString()}
              initialData={tree}
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

const FirstSteps: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>First Steps</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center ">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Eu sou um{" "}
            <span className="text-[hsl(280,100%,70%)]">exemplinho</span>!
          </h1>
          <DialogDemo />
        </div>
      </main>
    </Layout>
  );
};
export default FirstSteps;
