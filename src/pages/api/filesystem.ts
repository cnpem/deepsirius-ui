import type { NextApiRequest, NextApiResponse } from "next";
import { getChildren } from "~/server/fs-tree";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    path: string;
  };
}

export const config = {
  api: {
    responseLimit: false,
  },
}

export default async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const path = req.body.path;
  
  // getChildren(path)
  //   .then((tree) => {
  //     res.status(200).json(tree);
  //   })
  //   .catch((err) => {
  //     res.status(500).json(err);
  //   });
  try{
    const tree = await getChildren(path);
    res.status(200).json(tree);
  } catch{
    res.status(500).json({error: "failed to fetch directory"});
  }
}
