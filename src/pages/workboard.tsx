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
import { NetworkNode } from "~/components/workboard/network-node";
import { DatasetNode } from "~/components/workboard/dataset-node";
import { InferenceNode } from "~/components/workboard/inference-node";

const nodeTypes: NodeTypes = {
  dataset: DatasetNode,
  network: NetworkNode,
  inference: InferenceNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 200, y: 400 },
    data: { more: "Im number 3" },
    type: "dataset",
  },
  {
    id: "2",
    position: { x: 400, y: 400 },
    data: { more: "Im number 4" },
    type: "network",
  },
  {
    id: "3",
    position: { x: 800, y: 400 },
    data: { more: "Im number 4" },
    type: "inference",
  },
];
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
];

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
            attributionPosition="top-right"
            nodeTypes={nodeTypes}
          >
            <Controls className="dark:fill-slate-100 [&>button:hover]:dark:bg-slate-500 [&>button]:dark:bg-slate-700" />
            <MiniMap className="dark:bg-slate-700" />
            <Background variant={variant} gap={12} size={1} />
          </ReactFlow>
        </div>
      </main>
    </Layout>
  );
};

export default Workboard;
