import { type ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { AlertTriangleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';

export function ActiveSheet(props: {
  selected: boolean;
  title: string;
  children: ReactNode;
}) {
  const { selected, title, children } = props;

  return (
    <Sheet open={selected} modal={false}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

interface BusySheet {
  selected: boolean;
  title: string;
  jobId?: string;
  jobStatus?: string;
  updatedAt?: string;
  message?: string;
  handleCancel: () => void;
}

export function BusySheet(props: BusySheet) {
  const {
    selected,
    title,
    jobId,
    jobStatus,
    updatedAt,
    message,
    handleCancel,
  } = props;

  return (
    <Sheet open={selected} modal={false}>
      <SheetContent className="flex flex-col gap-4">
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 rounded-md border border-input p-2 font-mono">
          <div className="flex flex-row items-center justify-between gap-1">
            <p className="font-medium">id</p>
            <p className="text-violet-600">{jobId}</p>
          </div>
          <div className="flex flex-row items-center justify-between gap-1">
            <p className="font-medium">status</p>
            <p className="lowercase text-violet-600">{jobStatus}</p>
          </div>
          <div className="flex flex-row items-center justify-between gap-1">
            <p className="font-medium">updated at</p>
            <p className="text-end text-violet-600">{updatedAt}</p>
          </div>
        </div>
        <hr />
        <Button onClick={handleCancel}>cancel</Button>
      </SheetContent>
    </Sheet>
  );
}

interface ErrorSheetProps {
  selected: boolean;
  message?: string;
  children: ReactNode;
}

export function ErrorSheet(props: ErrorSheetProps) {
  const { selected, message, children } = props;
  // TODO: Add a view logs action in this component, that will read the proper error log file
  // using the filesystem API and displayng it as an infinite scrollable modal or another page

  return (
    <Sheet open={selected} modal={false}>
      <SheetContent className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {message || 'Something went wrong'}
          </AlertDescription>
        </Alert>
        <SheetHeader>
          <SheetTitle>Retry</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

interface SuccessSheetProps {
  selected: boolean;
  message?: string;
  children: ReactNode;
}

export function SuccessSheet(props: SuccessSheetProps) {
  const { selected, message, children } = props;

  return (
    <Sheet open={selected} modal={false}>
      <SheetContent className="flex flex-col gap-4">
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            {message || 'Operation successful'}
          </AlertDescription>
        </Alert>
        <SheetHeader>
          <SheetTitle>Details</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
