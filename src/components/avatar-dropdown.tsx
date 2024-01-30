import {
  ArrowLeftIcon,
  FolderXIcon,
  LogOutIcon,
  TrashIcon,
  UserIcon,
} from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useStore, useStoreActions } from '~/hooks/use-store';
import { api } from '~/utils/api';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function AvatarDrop() {
  const [open, setOpen] = useState(false);
  const { data: sessionData } = useSession();
  const router = useRouter();

  const { resetStore } = useStoreActions();
  const workspacePath = useStore((state) => state.workspacePath);

  const logOut = useCallback(async () => {
    await signOut({ redirect: false });
    await router.push('/');
    toast.success('Logged out');
    resetStore();
  }, [resetStore, router]);

  const leaveWorkspace = useCallback(() => {
    resetStore();
  }, [resetStore]);

  useHotkeys('shift+alt+l', () =>
    sessionData
      ? void logOut()
      : void signIn(undefined, { callbackUrl: '/workboard' }),
  );

  const { mutate: deleteWorkspace } = api.ssh.rmWorkspace.useMutation({
    onSuccess: () => {
      toast.success('Workspace deleted');
      leaveWorkspace();
    },
    onError: () => {
      toast.error('Error deleting workspace');
    },
  });

  if (!sessionData) return null;

  if (open) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              workspace and all its contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWorkspace({ path: workspacePath || '' })}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="user info">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src="https://source.boringavatars.com/bauhaus"
              alt="@user"
            />
            <AvatarFallback>oi</AvatarFallback>
          </Avatar>
          <span className="sr-only">User info</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit" align="end" forceMount>
        <DropdownMenuItem>
          <UserIcon className="mr-2 h-4 w-4" />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium leading-none">
              {sessionData.user?.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground dark:text-gray-500">
              {sessionData.user?.email}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/">
            <DropdownMenuItem className="cursor-pointer">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              <span>Home</span>
            </DropdownMenuItem>
          </Link>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => leaveWorkspace()}
          >
            <FolderXIcon className="mr-2 h-4 w-4" />
            <span>
              <span className="text-purple-500 dark:text-purple-400 font-semibold">
                Leave{' '}
              </span>
              workspace
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            <span>
              <span className="text-purple-500 dark:text-purple-400 font-semibold">
                Delete{' '}
              </span>
              workspace
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => void logOut()}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
          <DropdownMenuShortcut>Shift+Alt+L</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
