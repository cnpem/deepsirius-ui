import type { LucideProps } from "lucide-react";
import {
  BrainCircuitIcon,
  DatabaseIcon,
  DatabaseZapIcon,
  GoalIcon,
  ImagesIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

interface NodeIconProps extends Omit<LucideProps, "ref"> {
  nodeType: string;
}
export default function NodeIcon({
  nodeType,
  className,
  ...props
}: NodeIconProps) {
  switch (nodeType) {
    case "dataset":
      return (
        <DatabaseIcon className={cn("inline-block", className)} {...props} />
      );
    case "augmentation":
      return (
        <DatabaseZapIcon className={cn("inline-block", className)} {...props} />
      );
    case "network":
      return (
        <BrainCircuitIcon
          className={cn("inline-block", className)}
          {...props}
        />
      );
    case "finetune":
      return <GoalIcon className={cn("inline-block", className)} {...props} />;
    case "inference":
      return (
        <ImagesIcon className={cn("inline-block", className)} {...props} />
      );
    default:
      return <></>;
  }
}
