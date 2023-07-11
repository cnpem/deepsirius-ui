import { signIn, signOut, useSession } from 'next-auth/react';
import * as React from 'react';
import { Icons } from '~/components/icons';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import useStore from '~/hooks/use-store';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function AvatarDrop() {
  const { data: sessionData } = useSession();
  const { workspacePath, setWorkspacePath } = useStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex h-10 w-10 rounded-full"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage
              src="https://source.boringavatars.com/bauhaus"
              alt="@user"
            />
            <AvatarFallback>oi</AvatarFallback>
          </Avatar>
          <span className="sr-only">User info</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" forceMount>
        {sessionData && (
          <DropdownMenuItem>
            <Icons.user className="mr-2 h-4 w-4" />
            <span className="font-bold">{sessionData.user?.name}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={
            sessionData
              ? () => void signOut({ callbackUrl: '/' })
              : () => void signIn()
          }
        >
          {sessionData ? (
            <>
              <Icons.logout className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </>
          ) : (
            <>
              <Icons.login className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </>
          )}
        </DropdownMenuItem>
        {!!workspacePath && (
          <DropdownMenuItem onClick={() => void setWorkspacePath('')}>
            <>
              <Icons.folderx className="mr-2 h-4 w-4" />
              <span>Leave Workspace</span>
            </>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
