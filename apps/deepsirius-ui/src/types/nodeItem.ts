export type nodeItem = {
  name: string;
  path: string;
  relativePath: string;
  type: string;
  isSymbolicLink: boolean;
  sizeInBytes: number;
  size: string;
  children?: nodeItem[];
};
