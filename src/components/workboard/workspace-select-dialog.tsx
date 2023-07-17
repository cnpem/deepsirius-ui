import { useRouter } from 'next/router';
import { shallow } from 'zustand/shallow';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { toast } from '~/components/ui/use-toast';
import useStore from '~/hooks/use-store';
import { api } from '~/utils/api';

/**
 *
 * @returns buttons for selecting a workspace session from the user's available workspaces from the db
 */
function ChooseUserWorkspaces() {
  // db interactions via tRPC
  // getting the workspaces for the user
  const { isLoading, isError, data, error } =
    api.workspace.getUserWorkspaces.useQuery();
  // zustand store
  const { setWorkspacePath } = useStore(
    (state) => ({
      setWorkspacePath: state.setWorkspacePath,
    }),
    shallow,
  );

  const handleSelectWorkspace = (workspacePath: string) => {
    setWorkspacePath(workspacePath);
  };

  if (isLoading) {
    return <></>;
  }
  if (isError) {
    console.log('error', error);
    return <></>;
  }
  if (data) {
    return (
      <>
        {data.map((workspace) => (
          <Button
            key={workspace.path}
            variant="outline"
            onClick={() => handleSelectWorkspace(workspace.path)}
          >
            {workspace.path}
          </Button>
        ))}
      </>
    );
  }
  return <p>Something went wrong</p>;
}

/**
 *
 * @returns a form component for creating a new workspace session
 */
function CreateNewWorkspace() {
  // db interactions via tRPC
  const { mutate } = api.workspace.createWorkspace.useMutation({
    onSuccess: (data) => {
      console.log('updateWorkspace.onSuccess', data);
      setWorkspacePath(data.path);
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast({
          variant: 'destructive',
          title: 'Failed to create!',
          description: errorMessage[0],
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to create!',
          description: 'Something went wrong. Please try again.',
        });
      }
    },
  });

  // zustand store
  const { setWorkspacePath } = useStore(
    (state) => ({
      setWorkspacePath: state.setWorkspacePath,
    }),
    shallow,
  );

  const handleNewWorkspace = () => {
    const newWorkspacePath = '/home/test';
    mutate({ path: newWorkspacePath });
  };

  return (
    <>
      <Button
        key={'newinstance'}
        variant="outline"
        onClick={() => handleNewWorkspace()}
      >
        New
      </Button>
    </>
  );
}

/**
 *
 * @param open : boolean to control the dialog trigger from outside this component
 * @returns the WorkspaceSelectDialog component for selecting or creating a workspace session
 */
export default function WorkspaceSelectDialog({ open }: { open: boolean }) {
  const router = useRouter();

  const handleDialogClose = async (open: boolean) => {
    // redirect to / if user closes dialog
    if (open === false) {
      console.log('closing dialog and redirecting to /');
      await router.push('/');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(e) => void handleDialogClose(e)}>
      <DialogContent className="sm:w-full">
        <DialogHeader>
          <DialogTitle>Select workspace path</DialogTitle>
          <DialogDescription>
            {'Select an existing workspace or create a new one.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <ChooseUserWorkspaces />
          <CreateNewWorkspace />
        </div>
      </DialogContent>
    </Dialog>
  );
}
