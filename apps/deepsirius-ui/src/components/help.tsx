import { ExternalLinkIcon } from 'lucide-react';
import NodeIcon from './workboard/node-components/node-icon';
import Link from 'next/link';
import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { ControlButton } from 'reactflow';
import { cn } from '~/lib/utils';

import { buttonVariants } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

function ExternalLinks() {
  return (
    <div className="flex flex-row items-start justify-between gap-1">
      <Link
        className={cn(buttonVariants({ variant: 'outline' }), '')}
        href="https://deepsirius.lnls.br/dive"
        rel="noopener noreferrer"
        target="_blank"
        title="help"
      >
        Documentation
        <ExternalLinkIcon className="ml-1" size={16} />
      </Link>
      <p className="mt-1 text-xl text-input"> | </p>
      <Link
        className={cn(buttonVariants({ variant: 'outline' }), '')}
        href="https://github.com/cnpem/deepsirius-ui/issues"
        rel="noopener noreferrer"
        target="_blank"
        title="help"
      >
        Report an issue
        <ExternalLinkIcon className="ml-1" size={16} />
      </Link>
    </div>
  );
}

function MinimapCaption() {
  const nodeColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'busy':
        return '#FFC107';
      case 'error':
        return '#F44336';
      case 'success':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };
  return (
    <>
      <p className="text-sm font-semibold">Minimap</p>
      <div className="flex flex-row items-center justify-between gap-1 rounded-md border border-input p-2">
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-1">
            <NodeIcon nodeType="dataset" className="h-4 w-4" />
            <p className="text-xs">Dataset</p>
          </div>
          <div className="flex flex-row items-center gap-1">
            <NodeIcon nodeType="augmentation" className="h-4 w-4" />
            <p className="text-xs">Augmentation</p>
          </div>
          <div className="flex flex-row items-center gap-1">
            <NodeIcon nodeType="network" className="h-4 w-4" />
            <p className="text-xs">Network</p>
          </div>
          <div className="flex flex-row items-center gap-1">
            <NodeIcon nodeType="inference" className="h-4 w-4" />
            <p className="text-xs">Inference</p>
          </div>
          <div className="flex flex-row items-center gap-1">
            <NodeIcon nodeType="finetune" className="h-4 w-4" />
            <p className="text-xs">Finetune</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-1">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: nodeColor('active') }}
            />
            <p className="text-xs">Active</p>
          </div>
          <div className="flex flex-row items-center gap-1">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: nodeColor('busy') }}
            />
            <p className="text-xs">Busy</p>
          </div>
          <div className="flex flex-row items-center gap-1">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: nodeColor('error') }}
            />
            <p className="text-xs">Error</p>
          </div>
        </div>
      </div>
    </>
  );
}

function KeyboardShortcuts() {
  return (
    <>
      <p className="text-sm font-semibold">Keyboard shortcuts</p>
      <div className="flex flex-col gap-2 rounded-md border border-input p-2">
        <div className="flex flex-row items-center justify-between gap-1">
          <p className="text-sm">Pan</p>
          <div className="flex flex-row items-center gap-1">
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              Drag
            </kbd>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-1">
          <p className="text-sm">Zoom</p>
          <div className="flex flex-row items-center gap-1">
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              Scroll
            </kbd>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-1">
          <p className="text-sm">Help</p>
          <div className="flex flex-row items-center gap-1">
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              H
            </kbd>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-1">
          <p className="text-sm">Toggle Theme</p>
          <div className="flex flex-row items-center gap-1">
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              Shift
            </kbd>
            <p className="text-xs">+</p>
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              Alt
            </kbd>
            <p className="text-xs">+</p>
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              D
            </kbd>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-1">
          <p className="text-sm">Sign in/out</p>
          <div className="flex flex-row items-center gap-1">
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              Shift
            </kbd>
            <p className="text-xs">+</p>
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              Alt
            </kbd>
            <p className="text-xs">+</p>
            <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
              L
            </kbd>
          </div>
        </div>
      </div>
    </>
  );
}

export function ControlHelpButton() {
  const [open, setOpen] = useState(false);
  useHotkeys('h', () => setOpen((s) => !s));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger hidden />
      <ControlButton
        title="need help?"
        className="font-medium dark:text-slate-400 dark:hover:text-slate-100"
        onClick={() => setOpen(true)}
      >
        ?
      </ControlButton>
      <DialogContent className="sm:w-full sm:max-w-[425px]" forceMount>
        <DialogHeader>
          <DialogTitle>
            <div className="flex flex-row items-center gap-2">
              <p>Help</p>
              <div className="flex flex-row items-center gap-1">
                <kbd className="rounded-sm bg-violet-200 px-2 py-1 text-xs dark:bg-violet-700">
                  H
                </kbd>
              </div>
            </div>
          </DialogTitle>
          <div className="flex flex-col gap-4">
            <ExternalLinks />
            <KeyboardShortcuts />
            <MinimapCaption />
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
