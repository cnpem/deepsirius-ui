import dynamic from 'next/dynamic';

const Hello = dynamic(() => import('~/components/hello'), {
  ssr: false,
});

export default function Page() {
  return <Hello />;
}
