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
        <div className="relative h-1/6 justify-center overflow-hidden py-4">
          <TopBgImage />
        </div>
        <div className="relative h-4/6">{children}</div>
        <div className="relative h-1/6 justify-center overflow-hidden py-4">
          <BottomBgImage />
        </div>
      </div>
    </main>
  );
}
