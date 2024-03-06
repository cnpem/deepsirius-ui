import { type NextPage } from 'next';
import ErrorPage from 'next/error';
import { LayoutNav } from '~/components/layout-nav';
import { CreateNewWorkspace } from '~/components/workboard/create-new-workspace';
import { useUser } from '~/hooks/use-user';

const New: NextPage = () => {
  const user = useUser();

  if (!user) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <LayoutNav>
      <CreateNewWorkspace userRoute={user.route} />
    </LayoutNav>
  );
};

export default New;
