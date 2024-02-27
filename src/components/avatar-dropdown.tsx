import {
  ArrowLeftIcon,
  LogOutIcon,
  MoonIcon,
  SquareStackIcon,
  SunIcon,
  UserIcon,
} from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
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
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function AvatarDrop() {
  const [open, setOpen] = useState(false);
  const { data: sessionData } = useSession();
  const router = useRouter();

  const { resetStore } = useStoreActions();
  const workspacePath = useStore((state) => state.workspacePath);

  const { theme, setTheme } = useTheme();

  useHotkeys('shift+alt+d', () =>
    setTheme(theme === 'light' ? 'dark' : 'light'),
  );

  const logOut = useCallback(async () => {
    await signOut({ redirect: false });
    await router.push('/');
    console.log('Logged out');
    toast.success('Logged out');
    resetStore();
  }, [resetStore, router]);

  const leaveWorkspace = useCallback(async () => {
    const userName = sessionData?.user?.name || '';
    await router.push('/users/' + userName).then(() => {
      resetStore();
    });
  }, [resetStore, router, sessionData?.user?.name]);

  useHotkeys('shift+alt+l', () =>
    sessionData
      ? void logOut()
      : void signIn(undefined, { callbackUrl: '/workboard' }),
  );

  const { mutate: deleteWorkspace } = api.ssh.rmWorkspace.useMutation({
    onSuccess: async () => {
      toast.success('Workspace deleted');
      await leaveWorkspace();
    },
    onError: () => {
      toast.error('Error deleting workspace');
    },
  });

  if (!sessionData) return null;

  if (open) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-none"
            size="icon"
            title="user info"
          >
            <Avatar className="rounded-none">
              <AvatarImage src="/icon.svg" alt="Deep Sirius" />
              <AvatarFallback>oi</AvatarFallback>
            </Avatar>
            <span className="sr-only">User info</span>
          </Button>
        </AlertDialogTrigger>
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
        <Button
          variant="ghost"
          className="rounded-none"
          size="icon"
          title="user info"
        >
          <Avatar className="rounded-none">
            <AvatarImage src="/icon.svg" alt="Deep Sirius" />
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
          <Link href={'/users/' + (sessionData.user.name || '')}>
            <DropdownMenuItem className="cursor-pointer">
              <SquareStackIcon className="mr-2 h-4 w-4" />
              <span>My Workspaces</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          <MoonIcon className="h-4 w-4 rotate-0 scale-100 transition-all hover:text-slate-900 dark:-rotate-90 dark:scale-0 dark:text-slate-400 dark:hover:text-slate-100" />
          <SunIcon className="h-4 w-4 absolute rotate-90 scale-0 transition-all hover:text-slate-900 dark:rotate-0 dark:scale-100 dark:text-slate-400 dark:hover:text-slate-100" />
          <span className="ml-2">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => void logOut()}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
