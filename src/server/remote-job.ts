import { exec } from 'child_process';
import fs from 'fs';
import { type Config, NodeSSH } from 'node-ssh';
import os, { homedir } from 'os';
import path from 'path';
import { Client } from 'ssh2';
import keygen from 'ssh-keygen-lite';

/**
 * Connect to remote host using SSH key and run a command
 * @param keyPath Path to the SSH key
 * @param username Username on the remote host
 * @param host Hostname or IP address of the remote host
 * @param command Command to execute on the remote host
 * @returns Output of the command
 */
export function sshConnectAndRunCommand(
  { privateKey, password }: { privateKey?: string; password?: string },
  username: string,
  host: string,
  command: string,
  passphrase?: string,
): Promise<string> {
  const sshOptions: Config = {
    debug: console.log,
    host,
    port: 22,
    username,
    privateKey: privateKey ? privateKey : undefined,
    password: password ? password : undefined,
    passphrase: passphrase ? passphrase : undefined,
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
  privateKey: string,
  passphrase: string,
  username: string,
  host: string,
  jobId: string,
) {
  const command = `sacct -j ${jobId}.batch --format=State --parsable2`;

  return new Promise<string | undefined>((resolve, reject) => {
    sshConnectAndRunCommand(
      {
        privateKey: privateKey,
        password: undefined,
      },
      username,
      host,
      command,
      passphrase,
    )
      .then((output) => {
        // The output of the sacct command comes in two lines, the first line is the header and the second is the actual state: i.e. State\nRUNNING, State\nCOMPLETED, etc.
        const lines = output.trim().split('\n');
        const state = lines[1];
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
  privateKey: string,
  passphrase: string,
  username: string,
  host: string,
  jobId: string,
) {
  return new Promise<string | undefined>((resolve, reject) => {
    const command = `scancel ${jobId}`;
    sshConnectAndRunCommand(
      {
        privateKey: privateKey,
        password: undefined,
      },
      username,
      host,
      command,
      passphrase,
    )
      .then(() => {
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
  privateKey: string,
  passphrase: string,
  username: string,
  host: string,
  sbatchContent: string,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const { tempDir, scriptPath } = createTempScript(sbatchContent);
    const sshOptions: Config = {
      debug: console.log,
      host,
      port: 22,
      username,
      privateKey: privateKey,
      // privateKeyPath: path.join(__dirname, 'foo_rsa'),
      passphrase: passphrase,
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

export function generateKeyPairPromise({
  comment,
  passphrase,
}: {
  comment: string;
  passphrase: string;
}) {
  return keygen({
    // sshKeygenPath: 'ssh-keygen',
    location: path.join(homedir(), '.ssh', `${comment}_rsa`),
    type: 'rsa',
    read: true,
    force: true,
    destroy: false,
    comment: comment,
    password: passphrase,
    size: '2048',
    format: 'PEM',
  });
}

export interface ErrnoException extends Error {
  errno?: number;
  code?: number | string;
  path?: string;
  syscall?: string;
  stack?: string;
}

type SFTPCallback = ErrnoException | null | undefined;

export function copyPublicKeyToRemote(
  publicKey: string,
  username: string,
  host: string,
  password: string,
) {
  const conn = new Client();
  const sshOptions: Config = {
    host,
    port: 22,
    username,
    password,
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

  return new Promise((resolve, reject) => {
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          console.error('Error creating SFTP connection:', err);
          conn.end();
          return;
        }

        // Create the .ssh directory if it doesn't exist
        const remoteSshDir = '.ssh';
        sftp.mkdir(remoteSshDir, { mode: 0o700 }, (mkdirErr: SFTPCallback) => {
          if (mkdirErr && mkdirErr.code !== 4) {
            // Error code 4 means the directory already exists, ignore in that case
            console.error('Error creating .ssh directory:', mkdirErr);
            conn.end();
            return;
          }
        });

        const remoteFilePath = `${remoteSshDir}/authorized_keys`;

        // Read the existing content of authorized_keys (if it exists)
        sftp.readFile(
          remoteFilePath,
          'utf-8',
          (readErr: SFTPCallback, existingKeys) => {
            if (readErr && readErr.code !== 2) {
              // Error code 2 means the file does not exist, ignore in that case
              console.error('Error reading existing authorized_keys:', readErr);
              conn.end();
              return;
            }

            // Check if the public key already exists in the file
            if (existingKeys && existingKeys.includes(publicKey)) {
              console.log(
                'Public key already exists in authorized_keys. Skipping...',
              );
              conn.end();
              return;
            }

            // Append the new public key to the existing content (if any)
            const updatedKeys = existingKeys
              ? existingKeys.toString() + '\n' + publicKey
              : publicKey;

            // Write the updated content back to the file
            sftp.writeFile(remoteFilePath, updatedKeys, (writeErr) => {
              if (writeErr) {
                console.error(
                  'Error writing public key to remote host:',
                  writeErr,
                );
              } else {
                console.log('Public key copied to remote host successfully!');
              }

              conn.end();
              resolve('success');
            });
          },
        );
      });
    });

    conn.on('error', (err) => {
      console.error('SSH connection error:', err);
      reject(err);
    });

    conn.connect(sshOptions);
  });
}

export function removePublicKeyByComment(
  username: string,
  host: string,
  password: string,
  comment: string,
) {
  console.log('removePublicKeyByComment');
  const conn = new Client();
  const sshOptions: Config = {
    host,
    port: 22,
    username,
    password,
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
  return new Promise((resolve, reject) => {
    conn.on('ready', () => {
      console.log('ready');
      conn.sftp((err, sftp) => {
        if (err) {
          // this is problematic when we try to connect to localhost in the development environment
          console.error('Error creating SFTP connection:', err);
          conn.end();
          return;
        }

        const remoteSshDir = '.ssh';
        const remoteFilePath = `${remoteSshDir}/authorized_keys`;

        // Read the existing content of authorized_keys (if it exists)
        sftp.readFile(
          remoteFilePath,
          'utf-8',
          (readErr: SFTPCallback, existingKeys) => {
            if (readErr && readErr.code !== 2) {
              // Error code 2 means the file does not exist, ignore in that case
              console.error('Error reading existing authorized_keys:', readErr);
              conn.end();
              return;
            }

            // Filter out the keys with the desired comment
            const updatedKeys = existingKeys
              ? existingKeys
                  .toString()
                  .split('\n')
                  .filter((keyLine) => !keyLine.includes(` ${comment}`))
                  .join('\n')
              : '';

            // Write the updated content back to the file
            sftp.writeFile(remoteFilePath, updatedKeys, (writeErr) => {
              if (writeErr) {
                console.error(
                  'Error removing public key from authorized_keys:',
                  writeErr,
                );
              } else {
                console.log(
                  'Public key removed from authorized_keys successfully!',
                );
              }

              conn.end();
              resolve('success');
            });
          },
        );
      });
    });

    conn.on('error', (err) => {
      console.error('SSH connection error:', err);
      reject(err);
    });

    conn.connect(sshOptions);
  });
}

export function removeRemoteFiles(
  privateKey: string,
  passphrase: string,
  username: string,
  host: string,
  path: string,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const sshOptions: Config = {
      debug: console.log,
      host,
      port: 22,
      username,
      privateKey: privateKey,
      passphrase: passphrase,
    };
    const conn = new NodeSSH();
    conn
      .connect(sshOptions)
      .then(() => {
        executeCommand(`rm -rf ${path}`)
          .then(() => {
            resolve('success');
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

export function readRemoteFile(
  privateKey: string,
  passphrase: string,
  username: string,
  host: string,
  path: string,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const sshOptions: Config = {
      debug: console.log,
      host,
      port: 22,
      username,
      privateKey: privateKey,
      passphrase: passphrase,
    };
    const conn = new NodeSSH();
    conn
      .connect(sshOptions)
      .then(() => {
        console.log('readRemoteFile: connected and trying to read', path);
        executeCommand(`cat ${path}`)
          .then((output) => {
            resolve(output);
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
