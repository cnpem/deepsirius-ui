import Link from "next/link";

import { siteConfig } from "~/config/site";
import { Icons } from "~/components/icons";
import { MainNav } from "~/components/main-nav";
import { ThemeToggle } from "~/components/theme-toggle";
import { buttonVariants } from "~/components/ui/button";
import { AvatarDrop } from "./avatar-dropdown";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-b-slate-200 bg-white dark:border-b-slate-700 dark:bg-slate-900">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Link
              href={siteConfig.links.gitlab}
              target="_blank"
              rel="noreferrer"
            >
              <div
                className={buttonVariants({
                  size: "sm",
                  variant: "ghost",
                  className: "text-slate-700 dark:text-slate-400",
                })}
              >
                <Icons.gitlab className="h-5 w-5 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" />
                <span className="sr-only">Gitlab</span>
              </div>
            </Link>
            <ThemeToggle />
            <AvatarDrop />
          </nav>
        </div>
      </div>
    </header>
  );
}
