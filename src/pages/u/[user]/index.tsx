import { HeartIcon, PlusSquareIcon, TrashIcon } from 'lucide-react';
import { type NextPage } from 'next';
import ErrorPage from 'next/error';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { LayoutNav } from '~/components/layout-nav';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { useUser } from '~/hooks/use-user';
import { api } from '~/utils/api';

const User: NextPage = () => {
  const user = useUser();
  const router = useRouter();

  if (!user) {
    // if the user is not logged in, the middleware will redirect to the login page
    return null;
  }

  if (router.query.user !== user.name) {
    return <ErrorPage statusCode={404} title="" />;
  }

  return (
    <LayoutNav>
      <UserWorkspaces />
    </LayoutNav>
  );
};

export default User;

function UserWorkspaces() {
  const user = useUser();
  const { data: userWorkspaces, isLoading } =
    api.workspaceDbState.getUserWorkspaces.useQuery();
  const utils = api.useUtils();
  // const { setWorkspacePath, initNodes, initEdges, updateStateSnapshot } =
  //   useStoreActions();

  const router = useRouter();

  type WorkspaceSelectProps = {
    path: string;
    state: string;
  };

  const handleSelectWorkspace = useCallback(
    async (props: WorkspaceSelectProps) => {
      if (!user) return;
      await router.push(user.route + '/' + workspaceShortName(props.path));
    },
    [router, user],
  );

  const { mutate: deleteWorkspace } = api.ssh.rmWorkspace.useMutation({
    onSuccess: async () => {
      await utils.workspaceDbState.getUserWorkspaces.invalidate();
      toast.success('Workspace deleted');
    },
    onError: () => {
      toast.error('Error deleting workspace');
    },
  });

  const { mutate: updateFavoriteWorkspace } =
    api.workspaceDbState.updateFavoriteWorkspace.useMutation({
      onSuccess: async () => {
        await utils.workspaceDbState.getUserWorkspaces.invalidate();
        toast.success('Favorite Updated');
      },
      onError: () => {
        toast.error('Error updating favorite workspace');
      },
    });

  const workspaceShortName = (path: string) => {
    return path.split('/').pop() as string;
  };

  const handleNewWorkspace = async () => {
    await router.push('/new');
  };

  const [search, setSearch] = useState('');

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const searchAndSortWorkspaces = userWorkspaces
    ?.filter(({ path }) => path.includes(search))
    .sort((a, b) => {
      return a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1;
    });

  if (isLoading) {
    return <Skeleton />;
  }

  if (userWorkspaces) {
    return (
      <div className="flex flex-col mx-auto  md:w-1/2 w-full px-4">
        <div className="flex flex-row gap-4 pt-0 pb-4">
          <Input
            className="w-3/4 bg-white/10 border-white/10 border-b-2 text-white/90 focus:border-white/20 focus:ring-white/20 focus:ring-opacity-50 focus:ring-2 focus:outline-none transition-all duration-100 ease-in-out placeholder:text-slate-300"
            type="text"
            placeholder="Search workspaces"
            onChange={handleSearch}
          />
          <Button
            className="w-1/4 bg-green-700 gap-2 text-slate-800 dark:text-slate-300 hover:shadow-md hover:bg-green-700/90 transition-all duration-100 ease-in-out"
            variant="default"
            onClick={() => void handleNewWorkspace()}
          >
            <PlusSquareIcon className="h-5 w-5" />
            {'New'}
          </Button>
        </div>

        {!searchAndSortWorkspaces && (
          <div className="flex flex-col gap-4">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        )}

        {searchAndSortWorkspaces?.map((workspace) => (
          <Card
            key={workspace.path}
            className="my-2 bg-slate-200 dark:bg-slate-900 border-none"
          >
            <div className="grid grid-cols-2 justify-between gap-4 py-4 pl-8 pr-4 ">
              <div className="mr-auto">
                <CardHeader className="align-start p-0 text-start">
                  <CardTitle>
                    <Button
                      className="p-0 text-lg"
                      variant="link"
                      onClick={() =>
                        void handleSelectWorkspace({
                          path: workspace.path,
                          state: workspace.state,
                        })
                      }
                    >
                      {workspaceShortName(workspace.path)}
                    </Button>
                  </CardTitle>
                  <CardDescription>{workspace.path}</CardDescription>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground p-0 my-2">
                  <p>
                    {'Last updated at: ' +
                      new Date(workspace.updatedAt).toLocaleString()}
                  </p>
                </CardFooter>
              </div>
              <div className="ml-auto">
                <WorkspaceCardActions
                  path={workspace.path}
                  favorite={workspace.favorite}
                  handleDelete={deleteWorkspace}
                  handleFavorite={({ path }: { path: string }) =>
                    updateFavoriteWorkspace({
                      path,
                      favorite: !workspace.favorite,
                    })
                  }
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  // if we get here, theres a problem with the db
  return <p>Something went wrong</p>;
}

interface WorkspaceCardActionsProps {
  path: string;
  favorite: boolean;
  handleDelete: ({ path }: { path: string }) => void;
  handleFavorite: ({ path }: { path: string }) => void;
}
const WorkspaceCardActions = ({
  path,
  favorite,
  handleDelete,
  handleFavorite,
}: WorkspaceCardActionsProps) => {
  return (
    <div className="flex">
      <Button
        variant="ghost"
        size="icon"
        title="Favorite workspace"
        onClick={() => handleFavorite({ path })}
      >
        {favorite && <HeartIcon className="h-4 w-4" color="red" />}
        {!favorite && <HeartIcon className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Delete workspace"
        onClick={() => handleDelete({ path })}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
