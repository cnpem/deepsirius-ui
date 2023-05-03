import { exec } from "child_process";
import { existsSync } from "fs";
import { NodeSSH, type Config } from "node-ssh";

/**
 * Generate an SSH key if it does not exist at the given path
 * @param path Path to the SSH key
 */
export async function generateSshKeyIfNeeded(path: string): Promise<void> {
  if (!existsSync(path)) {
    console.log("generating ssh key");
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
export function copySshKeyToRemoteHost(
  keyPath: string,
  username: string,
  host: string,
  password: string
): void {
  const sshOptions: Config = {
    host,
    port: 22,
    username,
    privateKeyPath: keyPath,
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

  const conn = new NodeSSH();
  conn
    .connect(sshOptions)
    .then(() => {
      console.log("connected");
      return;
    })
    .catch((err) => {
      console.log(err);
      sshOptions.privateKeyPath = undefined;
      sshOptions.password = password;
      conn
        .connect(sshOptions)
        .then(() => {
          conn
            .putFile(`${keyPath}.pub`, ".remotejob")
            .then(() => {
              console.log("copied key");
              conn
                .execCommand(
                  `echo $(cat .remotejob) >> .ssh/authorized_keys && rm .remotejob`
                )
                .then(() => {
                  console.log("added key to authorized_keys");
                  conn.dispose();
                  return;
                })
                .catch((err) => {
                  console.log(err);
                  conn.dispose();
                  return;
                });
            })
            .catch((err) => {
              console.log(err);
              conn.dispose();
              return;
            });
        })
        .catch((err) => {
          console.log(err);
          conn.dispose();
          return;
        });
    });
}

/**
 * Connect to remote host using SSH key and run a command
 * @param keyPath Path to the SSH key
 * @param username Username on the remote host
 * @param host Hostname or IP address of the remote host
 * @param command Command to execute on the remote host
 * @returns Output of the command
 */
export function sshConnectAndRunCommand(
  { keyPath, password }: { keyPath?: string; password?: string },
  username: string,
  host: string,
  command: string
): void {
  const sshOptions: Config = {
    host,
    port: 22,
    username,
    privateKey: keyPath ? keyPath : undefined,
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

  const conn = new NodeSSH();
  conn
    .connect(sshOptions)
    .then(() => {
      console.log("connected");
      conn
        .execCommand(command)
        .then((result) => {
          console.log(result);
          conn.dispose();
        })
        .catch((err) => {
          console.log(err);
          conn.dispose();
        });
    })
    .catch((err) => {
      console.log(err);
      conn.dispose();
    });
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
