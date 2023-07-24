import { signIn, signOut, useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
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
import { useStoreActions, useStoreWorkspacePath } from '~/hooks/use-store';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function AvatarDrop() {
  const { data: sessionData } = useSession();

  const { workspacePath } = useStoreWorkspacePath();
  const { resetStore } = useStoreActions();

  const logOut = useCallback(async () => {
    await signOut({ callbackUrl: '/' }).then(() => {
      // TODO: Make it a toast
      console.log('Successfully signed out');
      resetStore();
    });
  }, [resetStore]);

  const leaveWorkspace = useCallback(() => {
    resetStore();
  }, [resetStore]);

  useHotkeys('shift+alt+l', () =>
    sessionData
      ? void logOut()
      : void signIn(undefined, { callbackUrl: '/workboard' }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="user info">
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
      <DropdownMenuContent className="w-64" align="end" forceMount>
        {!sessionData ? (
          <DropdownMenuItem
            onClick={() =>
              void signIn(undefined, { callbackUrl: '/workboard' })
            }
          >
            <Icons.login className="mr-2 h-4 w-4" />
            <span>Sign In</span>
            <DropdownMenuShortcut>Shift+Alt+L</DropdownMenuShortcut>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem>
              <Icons.user className="mr-2 h-4 w-4" />
              <div className="flex flex-col space-y-1">
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
              {!!workspacePath && (
                <DropdownMenuItem onClick={() => leaveWorkspace()}>
                  <>
                    <Icons.folderx className="mr-2 h-4 w-4" />
                    <span>
                      Leave{' '}
                      <span className="text-purple-500 dark:text-purple-400 font-semibold">
                        workspace
                      </span>
                    </span>
                  </>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logOut()}>
              <Icons.logout className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
              <DropdownMenuShortcut>Shift+Alt+L</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
