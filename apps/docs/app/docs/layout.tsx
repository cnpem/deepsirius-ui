import { pageTree } from "../source";
import { DocsLayout } from "fumadocs-ui/layout";
import type { ReactNode } from "react";
import Image from "next/image";

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: (
          <>
            <div className="flex flex-row items-center">
              <Image
                className="dark:hidden mr-2"
                width={34}
                height={34}
                src="/icon.svg"
                alt="logo"
              />
              <Image
                className="dark:block hidden mr-2"
                width={34}
                height={34}
                src="/icon-dark.svg"
                alt="logo-dark"
              />
              <span className="font-semibold text-lg text-violet-600 dark:text-violet-400 text-center pt-1">
                DeepSirius
              </span>
            </div>
          </>
        ),
        githubUrl: "https://github.com/cnpem/pianno",
        transparentMode: "top",
      }}
    >
      {children}
    </DocsLayout>
  );
}
