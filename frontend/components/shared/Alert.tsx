import React from "react";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type Tone = "error" | "success" | "info";

interface AlertProps {
  tone: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

const TONES: Record<Tone, { box: string; icon: React.ReactNode }> = {
  error: {
    box: "border-rose-200 bg-rose-50 text-rose-900",
    icon: <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />,
  },
  info: {
    box: "border-sky-200 bg-sky-50 text-sky-900",
    icon: <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />,
  },
};

export function Alert({ tone, title, children, className }: AlertProps) {
  const { box, icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx("animate-fade-in flex gap-2.5 rounded-xl border p-3 text-sm", box, className)}
    >
      {icon}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
    </div>
  );
}
