import * as dree from "dree";
import { type ScanOptions } from "dree";

const options: ScanOptions = {
  depth: 3,
  hash: false,
  exclude: ["node_modules", "__pycache__"],
  excludeEmptyDirectories: true,
  symbolicLinks: false,
  showHidden: false,
  stat: false,
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
