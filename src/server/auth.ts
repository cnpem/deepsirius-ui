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
import { env } from '~/env.mjs';

import { prisma } from './db';
import {
  copyPublicKeyToRemote,
  generateKeyPairPromise,
  removePublicKeyByComment,
} from './remote-job';

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
          console.log('Error: CA_CERT not found');
          return null;
        }
        const { email, password } = credentials;
        const name = email.substring(0, email.lastIndexOf('@'));
        // // bypass certificate validation if LDAP_URI is not set
        // if (!env.LDAP_URI) {
        //   return new Promise((resolve) => {
        //     const user = {
        //       id: name,
        //       name: name,
        //       email: email,
        //       password: password,
        //     } as User;
        //     // for debugging, logs id name and email of the user
        //     console.log('LDAP_URI not set, bypassing LDAP authentication with credentials:', {id: user.id, name: user.name, email: user.email});
        //     resolve(user);
        //   });
        // }
        // You might want to pull this call out so we're not making a new LDAP client on every login attemp
        // tlsOption: https://stackoverflow.com/questions/31861109/tls-what-exactly-does-rejectunauthorized-mean-for-me
        const client = ldap
          .createClient({
            url: env.LDAP_URI,
            tlsOptions: { ca: [certificate] },
          })
          .on('error', (error) => {
            console.log('ldap.createClient error', error);
            return new Error('Error ldap.createClient');
          });
        // Essentially promisify the LDAPJS client.bind function
        return new Promise((resolve, reject) => {
          client.bind(credentials.email, credentials.password, (error) => {
            if (error) {
              console.log('client.bind error:', error);
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
        const comment = `${user.name}@deepsirius`;
        const { name: username, password } = user;
        // clean up old public key
        await removePublicKeyByComment(
          username,
          env.SSH_HOST,
          password,
          comment,
        );
        const pair = await generateKeyPairPromise({
          comment: comment,
          passphrase: env.PRIVATE_KEY_PASSPHRASE,
        });
        // copy new public key
        await copyPublicKeyToRemote(
          pair.pubKey,
          username,
          env.SSH_HOST,
          password,
        );
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
