import { type NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Layout } from '~/components/layout';

const NoSSRFlow = dynamic(
  () => import('~/components/workboard/workspace-flow-controller'),
  {
    ssr: false,
  },
);

const Workboard: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>Workboard</title>
        <meta name="description" content="Workboard" />
        <link rel="icon" href="/icon.svg" />
      </Head>
      <main>
        <NoSSRFlow />
      </main>
    </Layout>
  );
};

export default Workboard;
