import type { NextApiRequest, NextApiResponse } from "next";
import { getChildren } from "~/server/fs-tree";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    path: string;
  };
}

export default function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const path = req.body.path;
  
  getChildren(path)
    .then((tree) => {
      res.status(200).json(tree);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
}
