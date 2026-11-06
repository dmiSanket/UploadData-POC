import React from "react";
import clsx from "clsx";
import type { DataType } from "@/lib/types";

interface BadgeProps {
  tone?: "neutral" | "required" | "optional" | "brand" | "emerald" | "amber";
  children: React.ReactNode;
  className?: string;
}

const TONES = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  required: "bg-rose-50 text-rose-700 ring-rose-200",
  optional: "bg-zinc-50 text-zinc-500 ring-zinc-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const TYPE_STYLES: Record<DataType, { chip: string; dot: string }> = {
  String: { chip: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  Number: { chip: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  Date: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  Boolean: { chip: "bg-pink-50 text-pink-700 ring-pink-200", dot: "bg-pink-500" },
};

/** Colour-coded data type chip (Figma-style property tag). */
export function DataTypeBadge({ dataType }: { dataType: DataType }) {
  const { chip, dot } = TYPE_STYLES[dataType];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        chip,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
      {dataType}
    </span>
  );
}
