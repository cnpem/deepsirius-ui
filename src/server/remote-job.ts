import { exec } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs';
import { type Config, NodeSSH } from 'node-ssh';
import os from 'os';
import path from 'path';

/**
 * Generate an SSH key if it does not exist at the given path
 * @param path Path to the SSH key
 */
export async function generateSshKeyIfNeeded(path: string): Promise<void> {
  if (!existsSync(path)) {
    const command = `ssh-keygen -t rsa -b 4096 -N "" -C "" -f ${path}`;
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
  password: string,
): void {
  const sshOptions: Config = {
    host,
    port: 22,
    username,
    privateKeyPath: keyPath,
    tryKeyboard: true,
    algorithms: {
      kex: [
        'diffie-hellman-group1-sha1',
        'diffie-hellman-group14-sha1',
        'diffie-hellman-group-exchange-sha1',
        'diffie-hellman-group-exchange-sha256',
      ],
    },
  };

  const conn = new NodeSSH();
  conn
    .connect(sshOptions)
    .then(() => {
      console.log('connected');
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
            .putFile(`${keyPath}.pub`, '.remotejob')
            .then(() => {
              console.log('copied key');
              conn
                .execCommand(
                  `echo $(cat .remotejob) >> .ssh/authorized_keys && rm .remotejob`,
                )
                .then(() => {
                  console.log('added key to authorized_keys');
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
  command: string,
): Promise<string> {
  const sshOptions: Config = {
    host,
    port: 22,
    username,
    privateKeyPath: keyPath ? keyPath : undefined,
    password: password ? password : undefined,
    tryKeyboard: true,
    algorithms: {
      kex: [
        'diffie-hellman-group1-sha1',
        'diffie-hellman-group14-sha1',
        'diffie-hellman-group-exchange-sha1',
        'diffie-hellman-group-exchange-sha256',
      ],
    },
  };

  const conn = new NodeSSH();
  return new Promise((resolve) => {
    void conn.connect(sshOptions).then(() => {
      // console.log('connected');
      void conn.execCommand(command).then((result) => {
        // console.log('STDOUT: ' + result.stdout);
        // console.log('STDERR: ' + result.stderr);
        resolve(result.stdout);
        conn.dispose();
      });
    });
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

// Function to listen to job state
export function checkJobState(
  keyPath: string,
  username: string,
  host: string,
  jobId: string,
) {
  const command = `sacct -j ${jobId} --format=State --parsable2`;

  return new Promise<string | undefined>((resolve, reject) => {
    sshConnectAndRunCommand(
      {
        keyPath: keyPath,
        password: undefined,
      },
      username,
      host,
      command,
    )
      .then((output) => {
        const lines = output.trim().split('\n');
        const state = lines[2];
        // console.log('Job state:', state);
        resolve(state);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

// Function to cancel a Slurm job
export function cancelJob(
  keyPath: string,
  username: string,
  host: string,
  jobId: string,
) {
  return new Promise<string | undefined>((resolve, reject) => {
    const command = `scancel ${jobId}`;
    sshConnectAndRunCommand(
      {
        keyPath: keyPath,
        password: undefined,
      },
      username,
      host,
      command,
    )
      .then(() => {
        // console.log({ jobId: jobId, status: 'CANCELLED' });
        resolve('CANCELLED');
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

// Function to create a temporary script file with sbatch content
function createTempScript(sbatchContent: string) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepsirius-'));
  const scriptPath = path.join(tempDir, 'temp_script.sbatch');
  fs.writeFileSync(scriptPath, sbatchContent, { mode: '0700' });
  return { tempDir, scriptPath };
}

// Function to submit an sbatch job with a temporary script file
export function submitJob(
  keyPath: string,
  username: string,
  host: string,
  sbatchContent: string,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const { tempDir, scriptPath } = createTempScript(sbatchContent);
    const sshOptions: Config = {
      host,
      port: 22,
      username,
      privateKeyPath: keyPath,
      tryKeyboard: true,
      algorithms: {
        kex: [
          'diffie-hellman-group1-sha1',
          'diffie-hellman-group14-sha1',
          'diffie-hellman-group-exchange-sha1',
          'diffie-hellman-group-exchange-sha256',
        ],
      },
    };

    const deepsirius_script = 'deepSirius_script.sbatch';
    const conn = new NodeSSH();
    conn
      .connect(sshOptions)
      .then(() => {
        conn
          .putFile(scriptPath, deepsirius_script)
          .then(() => {
            // console.log('copied script');
            executeCommand(`rm -rf ${tempDir}`)
              .then(() => {
                // console.log('removed script');
                conn
                  .execCommand(`sbatch --parsable ${deepsirius_script}`)
                  .then((result) => {
                    // console.log('STDOUT: ' + result.stdout);
                    // console.log('STDERR: ' + result.stderr);
                    const outputLines = result.stdout.trim().split('\n');
                    const jobId = outputLines[0];
                    resolve(jobId);
                    conn.dispose();
                  })
                  .catch((err) => {
                    console.log(err);
                    conn.dispose();
                  });
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

export const sbatchDummyContent = `#!/bin/bash
#SBATCH --job-name=deepsirius-ui
#SBATCH --output=output-do-pai.txt
#SBATCH --error=error-dos-outros.txt
#SBATCH --ntasks=1
#SBATCH --partition=dev-gcd


echo "Hello, world!"
sleep 10
echo "Job completed."`;
