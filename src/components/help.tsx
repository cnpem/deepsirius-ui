import { Book, Bug, HelpCircle } from 'lucide-react';
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

function WorkboardShortcuts() {
  const shortcuts = [
    {
      key: 'H',
      description: 'Help',
    },
    {
      key: 'Drag',
      description: 'Pan',
    },
    {
      key: 'Scroll',
      description: 'Zoom',
    },
    {
      key: 'Shift+Drag',
      description: 'Group Selection',
    },
    {
      key: 'Shift+Alt+D',
      description: 'Toggle Theme',
    },
  ];
  return (
    <div>
      <div className="relative flex flex-col gap-2 border-2 rounded-sm p-6 min-w-[256px] divide-y divide-muted divide-dashed">
        <Label className="absolute rounded-full p-1 text-sm scale-75 -translate-y-4 border-2 inset-x-0 top-0 text-center bg-muted ">
          View
        </Label>
        {shortcuts
          .filter((s) => s.key !== 'H')
          .map((shortcut) => (
            <div className="flex justify-between" key={shortcut.key}>
              <span className="text-blue-600 dark:text-blue-200 font-semibold">
                {shortcut.description}
              </span>
              <div className="flex flex-row gap-1">
                {shortcut.key.split('+').map((key) => (
                  <span
                    key={key}
                    className="mt-1 text-xs text-blue-600 border-0 bg-sky-200 dark:bg-sky-700 dark:text-blue-200 rounded-md px-2 py-1"
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function NodeCaption() {
  // handmade array to represent the nodes
  const array = new Array(25).fill('');
  array[8] = 'network';
  array[12] = 'dataset';
  array[21] = 'inference';
  return (
    <div className="flex flex-col gap-2">
      <span className="text-lg font-semibold">Minimap</span>
      <div className="flex flex-row gap-2">
        <div className="border bg-slate-200 dark:bg-slate-400 h-32">
          <div className="border bg-muted w-32 h-16 mt-8 mx-1 object-center">
            <div className="grid grid-cols-5 gap-1">
              {array.map((_, i) =>
                array[i] === 'network' ? (
                  <div
                    key={i}
                    className="col-span-2 row-span-3 p-1 m-1 bg-[#3162c4]"
                  />
                ) : array[i] === 'dataset' ? (
                  <div
                    key={i}
                    className="col-span-2 row-span-3 p-1 m-1 bg-[#6ede87]"
                  />
                ) : array[i] === 'inference' ? (
                  <div
                    key={i}
                    className="col-span-2 row-span-3 p-1 m-1 bg-[#eb870e]"
                  />
                ) : (
                  <div key={i} />
                ),
              )}
            </div>
          </div>
        </div>
        <div className="border-0 rounded-sm h-32 w-36 p-6 bg-muted">
          <div className="flex flex-col gap-2">
            <div>
              <div className="w-6 h-4 bg-[#3162c4] inline-block mr-2 translate-y-0.5" />
              <span className="text-md font-semibold text-[#3162c4]">
                Network
              </span>
            </div>
            <div>
              <div className="w-6 h-4 bg-[#6ede87] inline-block mr-2 translate-y-0.5" />
              <span className="text-md font-semibold text-[#6ede87]">
                Dataset
              </span>
            </div>
            <div>
              <div className="w-6 h-4 bg-[#eb870e] inline-block mr-2 translate-y-0.5" />
              <span className="text-md font-semibold text-[#eb870e]">
                Inference
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExternalLinks() {
  return (
    <div className="flex flex-row gap-2">
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="/docs"
        className="hover:underline"
      >
        <Button variant={'outline'}>
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
        <Button variant={'outline'}>
          <Bug className="mr-2 w-4 h-4" />
          <span>Report a bug</span>
        </Button>
      </a>
    </div>
  );
}

export function HelpDialog() {
  const [open, setOpen] = useState(false);
  useHotkeys('h', () => setOpen((s) => !s));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={'icon'} variant={'ghost'} title="need help?">
          <HelpCircle className="dark:text-slate-400 dark:hover:text-slate-100" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:w-full sm:max-w-[625px]" forceMount>
        <DialogHeader>
          <DialogTitle>
            Help{' '}
            <span className="ml-2 text-xs text-blue-600 border-0 bg-sky-200 dark:bg-sky-700 dark:text-blue-200 rounded-md px-2 py-1 ">
              H
            </span>
          </DialogTitle>
          <span className="w-full p-0.5 bg-muted"></span>
          <DialogDescription>
            <div className="flex flex-col gap-6">
              <ExternalLinks />
              <NodeCaption />
              <span className="text-lg font-semibold">Shortcuts</span>
              <div className="grid grid-cols-2 gap-4">
                <WorkboardShortcuts />
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
