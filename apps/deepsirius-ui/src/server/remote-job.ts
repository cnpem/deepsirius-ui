import fs from "fs";
import os, { homedir } from "os";
import path from "path";
import keygen from "ssh-keygen-lite";

// Function to create a temporary script file with sbatch content
export function createTempScript(sbatchContent: string) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deepsirius-"));
  const scriptPath = path.join(tempDir, "temp_script.sbatch");
  fs.writeFileSync(scriptPath, sbatchContent, { mode: "0700" });
  return { tempDir, scriptPath };
}

export function generateKeyPairPromise({
  comment,
  passphrase,
}: {
  comment: string;
  passphrase: string;
}) {
  return keygen({
    // sshKeygenPath: 'ssh-keygen',
    location: path.join(homedir(), ".ssh", `${comment}_rsa`),
    type: "rsa",
    read: true,
    force: true,
    destroy: false,
    comment: comment,
    password: passphrase,
    size: "2048",
    format: "PEM",
  });
}

export interface ErrnoException extends Error {
  errno?: number;
  code?: number | string;
  path?: string;
  syscall?: string;
  stack?: string;
}
