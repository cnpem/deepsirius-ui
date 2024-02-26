import { ArrowRightIcon } from 'lucide-react';
import { type NextPage } from 'next';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Layout } from '~/components/layout';

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <div className="flex gap-4">
        <button
          className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
          onClick={
            sessionData
              ? () => void signOut()
              : () => void signIn(undefined, { callbackUrl: '/workboard' })
          }
        >
          {sessionData ? 'Sign out' : 'Sign in'}
        </button>
        {sessionData && (
          <Link
            href="/workboard"
            className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
          >
            <span>Workboard</span>
            <ArrowRightIcon className="ml-2 inline-block h-5 w-5 text-white" />
          </Link>
        )}
      </div>
    </div>
  );
};

const Home: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>DeepSirius UI</title>
        <meta
          name="DeepSirius"
          content="Interface for using the deepsirius package on the web."
        />
        <link rel="icon" href="/icon.svg" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#5363e0c7] to-[#211731]">
        <div className="container flex flex-row items-center justify-center gap-12 px-4 py-16 ">
          <Image
            src="/full-transp.svg"
            alt="DeepSirius Logo"
            width={500}
            height={500}
          />
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              <span className="text-[hsl(280,100%,70%)]">Deep</span>Sirius
            </h1>
            <AuthShowcase />
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Home;
