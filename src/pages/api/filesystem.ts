import type { NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import directoryTree from "directory-tree";
import {
  type DirectoryTree,
  type DirectoryTreeCallback,
} from "directory-tree";

const callback: DirectoryTreeCallback = (item: DirectoryTree, path: string) => {
  item.custom = { id: createHash("sha1").update(path).digest("base64") };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const tree : DirectoryTree & { id?: string } = directoryTree("/home/matheus/dev/deepsirius-ui", {
    exclude: /node_modules/,
  },callback,callback);
  res.status(200).json(tree);
}
