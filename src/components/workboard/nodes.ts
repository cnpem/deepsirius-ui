import { type Node } from 'reactflow';

// TODO: make this sizes to be related to the sizes defined on the component styles
export const customGrid = {
  new: 800,
  dataset: 100,
  network: 600,
  inference: 1024,
  rowSpacing: 200,
};

export type NodeData = {
  label: string;
  xState: string;
};

export default [
  {
    id: '0',
    position: { x: customGrid.new, y: customGrid.rowSpacing },
    data: { label: '', xState: '' },
    type: 'new',
  },
  {
    id: '1',
    position: { x: customGrid.dataset, y: 0 },
    data: { label: 'New', xState: 'New' },
    type: 'dataset',
  },
  {
    id: '2',
    position: { x: customGrid.network, y: 0 },
    data: { label: 'New', xState: 'New' },
    type: 'network',
  },
  {
    id: '3',
    position: { x: customGrid.inference, y: 0 },
    data: { label: 'New', xState: 'New' },
    type: 'inference',
  },
] as Node<NodeData>[];
