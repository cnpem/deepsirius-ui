import Head from 'next/head';
import Image from 'next/image';
import { AvatarDrop } from '~/components/avatar-dropdown';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function LayoutNav({ children, title }: LayoutProps) {
  return (
    <main>
      <Head>
        <title>{title || 'Deepsirius UI'}</title>
        <meta name="deepsirius-ui" content="Deepsirius UI Nav" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex min-h-screen w-full flex-col bg-light-ocean dark:bg-dark-ocean">
        <div className="absolute right-0 top-0 z-10 m-5">
          <AvatarDrop />
        </div>
        <div className="relative m-8 mx-auto h-[15vh] w-full">
          <Image
            className="width-auto mx-auto"
            src="/top.svg"
            alt="DeepSirius Logo"
            fill
          />
        </div>
        <div>{children}</div>
        <div className="relative m-8 mx-auto h-[20vh] w-full">
          <Image
            className="width-auto mx-auto"
            src="/bottom.svg"
            alt="DeepSirius Logo"
            fill
          />
        </div>
      </div>
    </main>
  );
}
