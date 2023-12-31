import { type NextPage } from 'next';
import Head from 'next/head';
import { FsTreeDialog } from '~/components/fs-treeview';
import { Layout } from '~/components/layout';

('use client');

const FirstSteps: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>Navegador</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center ">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Eu sou um{' '}
            <span className="text-[hsl(280,100%,70%)]">exemplinho</span>!
          </h1>
          <FsTreeDialog
            message={{
              title: 'Bom dia, BRASIL!',
              description: 'Que felicidade imensa poder estar com vocês!!!!',
            }}
            handleSelect={() => console.log('OIEEE')}
          >
            <button className="bg-[hsl(280,100%,70%)] text-white px-4 py-2 rounded-md">
              Clique aqui
            </button>
          </FsTreeDialog>
        </div>
      </main>
    </Layout>
  );
};
export default FirstSteps;
