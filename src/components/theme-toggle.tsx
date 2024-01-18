import { useTheme } from 'next-themes';
import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { ControlButton } from 'reactflow';
import { Icons } from '~/components/icons';
import { Button } from '~/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  useHotkeys('shift+alt+d', () =>
    setTheme(theme === 'light' ? 'dark' : 'light'),
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      title="toggle theme"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Icons.sun className="rotate-0 scale-100 transition-all hover:text-slate-900 dark:-rotate-90 dark:scale-0 dark:text-slate-400 dark:hover:text-slate-100" />
      <Icons.moon className="absolute rotate-90 scale-0 transition-all hover:text-slate-900 dark:rotate-0 dark:scale-100 dark:text-slate-400 dark:hover:text-slate-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function ControlThemeButton() {
  const { theme, setTheme } = useTheme();
  useHotkeys('shift+alt+d', () =>
    setTheme(theme === 'light' ? 'dark' : 'light'),
  );

  return (
    <ControlButton
      title="toggle theme"
      className="[&>svg]:!max-w-[24px] [&>svg]:!max-h-6"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Icons.sun className="h-4 w-4 rotate-0 scale-100 transition-all hover:text-slate-900 dark:-rotate-90 dark:scale-0 dark:text-slate-400 dark:hover:text-slate-100" />
      <Icons.moon className="h-4 w-4 absolute rotate-90 scale-0 transition-all hover:text-slate-900 dark:rotate-0 dark:scale-100 dark:text-slate-400 dark:hover:text-slate-100" />
      <span className="sr-only">Toggle theme</span>
    </ControlButton>
  );
}
