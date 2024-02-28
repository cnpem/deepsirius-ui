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
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-b from-[#676da1de] via-[#252864c7] to-[#221634] dark:bg-gradient-to-b dark:from-[#2a1d40] dark:via-[#5046bec7] dark:to-[#757cb3c7]">
        <div className="absolute top-0 right-0 m-5 z-10">
          <AvatarDrop />
        </div>
        <div className="mx-auto relative h-[20vh] w-full">
          <Image
            className="mx-auto dark:hidden opacity-75 width-auto"
            src="/transp-top-2024-02-28.svg"
            alt="DeepSirius Logo"
            fill
          />
          <Image
            className="mx-auto hidden dark:block filter opacity-50 width-auto"
            src="/transp-dark-top-2024-02-28.svg"
            alt="DeepSirius Logo"
            fill
          />
        </div>
        <div>{children}</div>
        <div className="mx-auto relative h-[25vh] w-full">
          <Image
            className="mx-auto dark:hidden opacity-75 width-auto"
            src="/transp-bottom-2024-02-28.svg"
            alt="DeepSirius Logo"
            fill
          />
          <Image
            className="mx-auto hidden dark:block filter opacity-50 width-auto"
            src="/transp-dark-bottom-2024-02-28.svg"
            alt="DeepSirius Logo"
            fill
          />
        </div>
      </div>
    </main>
  );
}
