import { type NextPage } from 'next';
import Head from 'next/head';
import { Layout } from '~/components/layout';
import Geppetto from '~/components/workboard/geppetto';

const Workboard: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>Workboard</title>
        <meta name="description" content="Workboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center ">
        <Geppetto />
      </main>
    </Layout>
  );
};

export default Workboard;
