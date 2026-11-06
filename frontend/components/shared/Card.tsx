import React from "react";
import clsx from "clsx";

interface CardProps {
  /** Small Figma-style frame name shown above the card. */
  label?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** A white "frame" sitting on the canvas. */
export function Card({
  label,
  title,
  description,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: CardProps) {
  return (
    <section className={clsx("animate-rise", className)}>
      {label && (
        <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-medium tracking-wide text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-sm bg-brand-500" aria-hidden />
          {label}
        </p>
      )}
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-frame">
        {(title || actions) && (
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              {icon && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  {icon}
                </span>
              )}
              <div className="min-w-0">
                {title && <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>}
                {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
              </div>
            </div>
            {actions}
          </header>
        )}
        <div className={clsx("p-4 sm:p-6", bodyClassName)}>{children}</div>
      </div>
    </section>
  );
}
