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
        <link rel="icon" href="/icon.svg" />
      </Head>
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-[#9994D7] via-[#6012E4] to-[#0B0C1B] dark:bg-gradient-to-br dark:from-[#0B0C1B] dark:via-[#6012E4] dark:to-[#9994D7]">
        <div className="absolute top-0 right-0 m-5 z-10">
          <AvatarDrop />
        </div>
        <div className="mx-auto relative h-[20vh] w-full">
          <Image
            className="mx-auto opacity-75 width-auto"
            src="/transp-top-2024-02-28.svg"
            alt="DeepSirius Logo"
            fill
          />
        </div>
        <div>{children}</div>
        <div className="mx-auto relative h-[25vh] w-full">
          <Image
            className="mx-auto opacity-75 width-auto"
            src="/transp-bottom-2024-02-28.svg"
            alt="DeepSirius Logo"
            fill
          />
        </div>
      </div>
    </main>
  );
}
