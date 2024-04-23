import Head from 'next/head';
import { AvatarDrop } from '~/components/avatar-dropdown';
import { TopBgImage, BottomBgImage } from '~/components/bg-images';

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
      <div className="h-screen w-full bg-light-ocean dark:bg-dark-ocean">
        <div className="absolute right-0 top-0 z-10">
          <AvatarDrop />
        </div>
        <div className="relative my-auto flex h-32 flex-row justify-center overflow-hidden">
          <TopBgImage />
        </div>
        {children}
        <div className="relative my-auto flex h-40 flex-row justify-center overflow-hidden">
          <BottomBgImage />
        </div>
      </div>
    </main>
  );
}
