import { HeartIcon, PlusSquareIcon, TrashIcon } from 'lucide-react';
import { type NextPage } from 'next';
import { useSession } from 'next-auth/react';
import ErrorPage from 'next/error';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { type Edge, type Node } from 'reactflow';
import { toast } from 'sonner';
import { AvatarDrop } from '~/components/avatar-dropdown';
import { Layout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Skeleton } from '~/components/ui/skeleton';
import { type NodeData, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';

const User: NextPage = () => {
  const currentUserName = useSession().data?.user?.name;
  const router = useRouter();
  const { user } = router.query;

  if (user !== currentUserName) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-b from-[#757cb3c7] via-[#5046bec7] to-[#2a1d40] dark:bg-gradient-to-b dark:from-[#2a1d40] dark:via-[#5046bec7] dark:to-[#757cb3c7]">
        <div className="absolute top-5 right-5 ">
          <AvatarDrop />
        </div>
        <UserWorkspaces />
      </div>
    </Layout>
  );
};

export default User;

function UserWorkspaces() {
  const { data: userWorkspaces, isLoading } =
    api.workspaceDbState.getUserWorkspaces.useQuery();
  const utils = api.useUtils();
  const { setWorkspacePath, initNodes, initEdges, updateStateSnapshot } =
    useStoreActions();

  const router = useRouter();

  type WorkspaceSelectProps = {
    path: string;
    state: string;
  };
  const handleSelectWorkspace = useCallback(
    async (props: WorkspaceSelectProps) => {
      if (props.state) {
        const stateSnapshot = JSON.parse(props.state) as {
          nodes: Node<NodeData>[];
          edges: Edge[];
        };
        // init nodes and edges from db
        initNodes(stateSnapshot.nodes);
        initEdges(stateSnapshot.edges);
        // write the state snapshot
        updateStateSnapshot();
      }
      // sets the workspace path to the store which will trigger the workspace to be loaded
      setWorkspacePath(props.path);
      await router.push('/workboard');
      toast.success('Workspace loaded');
    },
    [setWorkspacePath, router, initNodes, initEdges, updateStateSnapshot],
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

  const workspaceShortName = (path: string) => {
    return path.split('/').pop() as string;
  };

  const [search, setSearch] = useState('');

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const filteredWorkspaces = userWorkspaces?.filter(({ path }) =>
    path.includes(search),
  );

  if (isLoading) {
    return <Skeleton />;
  }

  if (userWorkspaces) {
    return (
      <div className="flex flex-col mx-auto h-[80vh] md:w-1/2 w-full justify-center px-4">
        <Image
          className="mx-auto dark:hidden opacity-75"
          src="/transp-top-2024-02-28.svg"
          alt="DeepSirius Logo"
          width={300}
          height={300}
        />
        <Image
          className="mx-auto hidden dark:block filter opacity-50"
          src="/transp-dark-top-2024-02-28.svg"
          alt="DeepSirius Logo"
          width={300}
          height={300}
        />
        <div className="flex flex-row gap-4 py-4">
          <Input
            className="w-3/4 bg-white/10 border-white/10 border-b-2 text-white/90 focus:border-white/20 focus:ring-white/20 focus:ring-opacity-50 focus:ring-2 focus:outline-none transition-all duration-200 ease-in-out"
            type="text"
            placeholder="Search workspaces"
            onChange={handleSearch}
          />
          <Button
            className="w-1/4 bg-green-700 gap-2 text-slate-800 dark:text-slate-300"
            variant="default"
          >
            <PlusSquareIcon className="h-5 w-5" />
            {'New'}
          </Button>
        </div>

        {!filteredWorkspaces && (
          <div className="flex flex-col gap-4">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        )}

        <ScrollArea className="align-end">
          {filteredWorkspaces?.map((workspace) => (
            <Card
              key={workspace.path}
              className="my-2 dark:bg-slate-500 dark:bg-opacity-50 bg-slate-300 bg-opacity-50 border-none"
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
                    handleDelete={deleteWorkspace}
                    handleFavorite={({ path }) => console.log(path)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </ScrollArea>
      </div>
    );
  }
  // if we get here, theres a problem with the db
  return <p>Something went wrong</p>;
}

interface WorkspaceCardActionsProps {
  path: string;
  handleDelete: ({ path }: { path: string }) => void;
  handleFavorite: ({ path }: { path: string }) => void;
}
const WorkspaceCardActions = ({
  path,
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
        <HeartIcon className="h-4 w-4" />
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
