import { type NextPage } from "next";
import { Layout } from "~/components/layout";
import Head from "next/head";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  BackgroundVariant,
  type NodeTypes,
  type Node,
} from "reactflow";

import "reactflow/dist/style.css";
import { useCallback } from "react";
import {
  NetworkNode,
  WorkspaceNode,
  HeroNode,
} from "~/components/workboard/custom-nodes";

const nodeTypes: NodeTypes = {
  special: HeroNode,
  workspace: WorkspaceNode,
  network: NetworkNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: { label: "Oin", name: "Miles Morales" },
    type: "special",
  },
  { id: "2", position: { x: 200, y: 300 }, data: { label: "Hue" } },
  {
    id: "3",
    position: { x: 400, y: 400 },
    data: { path: "Hue1" },
    type: "workspace",
  },
  {
    id: "4",
    position: { x: 800, y: 400 },
    data: { path: "Hue2" },
    type: "network",
  },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

const Workboard: NextPage = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const variant = BackgroundVariant.Dots;

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  return (
    <Layout>
      <Head>
        <title>Workboard</title>
        <meta name="description" content="Workboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center ">
        <div className="flex h-screen w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
          >
            <Controls className=" dark:fill-slate-100 [&>button:hover]:dark:bg-slate-500 [&>button]:dark:bg-slate-700 " />
            <MiniMap className="dark:bg-slate-700" />
            <Background variant={variant} gap={12} size={1} />
          </ReactFlow>
        </div>
      </main>
    </Layout>
  );
};

export default Workboard;
