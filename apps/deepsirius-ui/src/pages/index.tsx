import { type NextPage } from 'next';
import { signIn } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link, { type LinkProps } from 'next/link';
import { AvatarDrop } from '~/components/avatar-dropdown';
import { Layout } from '~/components/layout';
import { useUser } from '~/hooks/use-user';

type StyledLinkProps = LinkProps & {
  children: React.ReactNode;
};

const StyledLink = ({ children, ...props }: StyledLinkProps) => (
  <Link
    {...props}
    className="w-full rounded-md bg-slate-400/10 px-10 py-3 text-center font-semibold text-slate-700 no-underline transition hover:bg-slate-400/80 dark:bg-slate-700/10 dark:text-slate-300 dark:hover:bg-slate-700/80"
  >
    {children}
  </Link>
);

const SessionOptions: React.FC = () => {
  const user = useUser();

  if (!user)
    return (
      <>
        <StyledLink href={'/'} onClick={() => void signIn(undefined)}>
          Sign in
        </StyledLink>
        <StyledLink href={'/dive'}>Documentation</StyledLink>
      </>
    );

  return (
    <>
      <StyledLink href={user.route}>Workspaces</StyledLink>
      <StyledLink href={'/dive'}>Documentation</StyledLink>
    </>
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
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-light-ocean dark:bg-dark-ocean">
        <div className="absolute right-0 top-0 z-10 m-5">
          <AvatarDrop />
        </div>
        <div className="container flex flex-col items-center justify-center gap-4 px-4 py-16 lg:flex-row lg:gap-12 ">
          <div className="relative h-[30vh] w-[30vh] lg:h-[50vh] lg:w-[50vh]">
            <Image src="/full.svg" alt="DeepSirius Logo" fill />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="mb-8 bg-dark-ocean-remapped bg-clip-text text-center text-5xl font-extrabold tracking-tight text-transparent dark:bg-light-ocean-remapped sm:text-[5rem]">
              DeepSirius
            </h1>
            <SessionOptions />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
