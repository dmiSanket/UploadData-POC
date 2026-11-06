import React from "react";
import clsx from "clsx";
import { Building2, MapPin, Tag } from "lucide-react";
import type { ScopeEntity } from "@/lib/types";

interface ScopePillsProps {
  scope: Pick<ScopeEntity, "dealers" | "locations" | "brands">;
  compact?: boolean;
  className?: string;
}

/**
 * Renders color-coded Figma-style pills for the specific Dealers, Locations,
 * and Brands included in a Scope.
 */
export function ScopePills({ scope, compact = false, className }: ScopePillsProps) {
  const pillClass = compact
    ? "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset"
    : "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

  return (
    <div className={clsx("flex flex-wrap items-center gap-1.5", className)}>
      {scope.dealers?.map((dealer) => (
        <span
          key={`d-${dealer.id}`}
          title={`Dealer: ${dealer.name}`}
          className={clsx(pillClass, "bg-brand-50 text-brand-700 ring-brand-200")}
        >
          <Building2 className="h-3 w-3 shrink-0 text-brand-500" aria-hidden />
          <span className="truncate max-w-40">{dealer.name}</span>
        </span>
      ))}

      {scope.locations?.map((location) => (
        <span
          key={`l-${location.id}`}
          title={`Location: ${location.name}`}
          className={clsx(pillClass, "bg-emerald-50 text-emerald-700 ring-emerald-200")}
        >
          <MapPin className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden />
          <span className="truncate max-w-40">{location.name}</span>
        </span>
      ))}

      {scope.brands?.map((brand) => (
        <span
          key={`b-${brand.id}`}
          title={`Brand: ${brand.name}`}
          className={clsx(pillClass, "bg-amber-50 text-amber-800 ring-amber-200")}
        >
          <Tag className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />
          <span className="truncate max-w-40">{brand.name}</span>
        </span>
      ))}
    </div>
  );
}

