import { DynamicFieldData } from '~/components/ui/dynamic-forms/dynamic-control-types';

type Unet2D = {
  name: 'unet2D';
  patchSizes: {
    xy: '448²' | '512²' | '627²' | '896²' | '1120²';
  };
};

type Unet3D = {
  name: 'unet2D';
  patchSizes: {
    xyz: '96³' | '128³' | '512³';
  };
};

type Vnet = {
  name: 'unet2D';
  patchSizes: {
    xy: '32²' | '64²' | '128²' | '256²' | '512²';
    z: '16' | '32' | '64' | '128' | '256' | '512';
  };
};

export type NetworkType = 'Unet2D' | 'Unet3D' | 'Vnet';

export type NetworkParams = {
  label: string;
  networkType: NetworkType;
  trainingParams: {
    batchSize: number;
    iterations: number;
    epochs: number;
    learningRate: number;
    optimizer: 'Adam' | 'Gradient Descent';
    lossFunction: 'Cross Entropy' | 'Dice' | 'Cross Entropy + Dice';
  };
  jobParams: {
    GPUs: '1' | '2' | '4';
  };
};

export const networkFormData: DynamicFieldData[] = [
  {
    fieldName: 'NetworkType',
    label: 'Network Type',
    inputType: 'radio',
    options: [
      { value: 'unet2D', label: 'unet2D' },
      { value: 'unet3D', label: 'unet3D' },
      { value: 'vnet', label: 'vnet' },
    ],
    defaultValue: 'unet2D',
  },
  {
    fieldName: 'NetworkName',
    label: 'NetworkName',
    inputType: 'text',
    defaultValue: '',
  },
  {
    fieldName: 'BatchSize',
    label: 'Batch Size',
    inputType: 'number',
    defaultValue: 1,
  },
  {
    fieldName: 'Iterations',
    label: 'Iterations',
    inputType: 'number',
    defaultValue: 1,
  },
  {
    fieldName: 'Epochs',
    label: 'Epochs',
    inputType: 'number',
    defaultValue: 1,
  },
  {
    fieldName: 'LearningRate',
    label: 'Learning Rate',
    inputType: 'number',
    defaultValue: 1,
  },
  {
    fieldName: 'Optimizer',
    label: 'Optimizer',
    inputType: 'radio',
    options: [
      { value: 'Adam', label: 'Adam' },
      { value: 'Gradient Descent', label: 'Gradient Descent' },
    ],
    defaultValue: 'Adam',
  },
  {
    fieldName: 'LossFunction',
    label: 'Loss Function',
    inputType: 'radio',
    options: [
      { value: 'CrossEntrypy', label: 'Cross Entrypy' },
      { value: 'Dice', label: 'Dice' },
    ],
    defaultValue: 'CrossEntrypy',
  },
  {
    fieldName: 'GPUSs',
    label: 'GPUs',
    inputType: 'radio',
    options: [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '4', label: '4' },
    ],
    defaultValue: '1',
  },
];
