import { type NextPage } from 'next';
import Head from 'next/head';
import { Layout } from '~/components/layout';
import Flow from '~/components/workboard/flow';

const Workboard: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>Workboard</title>
        <meta name="description" content="Workboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Flow />
      </main>
    </Layout>
  );
};

export default Workboard;
