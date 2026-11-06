"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Database, Layers, LayoutDashboard, Settings2, UploadCloud, X } from "lucide-react";
import { ApiStatus } from "./ApiStatus";

const LINKS = [
  { href: "/", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/upload", label: "Upload data", Icon: UploadCloud, exact: false },
  { href: "/data", label: "Data & Tables", Icon: Database, exact: false },
  { href: "/admin", label: "Admin", Icon: Settings2, exact: false },
];

interface SidebarProps {
  /** Called after navigation / on the close button (used by the mobile drawer). */
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-zinc-300">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <Link href="/" onClick={onClose} className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-accent shadow-lg shadow-brand-500/30">
            <Layers className="h-5 w-5 text-white" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-white">Ingestion</span>
            <span className="block text-[11px] text-zinc-500">Schema & mapping POC</span>
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 px-3 py-2">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Workspace
        </p>
        <ul className="space-y-1">
          {LINKS.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                  )}
                >
                  <Icon
                    className={clsx("h-4 w-4", active ? "text-brand-300" : "text-zinc-500 group-hover:text-zinc-300")}
                    aria-hidden
                  />
                  {label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4">
        <ApiStatus />
      </div>
    </div>
  );
}

