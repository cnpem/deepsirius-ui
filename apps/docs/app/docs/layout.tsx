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
                src="/logo.png"
                alt="logo"
                width={35}
                height={35}
                className="mr-2"
              />
              <span className="font-semibold text-lg text-violet-600 dark:text-violet-400 text-center pt-1">
                DeepSirius
              </span>
            </div>
          </>
        ),
        githubUrl: "https://github.com/cnpem/deepsirius-ui",
        transparentMode: "top",
      }}
    >
      {children}
    </DocsLayout>
  );
}
