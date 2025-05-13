import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useHotkeys } from "react-hotkeys-hook";
import { ControlButton } from "reactflow";

export function ControlThemeButton() {
  const { theme, setTheme } = useTheme();
  useHotkeys("shift+alt+d", () =>
    setTheme(theme === "light" ? "dark" : "light"),
  );

  return (
    <ControlButton
      title="toggle theme"
      className="[&>svg]:!max-h-6 [&>svg]:!max-w-[24px]"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all hover:text-slate-900 dark:-rotate-90 dark:scale-0 dark:text-slate-400 dark:hover:text-slate-100" />
      <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all hover:text-slate-900 dark:rotate-0 dark:scale-100 dark:text-slate-400 dark:hover:text-slate-100" />
      <span className="sr-only">Toggle theme</span>
    </ControlButton>
  );
}
