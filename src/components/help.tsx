import { Book, Bug, ExternalLink, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';

export function HelpDialog() {
  const [open, setOpen] = useState(false);
  useHotkeys('h', () => setOpen((s) => !s));
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    console.log(open);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size={'icon'} variant={'ghost'} title="need help?">
          <HelpCircle className="dark:text-slate-400 dark:hover:text-slate-100" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:w-full sm:max-w-[625px]" forceMount>
        <DialogHeader>
          <DialogTitle>Help</DialogTitle>
          <span className="w-full p-0.5 bg-muted"></span>
          <DialogDescription>
            <div className="flex flex-col gap-6">
              <div className="flex flex-row gap-2">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="/docs"
                  className="hover:underline"
                >
                  <Button variant={'outline'} className="relative">
                    <Book className="mr-2 w-4 h-4" />
                    <span>Documentation</span>
                  </Button>
                </a>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://lnls.atlassian.net/browse/SWC-3887"
                  className="hover:underline"
                >
                  <Button variant={'outline'} className="relative">
                    <Bug className="mr-2 w-4 h-4" />
                    <span>Report a bug</span>
                  </Button>
                </a>
              </div>

              {/* keyboard shortcuts */}
              <span className="text-lg font-semibold">Shortcuts</span>
              <div className="flex flex-row gap-2">
                <div className=" flex flex-col gap-1">
                  <div className="relative flex flex-col gap-2 border-2 rounded-sm p-6 min-w-[256px]">
                    <Label className="absolute rounded-full p-1 text-sm scale-75 -translate-y-4 border-2 inset-x-0 top-0 text-center bg-muted ">
                      Board
                    </Label>
                    <div className="flex justify-between">
                      <span className="text-purple-400 font-semibold">
                        {' '}
                        Pan{' '}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 border border-gray-400 rounded-md p-1 items-end justify-end">
                        Drag
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-purple-400 font-semibold">
                        {' '}
                        Zoom{' '}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 border border-gray-400 rounded-md p-1">
                        Scroll
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400 font-semibold">
                        {' '}
                        Select{' '}
                      </span>
                      <div className="flex flex-row gap-1">
                        <span className="ml-2 text-xs text-gray-400 border border-gray-400 rounded-md p-1">
                          Shift
                        </span>
                        <span className="text-xs text-gray-400 border border-gray-400 rounded-md p-1">
                          Drag
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className=" flex flex-col gap-1">
                  <div className="relative flex flex-col gap-2 border-2 rounded-sm p-6 min-w-[256px]">
                    <Label className="absolute rounded-full p-1 text-sm scale-75 -translate-y-4 border-2 inset-x-0 top-0 text-center bg-muted ">
                      Board
                    </Label>
                    <div className="flex justify-between">
                      <span className="text-purple-400 font-semibold">
                        {' '}
                        Pan{' '}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 border border-gray-400 rounded-md p-1 items-end justify-end">
                        Drag
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-purple-400 font-semibold">
                        {' '}
                        Zoom{' '}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 border border-gray-400 rounded-md p-1">
                        Scroll
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400 font-semibold">
                        {' '}
                        Select{' '}
                      </span>
                      <div className="flex flex-row gap-1">
                        <span className="ml-2 text-xs text-gray-400 border border-gray-400 rounded-md p-1">
                          Shift
                        </span>
                        <span className="text-xs text-gray-400 border border-gray-400 rounded-md p-1">
                          Drag
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
