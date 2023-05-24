import { type NextApiRequest, type NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { env } from '~/env.mjs';
import { checkJobState } from '~/server/remote-job';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });
  const sshKeyPath = token?.sshKeyPath || '';
  const username = token?.name || '';
  const jobId = req.query.jobId as string;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const jobState = await checkJobState(
      sshKeyPath,
      username,
      env.SSH_HOST,
      jobId,
    );
    res.status(200).json({ jobState: jobState });
  } catch (error) {
    res.status(500).json(error);
  }
}
