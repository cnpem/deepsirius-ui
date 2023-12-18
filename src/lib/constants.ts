export const slurmPartitionOptions = [
  'cpu',
  'mnc',
  'imb',
  'mgn',
  'cnb',
  'cat',
  'ipe',
  'diff',
  'proc2',
  'proc1',
  'tepui',
  'petro',
  'power',
  'fake',
] as const;

export const slurmGPUOptions = ['1', '2', '4'] as const;
