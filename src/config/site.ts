import { type NavItem } from "~/types/nav";

interface SiteConfig {
  name: string;
  description: string;
  mainNav: NavItem[];
  links: {
    gitlab: string;
    docs: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "DeepSirius",
  description: "Deep Learning UI",
  mainNav: [
    {
      title: "Workboard",
      href: "/workboard",
    },
    {
      title: "First Steps",
      href: "/first-steps",
    },
    {
      title: "Docs",
      href: "/docs",
    },
  ],
  links: {
    gitlab: "https://gitlab.cnpem.br/GCC/segmentation/sscDeepsirius",
    docs: "https://gitlab.cnpem.br/GCC/segmentation/sscDeepsirius",
  },
};
