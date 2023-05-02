import { exec } from "child_process";
import { existsSync, readFileSync } from "fs";
import { Client, type ConnectConfig } from "ssh2";

/**
 * Generate an SSH key if it does not exist at the given path
 * @param path Path to the SSH key
 */
export async function generateSshKeyIfNeeded(path: string): Promise<void> {
  if (!existsSync(path)) {
    const command = `ssh-keygen -t rsa -b 4096 -f ${path}`;
    await executeCommand(command);
  }
}

/**
 * Copy SSH key to remote host
 * @param keyPath Path to the SSH key
 * @param username Username on the remote host
 * @param host Hostname or IP address of the remote host
 * @param password Password to use for the SSH connection
 */
export async function copySshKeyToRemoteHost(
  keyPath: string,
  username: string,
  host: string,
  password: string
): Promise<void> {
  const sshOptions: ConnectConfig = {
    host,
    port: 22,
    username,
    password,
    tryKeyboard: true,
    algorithms: {
      kex: [
        "diffie-hellman-group1-sha1",
        "diffie-hellman-group14-sha1",
        "diffie-hellman-group-exchange-sha1",
        "diffie-hellman-group-exchange-sha256",
      ],
    },
  };

  const conn = new Client();
  await new Promise<void>((resolve, reject) => {
    conn.on("error", reject);
    conn.on("ready", resolve);
    conn.connect(sshOptions);
  });

  const sftpPromise = new Promise<void>((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) {
        reject(err);
        return;
      }

      sftp.fastPut(`${keyPath}.pub`, ".remotejob", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

  await sftpPromise;
  conn.end();
  await sshConnectAndRunCommand(
    { password },
    username,
    host,
    "echo $(cat .remotejob) >> .ssh/authorized_keys && rm .remotejob"
  );
}

/**
 * Connect to remote host using SSH key and run a command
 * @param keyPath Path to the SSH key
 * @param username Username on the remote host
 * @param host Hostname or IP address of the remote host
 * @param command Command to execute on the remote host
 * @returns Output of the command
 */
export async function sshConnectAndRunCommand(
  { keyPath, password }: { keyPath?: string; password?: string },
  username: string,
  host: string,
  command: string
): Promise<string> {
  const sshOptions: ConnectConfig = {
    host,
    port: 22,
    username,
    privateKey: keyPath ? readFileSync(keyPath) : undefined,
    password: password ? password : undefined,
    tryKeyboard: true,
    algorithms: {
      kex: [
        "diffie-hellman-group1-sha1",
        "diffie-hellman-group14-sha1",
        "diffie-hellman-group-exchange-sha1",
        "diffie-hellman-group-exchange-sha256",
      ],
    },
  };

  const conn = new Client();
  await new Promise<void>((resolve, reject) => {
    conn.on("error", reject);
    conn.on("ready", resolve);
    conn.connect(sshOptions);
  });

  const execPromise = new Promise<string>((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = "";
      stream.on("data", (data: string) => {
        output += data;
      });

      stream.on("exit", (code: number) => {
        conn.end();
        if (code !== 0) {
          reject(new Error(`Command failed with exit code ${code}`));
        } else {
          resolve(output);
        }
      });
    });
  });

  const output = await execPromise;
  return output;
}

/**
 * Execute a shell command and return its output
 * @param command The command to execute
 */
async function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}
