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
    console.log('generating ssh key');
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

// Function to listen to job state
export async function checkJobState(jobId: string) {
  try {
    const command = `sacct -j ${jobId} --format=State --parsable2`;

    const output = await executeCommand(command);
    const lines = output.split('\n');
    const state = lines[1]?.split('|')[0];

    return state;
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

// Function to cancel a Slurm job
export function cancelJob(jobId: string) {
  return new Promise((resolve, reject) => {
    const command = `scancel ${jobId}`;
    executeCommand(command)
      .then((output) => {
        resolve(output);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Function to create a temporary script file with sbatch content
function createTempScript(sbatchContent: string) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepsirius-'));
  const scriptPath = path.join(tempDir, 'temp_script.sbatch');
  fs.writeFileSync(scriptPath, sbatchContent, { mode: '0700' });
  return scriptPath;
}

type jobInfo = {
  jobId?: string;
  jobName?: string;
};
// Function to submit an sbatch job with a temporary script file
export function submitJob(sbatchContent: string): Promise<jobInfo> {
  return new Promise((resolve, reject) => {
    const scriptPath = createTempScript(sbatchContent);
    const command = `sbatch --parsable ${scriptPath}`;
    executeCommand(command)
      .then((output) => {
        const outputLines = output.split('\n');
        const jobId = outputLines[0];
        const jobName = outputLines[1];
        resolve({ jobId, jobName });
      })
      .catch((error) => {
        reject(error);
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
