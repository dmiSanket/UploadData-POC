import React from "react";

interface StepActionsProps {
  /** Left-aligned secondary action, e.g. Back. */
  back?: React.ReactNode;
  children: React.ReactNode;
  /** Text shown next to the primary action on wider screens. */
  hint?: React.ReactNode;
}

/** Step footer: stacks full-width on mobile (primary first), spreads out on desktop. */
export function StepActions({ back, children, hint }: StepActionsProps) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="[&>button]:w-full sm:[&>button]:w-auto">{back}</div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {hint && <span className="text-center text-xs text-zinc-500 sm:text-right">{hint}</span>}
        <div className="[&>button]:w-full sm:[&>button]:w-auto">{children}</div>
      </div>
    </div>
  );
}

