export const slurmPartitionOptions = [
  'cpu',
  'mnc',
  'imb',
  'mgn',
  'mgn-staff',
  'cnb',
  'cat',
  'ipe',
  'diff',
  'tepui1',
  'tepui2',
  'dev',
  'power',
  // 'fake',
] as const;

export const slurmGPUOptions = ['1', '2', '4'] as const;

export const checkStatusRefetchInterval = 30000; // 30 seconds
