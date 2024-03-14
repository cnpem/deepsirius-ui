import { NodeSSH as Client } from 'node-ssh';
import { env } from '~/env.mjs';

const globalForSSH = globalThis as unknown as {
  ssh: Client | undefined;
};

export const ssh = globalForSSH.ssh ?? new Client();

if (env.NODE_ENV !== 'production') globalForSSH.ssh = ssh;
