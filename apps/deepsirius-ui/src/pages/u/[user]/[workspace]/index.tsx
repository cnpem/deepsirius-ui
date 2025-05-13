import { type NextPage } from "next";
import dynamic from "next/dynamic";
import ErrorPage from "next/error";
import Head from "next/head";
import { useRouter } from "next/router";
import { Layout } from "~/components/layout";
import { useUser } from "~/hooks/use-user";

const NoSSRFlow = dynamic(
  () => import("~/components/workboard/workspace-flow-controller"),
  {
    ssr: false,
  },
);

const Workspace: NextPage = () => {
  const router = useRouter();
  const user = useUser();

  if (!user) {
    return (
      <ErrorPage
        statusCode={404}
        title={"Error: User not found. Please login"}
      />
    );
  }

  if (router.query.user !== user.name) {
    return (
      <ErrorPage
        statusCode={404}
        title={"Error: User name address doesn't match session user"}
      />
    );
  }

  return (
    <Layout>
      <Head>
        <title>Workspace</title>
        <meta
          name="description"
          content="Workspace
        "
        />
        <link rel="icon" href="/logo.svg" />
      </Head>
      <main>
        <NoSSRFlow />
      </main>
    </Layout>
  );
};

export default Workspace;
