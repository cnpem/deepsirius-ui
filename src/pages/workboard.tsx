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
  Connection,
  Edge,
} from "reactflow";

import "reactflow/dist/style.css";
import { useCallback } from "react";

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

const Workboard: NextPage = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
        <div className="h-[50vw] w-[100vw]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          >
            <Controls className=" [&>button]:dark:bg-slate-700" />
            <MiniMap className="dark:bg-slate-700" />
            <Background variant={"dots"} gap={12} size={1} />
          </ReactFlow>
        </div>
      </main>
    </Layout>
  );
};

export default Workboard;
