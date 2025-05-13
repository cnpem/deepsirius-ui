import { cva } from "class-variance-authority";
import { Badge } from "~/components/ui/badge";
import { type NodeStatus } from "~/hooks/use-store";
import { cn } from "~/lib/utils";

const nodeStatusBadgeVariants = cva("", {
  variants: {
    status: {
      active: "bg-green-500 hover:bg-green-600",
      busy: "bg-yellow-500 hover:bg-yellow-600",
      error: "bg-red-500 hover:bg-red-600",
      success: "bg-blue-500 hover:bg-blue-600",
    },
  },
});

export function StatusBadge({
  status,
  className,
}: {
  status: NodeStatus | undefined;
  className?: string;
}) {
  if (!status) return null;
  return (
    <Badge
      className={cn(
        "mx-1 rounded-full text-xs font-semibold",
        nodeStatusBadgeVariants({
          status,
        }),
        className,
      )}
    >
      {status}
    </Badge>
  );
}
