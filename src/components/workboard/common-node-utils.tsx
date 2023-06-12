import React from 'react';
import { type StateValue } from 'xstate';

function SwitchBackground({
  state,
  children,
}: {
  state: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-state={state}
      className="flex-1 
    data-[state=active]:bg-green-100 data-[state=busy]:bg-yellow-100
    data-[state=error]:bg-red-100 data-[state=inactive]:bg-gray-100
    data-[state=success]:bg-blue-100 data-[state=active]:dark:bg-green-700
    data-[state=busy]:dark:bg-yellow-700 data-[state=error]:dark:bg-red-700
    data-[state=inactive]:dark:bg-muted data-[state=success]:dark:bg-blue-700
  "
    >
      {children}
    </div>
  );
}

export function NodeWrapper({
  label,
  state,
  children,
}: {
  label: string;
  state: StateValue;
  children: React.ReactNode;
}) {
  const nstate = typeof state === 'object' ? 'busy' : state;
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-slate-300 shadow active:border-slate-800 dark:border-slate-500 dark:active:border-slate-100">
      <div className="border-b border-slate-300  px-2 py-1 text-center font-mono text-xs uppercase dark:border-slate-500">
        {label}
      </div>
      <SwitchBackground state={nstate}>{children}</SwitchBackground>
    </div>
  );
}
