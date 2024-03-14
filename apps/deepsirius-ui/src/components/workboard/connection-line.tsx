import { type ConnectionLineComponentProps } from 'reactflow';

/**
 * Custom connection line component that renders an animated cubic bezier curve following the edge path.
 * This component is only rendered before the connection is completed.
 * After that the line that represents the connection is rendered by the Edge component.
 * @param props: ConnectionLineComponentProps
 * @returns JSX.Element - Renders a cubic bezier curve animated following the edge path
 */
export default function CustomConnectionLine(
  props: ConnectionLineComponentProps,
): JSX.Element {
  const { fromX, fromY, toX, toY } = props;
  return (
    <g>
      {/* renders a cubic bezier curve animated following the edge path */}
      <path
        className="animated react-flow__connection-path"
        d={`M${fromX} ${fromY} S ${fromX} ${toY} ${toX} ${toY}`}
      />
      {/* renders a small circle at the end of the path */}
      <circle className="dark:fill-white" cx={toX} cy={toY} r={4} />
      <circle className="fill-green-400" cx={toX} cy={toY} r={3} />
    </g>
  );
}
