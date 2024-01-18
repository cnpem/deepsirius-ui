import { ArrowLeftIcon } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { Icons } from '~/components/icons';
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
import { useStoreActions } from '~/hooks/use-store';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function AvatarDrop() {
  const { data: sessionData } = useSession();
  const router = useRouter();

  const { resetStore } = useStoreActions();

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

  if (!sessionData) return null;

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
          <Icons.user className="mr-2 h-4 w-4" />
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
            <Icons.folderx className="mr-2 h-4 w-4" />
            <span>
              Leave{' '}
              <span className="text-purple-500 dark:text-purple-400 font-semibold">
                workspace
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void logOut()}>
          <Icons.logout className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
          <DropdownMenuShortcut>Shift+Alt+L</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
