import { useCallback, useState } from "react";
import { type NextPage } from "next";
import ErrorPage from "next/error";
import { useRouter } from "next/router";
import { type WorkspaceState } from "@prisma/client";
import { HeartIcon, PlusSquareIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import AlertDelete from "~/components/alert-delete";
import { LayoutNav } from "~/components/layout-nav";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useUser } from "~/hooks/use-user";
import { api } from "~/utils/api";

const UserPage: NextPage = () => {
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
      <UserWorkspaces userRoute={user.route} />
    </LayoutNav>
  );
};

type WorkspaceSelectProps = {
  path: string;
  state: string;
};

function UserWorkspaces({ userRoute }: { userRoute: string }) {
  const router = useRouter();

  const handleNewWorkspace = async () => {
    await router.push("/new");
  };

  const [search, setSearch] = useState("");

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  return (
    <div className="mx-auto flex w-full flex-col gap-2 px-4 md:w-1/2">
      <div className="flex flex-row gap-4 pb-4 pt-0">
        <Input
          className="border-none bg-slate-300 bg-opacity-10 text-slate-200 placeholder:text-slate-300"
          type="text"
          placeholder="Search workspaces"
          onChange={handleSearch}
        />
        <button
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={() => void handleNewWorkspace()}
        >
          <PlusSquareIcon className="mr-2 h-4 w-4" />
          {"New"}
        </button>
      </div>
      <WorkspaceList userRoute={userRoute} search={search} />
    </div>
  );
}

interface WorkspaceCardActionsProps {
  path: string;
  favorite: boolean;
  handleDelete: ({ path }: { path: string }) => void;
  handleFavorite: ({ path }: { path: string }) => void;
}
function WorkspaceCardActions({
  path,
  favorite,
  handleDelete,
  handleFavorite,
}: WorkspaceCardActionsProps) {
  const [alertOpen, setAlertOpen] = useState(false);
  return (
    <>
      <AlertDelete
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onConfirm={() => handleDelete({ path })}
      />
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
          onClick={() => setAlertOpen(true)}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

type WorkspaceListProps = {
  userRoute: string;
  search: string;
};

function WorkspaceList({ userRoute, search }: WorkspaceListProps) {
  const utils = api.useUtils();
  const router = useRouter();

  function workspaceShortName(path: string) {
    return path.split("/").pop() as string;
  }

  function sortAndSearchWorkspaces({
    workspaces,
    search,
  }: {
    workspaces: WorkspaceState[];
    search: string;
  }) {
    if (!workspaces) return [];
    const sorted = workspaces.sort((a, b) => {
      return a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1;
    });
    if (!search) return sorted;
    return sorted.filter((workspace) =>
      workspace.path.toLowerCase().includes(search.toLowerCase()),
    );
  }

  const { data: workspaces, isLoading } = api.db.getUserWorkspaces.useQuery();

  const handleSelect = useCallback(
    async (props: WorkspaceSelectProps) => {
      await router.push(userRoute + "/" + workspaceShortName(props.path));
    },
    [router, userRoute],
  );

  const { mutate: deleteWorkspace } = api.ssh.rmWorkspace.useMutation({
    onSuccess: async ({ message, type }) => {
      await utils.db.getUserWorkspaces.invalidate();
      if (type === "warning") {
        toast.warning(message);
        return;
      }
      if (type === "success") {
        toast.success(message);
        return;
      }
      toast.info(message);
    },
    onError: ({ message }) => {
      toast.error("Error deleting workspace");
      console.error(message);
    },
  });

  const { mutate: updateFavorite } = api.db.updateFavoriteWorkspace.useMutation(
    {
      onSuccess: async () => {
        await utils.db.getUserWorkspaces.invalidate();
        toast.success("Favorite Updated");
      },
      onError: () => {
        toast.error("Error updating favorite workspace");
      },
    },
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="flex h-36 w-full flex-row justify-center" />
        <Skeleton className="flex h-36 w-full flex-row justify-center" />
        <Skeleton className="flex h-36 w-full flex-row justify-center" />
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="flex flex-col">
        <Skeleton className="flex h-36 w-full flex-row justify-center">
          <p className="my-auto">No workspaces found</p>
        </Skeleton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sortAndSearchWorkspaces({ workspaces, search }).map((workspace) => (
        <Card
          key={workspace.path}
          className="border border-blue-400 bg-white text-blue-800 dark:border-blue-600 dark:bg-slate-900 dark:text-blue-500"
        >
          <div className="grid grid-cols-2 justify-between gap-4 py-4 pl-8 pr-4">
            <div className="mr-auto">
              <CardHeader className="align-start p-0 text-start">
                <CardTitle>
                  <Button
                    className="p-0 text-lg font-semibold text-blue-800 dark:text-blue-500"
                    variant="link"
                    onClick={() =>
                      void handleSelect({
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
              <CardFooter className="my-2 p-0 text-sm text-muted-foreground">
                <p>
                  {"Last updated at: " +
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
                  updateFavorite({
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

export default UserPage;
