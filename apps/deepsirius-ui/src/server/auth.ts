import { PrismaAdapter } from '@next-auth/prisma-adapter';
import fs from 'fs';
import ldap from 'ldapjs';
import { type GetServerSidePropsContext } from 'next';
import {
  type DefaultSession,
  type DefaultUser,
  type NextAuthOptions,
  type User,
  getServerSession,
} from 'next-auth';
import { type DefaultJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import keygen from 'ssh-keygen-lite';
import { env } from '~/env.mjs';

import { prisma } from './db';
import type { ErrnoException } from './remote-job';
import { NodeSSH } from 'node-ssh';

// TODO: Auth is breaking when the user's credentials are ok but the service can't ssh into SSH_HOST.
// This will happen when the user doesn't have a scheduled proposal for the day, so its group is not allowed to ssh into SSH_HOST.

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    password?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    privateKey?: string;
    storageApiCookie?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'LDAP',
      credentials: {
        email: {
          label: 'Email',
          type: 'text',
          placeholder: 'user.name@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: 'Password',
        },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials) {
          return null;
        }
        let certificate: Buffer;
        try {
          certificate = fs.readFileSync(env.CA_CERT);
        } catch (err) {
          throw new Error('INTERNAL SERVER ERROR: CA certificate not found');
        }
        const { email, password } = credentials;
        const name = email.substring(0, email.lastIndexOf('@'));
        // You might want to pull this call out so we're not making a new LDAP client on every login attemp
        // tlsOption: https://stackoverflow.com/questions/31861109/tls-what-exactly-does-rejectunauthorized-mean-for-me
        const client = ldap
          .createClient({
            url: env.LDAP_URI,
            tlsOptions: { ca: [certificate] },
          })
          .on('error', () => {
            throw new Error('INTERNAL SERVER ERROR: LDAP create client failed');
          });

        // Essentially promisify the LDAPJS client.bind function
        await new Promise((resolve, reject) => {
          client.bind(email, password, (error) => {
            if (!!error) {
              reject(new Error('Invalid credentials'));
            } else {
              resolve(console.log('LDAP bind successful'));
            }
          });
        });

        // register user in database
        const userInDb = await prisma.user.findUnique({
          where: { email },
        });

        if (!userInDb) {
          const newUser = await prisma.user.create({
            data: {
              name,
              email,
            },
          });
          return {
            ...newUser,
            password,
          };
        }

        return {
          ...userInDb,
          password,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user && user.name && user.password) {
        //storage api setup
        const params = new URLSearchParams({ key: env.STORAGE_API_KEY });
        const authUrl = `${
          env.STORAGE_API_URL
        }/api/session?${params.toString()}`;

        const res = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'sftp',
            hostname: env.STORAGE_API_URL.split('//')[1],
            path: '/ibira',
            username: user.name,
            password: user.password,
          }),
        });

        const resCookie = res.headers.get('set-cookie');
        const authCookie = resCookie?.split(';')[0];
        token.storageApiCookie = authCookie;

        //ssh setup
        const comment = `${user.name}@deepsirius`;
        const { name: username, password } = user;
        const ssh = new NodeSSH();
        // clean up old public key
        const connection = await ssh.connect({
          username: username,
          password: password,
          host: env.SSH_HOST,
        });

        const sftp = await connection.requestSFTP();

        // creating the .ssh directory if it doesn't exist
        await new Promise<void>((resolve, reject) => {
          sftp.mkdir('.ssh', (err) => {
            const error = err as ErrnoException;
            if (error) {
              if (error.code === 4) {
                resolve();
              } else {
                reject(error);
              }
            } else {
              resolve();
            }
          });
        });

        const keys = await new Promise<string>((resolve, reject) => {
          sftp.readFile('.ssh/authorized_keys', (err, keys) => {
            if (err) {
              const error = err as ErrnoException;
              if (error.code === 2) {
                resolve('');
              } else {
                reject(error);
              }
            } else {
              resolve(keys.toString());
            }
          });
        });
        const updatedKeys = keys
          .split('\n')
          .filter((key) => !key.includes(comment))
          .join('\n');

        //generate new key pair
        const pair = await keygen({
          // sshKeygenPath: 'ssh-keygen',
          // location: path.join(homedir(), '.ssh', `${comment}_rsa`),
          type: 'rsa',
          read: true,
          force: true,
          destroy: false,
          comment: comment,
          password: env.PRIVATE_KEY_PASSPHRASE,
          size: '2048',
          format: 'PEM',
        });

        // copy new public key
        const newKeys = updatedKeys + '\n' + pair.pubKey;
        await new Promise<void>((resolve, reject) => {
          sftp.writeFile('.ssh/authorized_keys', newKeys, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(console.log('authorized_keys updated'));
            }
          });
        });

        token.privateKey = pair.key;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  theme: {
    colorScheme: 'auto', // "auto" | "dark" | "light"
    brandColor: '', // Hex color code
    logo: '/logo.svg', // Absolute URL to image
    buttonText: '', // Hex color code
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
