import * as dree from "dree";
import { type ScanOptions } from "dree";

const options: ScanOptions = {
  depth: 3,
  hash:false,
  exclude: ["node_modules", "__pycache__"],
  excludeEmptyDirectories: true,
  symbolicLinks:false,
  showHidden: false,
  stat:false,
};

// export function getChildren(path: string) {
//   const directoryPath = path ? path : "/";
//   return new Promise<dree.Dree>((resolve, reject) => {
//     dree
//       .scanAsync(directoryPath, options)
//       .then((tree) => {
//         // console.log(tree.stat);
//         resolve(tree);
//       })
//       .catch((error) => reject(error));
//   });
// }
export async function getChildren(path: string): Promise<dree.Dree> {
  const directoryPath = path ? path : "/";
  try {
    const tree = await dree.scanAsync(directoryPath, options);
    // console.log(tree);
    // console.log(tree.stat)
    return tree;
  } catch (error) {
    throw error;
  }
}

