import { type Node } from 'reactflow';

export default [
  {
    id: '1',
    position: { x: 200, y: 400 },
    data: { more: 'Im number 1' },
    type: 'dataset',
  },
  {
    id: '2',
    position: { x: 400, y: 400 },
    data: { more: 'Im number 2' },
    type: 'network',
  },
  {
    id: '3',
    position: { x: 800, y: 400 },
    data: { more: 'Im number 3' },
    type: 'inference',
  },
] as Node[];
