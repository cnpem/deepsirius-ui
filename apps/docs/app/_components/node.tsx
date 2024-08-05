"use client";
import React, { useState } from "react";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./ui/card";
import { cva } from "class-variance-authority";

type Status = "active" | "busy" | "error" | "success";

const cardVariants = cva("h-[80px] w-[280px]", {
  variants: {
    status: {
      active:
        "border-green-800 bg-green-100 text-green-800 data-[selected=true]:border-green-500 dark:bg-muted dark:text-green-400",
      busy: "border-yellow-800 bg-yellow-100 text-yellow-800 data-[selected=true]:border-yellow-500 dark:bg-muted dark:text-yellow-400",
      error:
        "border-red-800 bg-red-100 text-red-800 data-[selected=true]:border-red-500 dark:bg-muted dark:text-red-400",
      success:
        "border-blue-800 bg-blue-100 text-blue-800 data-[selected=true]:border-blue-500 dark:bg-muted dark:text-blue-400",
    },
  },
  defaultVariants: {
    status: "active",
  },
});

const DatasetIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="lucide lucide-database"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
};

const AugmentationIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="lucide lucide-database-zap"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 15 21.84" />
      <path d="M21 5V8" />
      <path d="M21 12L18 17H22L19 22" />
      <path d="M3 12A9 3 0 0 0 14.59 14.87" />
    </svg>
  );
};

const NetworkIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="lucide lucide-brain-circuit"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M9 13a4.5 4.5 0 0 0 3-4" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M12 13h4" />
      <path d="M12 18h6a2 2 0 0 1 2 2v1" />
      <path d="M12 8h8" />
      <path d="M16 8V5a2 2 0 0 1 2-2" />
      <circle cx="16" cy="13" r=".5" />
      <circle cx="18" cy="3" r=".5" />
      <circle cx="20" cy="21" r=".5" />
      <circle cx="20" cy="8" r=".5" />
    </svg>
  );
};

const FinetuneIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="lucide lucide-goal"
    >
      <path d="M12 13V2l8 4-8 4" />
      <path d="M20.561 10.222a9 9 0 1 1-12.55-5.29" />
      <path d="M8.002 9.997a5 5 0 1 0 8.9 2.02" />
    </svg>
  );
};

const InferenceIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="lucide lucide-images"
    >
      <path d="M18 22H4a2 2 0 0 1-2-2V6" />
      <path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" />
      <circle cx="12" cy="8" r="2" />
      <rect width="16" height="16" x="6" y="2" rx="2" />
    </svg>
  );
};

type NodeCardProps = {
  name: string;
  status: Status;
  selected: boolean;
  onSelect: (selected: boolean) => void;
};

const NodeCard = ({ name, status, selected, onSelect }: NodeCardProps) => {
  return (
    <>
      <Card
        data-selected={selected}
        data-status={status}
        className={cn(cardVariants({ status }))}
        onClick={() => onSelect(!selected)}
      >
        <CardContent className="flex h-full flex-row items-center gap-4 p-4 cursor-pointer">
          <Icon name={name} />
          <div className="flex-1 space-y-1">
            <p
              className={cn(
                "text-sm font-medium leading-none",
                status === "active" && "text-green-800 dark:text-green-400",
                status === "busy" && "text-yellow-800 dark:text-yellow-400",
                status === "error" && "text-red-800 dark:text-red-400",
                status === "success" && "text-blue-800 dark:text-blue-400",
              )}
            >
              {name}
            </p>
            <p
              className={cn(
                "text-sm uppercase pb-4",
                status === "active" && "text-green-600 dark:text-green-500",
                status === "busy" && "text-yellow-600 dark:text-yellow-500",
                status === "error" && "text-red-600 dark:text-red-500",
                status === "success" && "text-blue-600 dark:text-blue-500",
              )}
            >
              {"message"}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const Icon = ({ name }: { name: string }) => {
  if (name === "dataset") {
    return <DatasetIcon />;
  }
  if (name === "augmentation") {
    return <AugmentationIcon />;
  }
  if (name === "network") {
    return <NetworkIcon />;
  }
  if (name === "finetune") {
    return <FinetuneIcon />;
  }
  if (name === "inference") {
    return <InferenceIcon />;
  }

  return null;
};

const Node = ({ name }: { name: string }) => {
  const [status, setStatus] = useState<Status>("active");
  const [selected, setSelected] = useState(false);
  const [selectedName, setSelectedName] = useState("dataset");
  const statuses: Status[] = ["active", "busy", "error", "success"];
  const names: string[] = [
    "dataset",
    "augmentation",
    "network",
    "finetune",
    "inference",
  ];
  return (
    <div className="p-8 min-h-80 border flex flex-col gap-4 rounded-lg items-center justify-center relative">
      <div className="flex flex-wrap gap-2 absolute left-4 top-4">
        {!name && (
          <>
            {"Type: "}
            {names.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedName(name)}
                data-selected={selectedName === name}
                className={
                  "px-2 rounded-full dark:hover:bg-gray-100/20 data-[selected=true]:dark:bg-gray-100/40 hover:bg-gray-700/20 data-[selected=true]:bg-gray-600/10"
                }
              >
                <Icon name={name} />
              </button>
            ))}
            {"Status: "}
          </>
        )}
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatus(status)}
            className={cn(
              "px-2 border rounded-full",
              status === "active" &&
                "border-green-800 text-green-600  bg-green-100 hover:bg-green-200 dark:bg-muted dark:text-green-400 dark:hover:bg-green-800",
              status === "busy" &&
                "border-yellow-800 text-yellow-600 bg-yellow-100 hover:bg-yellow-200 dark:bg-muted dark:text-yellow-400 dark:hover:bg-yellow-800",
              status === "error" &&
                "border-red-800 text-red-600 bg-red-100 hover:bg-red-200 dark:bg-muted dark:text-red-400 dark:hover:bg-red-800",
              status === "success" &&
                "border-blue-800 text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-muted dark:text-blue-400 dark:hover:bg-blue-800",
            )}
          >
            {status}
          </button>
        ))}
      </div>
      <NodeCard
        name={selectedName}
        status={status}
        selected={selected}
        onSelect={setSelected}
      />
    </div>
  );
};
export default Node;
