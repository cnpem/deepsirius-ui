import * as dree from "dree";
import { type ScanOptions } from "dree";

const options: ScanOptions = {
  depth: 2,
  hash: false,
  exclude: ["node_modules", "__pycache__"],
  excludeEmptyDirectories: false,
  symbolicLinks: false,
  showHidden: false,
  stat: false,
  skipErrors: true,
};

export async function getChildren(path: string): Promise<dree.Dree> {
  const directoryPath = path ? path : "/";
  try {
    const tree = await dree.scanAsync(directoryPath, options);
    // console.log(tree);
    return tree;
  } catch (error) {
    throw error;
  }
}
