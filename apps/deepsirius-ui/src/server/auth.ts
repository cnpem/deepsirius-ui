import { promisify } from "util";
import type {
  DefaultSession,
  DefaultUser,
  NextAuthOptions,
  User,
} from "next-auth";
import { type GetServerSidePropsContext } from "next";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { NodeSSH } from "node-ssh";
import keygen from "ssh-keygen-lite";
import type { ErrnoException } from "./remote-job";
import { env } from "~/env.mjs";
import { prisma } from "./db";

// TODO: Auth is breaking when the user's credentials are ok but the service can't ssh into SSH_HOST.
// This will happen when the user doesn't have a scheduled proposal for the day, so its group is not allowed to ssh into SSH_HOST.

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    password?: string;
  }
}

declare module "next-auth/jwt" {
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
      name: "LDAP",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "user.name@example.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials) {
          return null;
        }

        const { email, password } = credentials;
        const username = email.substring(0, email.lastIndexOf("@"));

        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const res = await fetch(`${env.TLDAP_API_URL}/auth/token`, {
          method: "POST",
          body: formData,
        });

        if (res.status === 401) {
          throw new Error("Invalid Credentials");
        }
        if (res.status === 500) {
          throw new Error("Unexpected error on TLDAP_API");
        }

        // register user in database
        const userInDb = await prisma.user.findUnique({
          where: { email },
        });

        if (!userInDb) {
          const newUser = await prisma.user.create({
            data: {
              name: username,
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
    strategy: "jwt",
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "sftp",
            hostname: env.STORAGE_API_URL.split("//")[1],
            path: "/ibira",
            username: user.name,
            password: user.password,
          }),
        });

        const resCookie = res.headers.get("set-cookie");
        const authCookie = resCookie?.split(";")[0];
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

        // Request SFTP
        const sftp = await connection.requestSFTP();

        const mkdir = promisify(
          (path: string, callback: (err: Error | null | undefined) => void) =>
            sftp.mkdir(path, callback),
        );

        // Create the .ssh directory if it doesn't exist
        try {
          await mkdir(".ssh");
        } catch (err) {
          const error = err as ErrnoException;
          if (error.code !== 4) {
            throw new Error(
              `Failed to create remote .ssh directory: ${error.message}`,
            );
          }
        }

        // Read the authorized_keys file
        const readFile = promisify(
          (
            path: string,
            callback: (err: Error | undefined, handle: Buffer) => void,
          ) => sftp.readFile(path, callback),
        );

        let keys = "";
        try {
          const buffer = await readFile(".ssh/authorized_keys");
          keys = buffer.toString().trim();
        } catch (err) {
          const error = err as ErrnoException;
          if (error.code !== 2) {
            throw new Error(
              `Failed to read authorized_keys file: ${error.message}`,
            );
          }
        }

        //generate new key pair
        const pair = await keygen({
          // sshKeygenPath: 'ssh-keygen',
          // location: path.join(homedir(), '.ssh', `${comment}_rsa`),
          type: "rsa",
          read: true,
          force: true,
          destroy: false,
          comment: comment,
          password: env.PRIVATE_KEY_PASSPHRASE,
          size: "2048",
          format: "PEM",
        });

        // replace old key with new one
        const newKeys = keys
          .split("\n")
          .filter((key) => !key.includes(comment))
          .concat(pair.pubKey)
          .join("\n");

        const writeFile = promisify(
          (
            path: string,
            data: string,
            callback: (error: Error | null | undefined) => void,
          ) => sftp.writeFile(path, data, callback),
        );
        try {
          await writeFile(".ssh/authorized_keys", newKeys);
        } catch (err) {
          if (err instanceof Error) {
            throw new Error(`Failed to update authorized keys: ${err.message}`);
          }
        }

        token.privateKey = pair.key;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  theme: {
    colorScheme: "auto", // "auto" | "dark" | "light"
    brandColor: "", // Hex color code
    logo: "/logo.svg", // Absolute URL to image
    buttonText: "", // Hex color code
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
