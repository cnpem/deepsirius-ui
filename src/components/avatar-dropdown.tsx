import { signIn, signOut, useSession } from 'next-auth/react';
import * as React from 'react';
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
import useStore from '~/hooks/use-store';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function AvatarDrop() {
  const { data: sessionData } = useSession();
  useHotkeys('shift+alt+l', () =>
    sessionData
      ? void signOut({ callbackUrl: '/' })
      : void signIn(undefined, { callbackUrl: '/workboard' }),
  );
  const { workspacePath, setWorkspacePath } = useStore();

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
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>New Team</DropdownMenuItem>
              {!!workspacePath && (
                <DropdownMenuItem onClick={() => void setWorkspacePath('')}>
                  <>
                    <Icons.folderx className="mr-2 h-4 w-4" />
                    <span>Leave &lsquo;{workspacePath}&rsquo;</span>
                  </>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void signOut({ callbackUrl: '/' })}
            >
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
