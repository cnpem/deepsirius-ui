import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { env } from '~/env.mjs';
import { sbatchDummyContent, submitJob } from '~/server/remote-job';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });
  const sshKeyPath = token?.sshKeyPath || '';
  const username = token?.name || '';
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const jobId = await submitJob(
      sshKeyPath,
      username,
      env.SSH_HOST,
      sbatchDummyContent,
    );
    res.status(200).json({ jobId: jobId });
  } catch (error) {
    res.status(500).json(error);
  }
}
