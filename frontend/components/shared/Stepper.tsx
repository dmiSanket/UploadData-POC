import React from "react";
import clsx from "clsx";
import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  current: number;
}

/** Numbered progress with connectors. On small screens only the active label is shown. */
export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-frame sm:px-6">
      <ol className="flex items-center" aria-label="Progress">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const last = index === steps.length - 1;
          return (
            <React.Fragment key={label}>
              <li aria-current={active ? "step" : undefined} className="flex shrink-0 items-center gap-2.5">
                <span
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    done && "bg-emerald-500 text-white",
                    active && "bg-brand-600 text-white ring-4 ring-brand-100",
                    !done && !active && "bg-zinc-100 text-zinc-500",
                  )}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                </span>
                <span
                  className={clsx(
                    "text-sm font-medium",
                    active ? "inline text-zinc-900" : "hidden text-zinc-500 md:inline",
                  )}
                >
                  {label}
                </span>
              </li>
              {!last && (
                <span
                  aria-hidden
                  className={clsx(
                    "mx-2 h-0.5 min-w-3 flex-1 rounded-full transition-colors sm:mx-4",
                    done ? "bg-emerald-400" : "bg-zinc-200",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-zinc-500 md:hidden">
        Step {current + 1} of {steps.length}
      </p>
    </div>
  );
}
