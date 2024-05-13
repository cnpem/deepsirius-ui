import "./global.css";
import { Provider } from "@/app/_components/providers";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  description: "DeepSirius UI Documentation",
  title: {
    template: "%s | DeepSirius UI",
    default: "DeepSirius UI",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
