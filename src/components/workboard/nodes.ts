import { type Node } from 'reactflow';

// TODO: make this sizes to be related to the sizes defined on the component styles
export const customGrid = {
  plusOne: { x: 0, y: 0 },
};

// the nodeof type 'new' doesn't have use for this custom data fields
export type NodeData = {
  workspacePath?: string;
  label?: string;
  xState?: string;
};

export default [
  {
    id: '0',
    position: { x: customGrid.plusOne.x, y: customGrid.plusOne.y },
    type: 'new',
  },
] as Node<NodeData>[];
