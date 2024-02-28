import { type NextPage } from 'next';
import { useSession } from 'next-auth/react';
import ErrorPage from 'next/error';
import { LayoutNav } from '~/components/layout-nav';
import { CreateNewWorkspace } from '~/components/workboard/create-new-workspace';

const New: NextPage = () => {
  const currentUserName = useSession().data?.user?.name;

  if (!currentUserName) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <LayoutNav>
      <CreateNewWorkspace />
    </LayoutNav>
  );
};

export default New;
