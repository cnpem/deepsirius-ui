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
import { homedir } from 'os';
import { env } from '~/env.mjs';

import { prisma } from './db';
import { copySshKeyToRemoteHost, generateSshKeyIfNeeded } from './remote-job';

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

  interface JWT extends DefaultJWT {
    sshKeyPath?: string;
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
        if (!credentials.email || !credentials.password) {
          return null;
        }
        // You might want to pull this call out so we're not making a new LDAP client on every login attemp
        // tlsOption: https://stackoverflow.com/questions/31861109/tls-what-exactly-does-rejectunauthorized-mean-for-me
        const client = ldap.createClient({
          url: env.LDAP_URI,
          tlsOptions: { ca: [fs.readFileSync(env.CA_CERT)] },
        });
        const { email, password } = credentials;
        const name = email.substring(0, email.lastIndexOf('@'));
        // Essentially promisify the LDAPJS client.bind function
        return new Promise((resolve, reject) => {
          client.bind(credentials.email, credentials.password, (error) => {
            if (error) {
              reject(new Error('CredentialsSignin'));
            } else {
              resolve({
                id: name,
                name: name,
                email: email,
                password: password,
              });
            }
          });
        });
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
        const keyPath = `${homedir()}/.ssh/remotejob_rsa`;
        await generateSshKeyIfNeeded(keyPath);
        copySshKeyToRemoteHost(keyPath, user.name, env.SSH_HOST, user.password);
        token.email = user.email;
        token.name = user.name;
        token.sshKeyPath = keyPath;
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
    logo: '/favicon.ico', // Absolute URL to image
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
