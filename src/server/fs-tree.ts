import * as dree from "dree";
import { type ScanOptions } from "dree";

const options: ScanOptions = {
  depth: 3,
  hash:false,
  exclude: ["node_modules", "__pycache__"],
  excludeEmptyDirectories: true,
  showHidden: false,
  stat:true,
};

export function getChildren(path: string) {
  const directoryPath = path ? path : "/";
  return new Promise<dree.Dree>((resolve, reject) => {
    dree
      .scanAsync(directoryPath, options)
      .then((tree) => {
        // console.log(tree.stat);
        resolve(tree);
      })
      .catch((error) => reject(error));
  });
}
