import * as React from "react";
import { cn } from "@/app/lib/utils";

type ProsConsProps = {
  pros: string[];
  cons: string[];
  className?: string;
};
const ProsAndConsTable = React.forwardRef<HTMLTableElement, ProsConsProps>(
  ({ pros, cons, className }, ref) => {
    const maxRows = Math.max(pros.length, cons.length);
    return (
      <table ref={ref} className={cn("w-full table-fixed", className)}>
        <thead>
          <tr>
            <th>Pros</th>
            <th>Cons</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, index) => (
            <tr key={index} className="flex-wrap">
              <td className="text-wrap">{pros[index]}</td>
              <td className="text-wrap">{cons[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
);

export { ProsAndConsTable };
