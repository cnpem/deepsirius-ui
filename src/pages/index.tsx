import { ArrowRightIcon } from 'lucide-react';
import { type NextPage } from 'next';
import { signIn, useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { AvatarDrop } from '~/components/avatar-dropdown';
import { Layout } from '~/components/layout';

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  if (!sessionData)
    return (
      <button
        className=" w-3/4 rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={() => void signIn(undefined, { callbackUrl: '/' })}
      >
        {'Sign in'}
      </button>
    );

  return (
    <Link
      href={'/users/' + (sessionData.user.name || '')}
      className="w-3/4 text-center rounded-full bg-slate-300 bg-opacity-10 px-10 py-3 font-semibold text-slate-300 no-underline transition hover:bg-white/20"
    >
      <span>My Workspaces</span>
      <ArrowRightIcon className="ml-2 inline-block h-5 w-5 text-white" />
    </Link>
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#757cb3c7] via-[#5046bec7] to-[#2a1d40] dark:bg-gradient-to-b dark:from-[#2a1d40] dark:via-[#5046bec7] dark:to-[#757cb3c7]">
        <div className="absolute top-5 right-5 ">
          <AvatarDrop />
        </div>
        <div className="container flex lg:flex-row flex-col items-center justify-center lg:gap-12 px-4 py-16 ">
          <Image
            src="/full-transp.svg"
            alt="DeepSirius Logo"
            width={500}
            height={500}
          />
          <div className="flex flex-col items-center gap-12">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] text-center">
              <span className="text-slate-900 dark:text-slate-300">Deep</span>
              <span className="text-slate-300 dark:text-slate-900">Sirius</span>
            </h1>
            <AuthShowcase />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
