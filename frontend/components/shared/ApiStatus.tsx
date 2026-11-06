"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { apiRequest } from "@/lib/services/apiClient";

type Status = "checking" | "online" | "offline";

const STATUS_COPY: Record<Status, { text: string; dot: string }> = {
  checking: { text: "Checking API…", dot: "bg-zinc-500" },
  online: { text: "API connected", dot: "bg-emerald-400" },
  offline: { text: "API unreachable", dot: "bg-rose-400" },
};

/** Small live indicator for the standalone backend service. */
export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    const check = () =>
      apiRequest("/health")
        .then(() => !cancelled && setStatus("online"))
        .catch(() => !cancelled && setStatus("offline"));

    void check();
    const timer = window.setInterval(check, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const { text, dot } = STATUS_COPY[status];
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-300">
      <span className="relative flex h-2 w-2">
        {status === "online" && (
          <span className={clsx("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", dot)} />
        )}
        <span className={clsx("relative inline-flex h-2 w-2 rounded-full", dot)} />
      </span>
      {text}
    </div>
  );
}

