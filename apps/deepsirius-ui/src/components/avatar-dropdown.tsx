import {
  ArrowLeftIcon,
  LogOutIcon,
  MoonIcon,
  SquareStackIcon,
  SunIcon,
  UserIcon,
} from 'lucide-react';
import { signIn, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useStoreActions } from '~/hooks/use-store';
import { useUser } from '~/hooks/use-user';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '~/lib/utils';

const AvatarButton = React.forwardRef<HTMLButtonElement>((props, ref) => (
  <Button
    variant="ghost"
    className="rounded-sm border-2 border-slate-300/20 bg-slate-400/10 hover:bg-slate-400/80 dark:border-slate-500/20 dark:bg-slate-700/10 dark:hover:bg-slate-700/80"
    size="icon"
    title="user info"
    ref={ref}
    {...props}
  >
    <Avatar>
      <AvatarImage
        src="/logo.svg"
        alt="Deep Sirius"
        className="rounded-inherit p-2"
      />
      <AvatarFallback>oi</AvatarFallback>
    </Avatar>
    <span className="sr-only">User info</span>
  </Button>
));
AvatarButton.displayName = 'AvatarButton';

export function AvatarDrop() {
  const user = useUser();
  const router = useRouter();

  const { resetStore } = useStoreActions();

  const { theme, setTheme } = useTheme();

  useHotkeys('shift+alt+d', () =>
    setTheme(theme === 'light' ? 'dark' : 'light'),
  );

  const logOut = useCallback(async () => {
    await router.push('/');
    resetStore();
    await signOut({ redirect: false });
    toast.success('Logged out');
  }, [resetStore, router]);

  useHotkeys('shift+alt+l', () =>
    user
      ? void logOut()
      : void signIn(undefined, {
          callbackUrl: '/',
        }),
  );

  if (!user)
    return (
      <Link href="/" className={cn(buttonVariants({ variant: 'link' }))}>
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Home
      </Link>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AvatarButton />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit" align="end" forceMount>
        <DropdownMenuItem>
          <UserIcon className="mr-2 h-4 w-4" />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground dark:text-gray-500">
              {user.email}
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
          <Link href={user.route}>
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
          <SunIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all hover:text-slate-900 dark:rotate-0 dark:scale-100 dark:text-slate-400 dark:hover:text-slate-100" />
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
