import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toUnixPath(path: string) {
  return path.replace(/[\\/]+/g, '/').replace(/^([a-zA-Z]+:|\.\/)/, '');
}

export function defaultSlurmLogPath({
  workspacePath,
  jobId,
  jobName,
}: {
  workspacePath: string;
  jobId?: string;
  jobName?: string;
}) {
  const baseLogPath = `${workspacePath}/logs`;
  // 'log-%j-%x' is the default pattern for slurm log files
  const filePath = `${baseLogPath}/${jobId || '%j'}-${jobName || '%x'}`;
  return {
    base: baseLogPath,
    out: `${filePath}.out`,
    err: `${filePath}.err`,
  };
}
