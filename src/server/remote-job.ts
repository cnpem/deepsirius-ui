import { Client } from "ssh2";
import { getToken } from "next-auth/jwt";

export function connect(hostname: string, username: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      console.log(`SSH connection established to ${hostname}`);
      conn.end();
      resolve(`SSH connection established to ${hostname}`);
    }).on('error', (err) => {
      console.error(`Error connecting to ${hostname}: ${err}`);
      reject(err);
    }).connect({
      host: hostname,
      port: 22,
      username,
      password,
    });
  });
}
