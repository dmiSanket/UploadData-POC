"use client";

import { useState } from "react";
import { Building2, FolderTree, Layers, MapPin, SlidersHorizontal, Tag, Tags } from "lucide-react";
import { SegmentedTabs, type TabItem } from "@/components/shared/SegmentedTabs";
import { useCatalog } from "@/hooks/useCatalog";
import { useScopes } from "@/hooks/useScopes";
import { CatalogPanel } from "./CatalogPanel";
import { ScopeBuilderPanel } from "./ScopeBuilderPanel";
import { SchemaWorkspace } from "./SchemaWorkspace";

type AdminTab = "schemas" | "scopes" | "catalog";

const TABS: TabItem<AdminTab>[] = [
  { id: "schemas", label: "Schemas", icon: <Layers className="h-4 w-4" aria-hidden /> },
  {
    id: "scopes",
    label: "Scope Builder (Dealers · Locations · Brands)",
    icon: <SlidersHorizontal className="h-4 w-4" aria-hidden />,
  },
  { id: "catalog", label: "Master Data", icon: <Tags className="h-4 w-4" aria-hidden /> },
];

/** Owns the catalog and scope state so every tab stays synchronized. */
export function AdminWorkspace() {
  const categories = useCatalog("categories");
  const dealers = useCatalog("dealers");
  const locations = useCatalog("locations");
  const brands = useCatalog("brands");
  const scopesState = useScopes();
  const [tab, setTab] = useState<AdminTab>("schemas");

  return (
    <div className="space-y-6">
      <SegmentedTabs
        label="Admin sections"
        tabs={TABS}
        value={tab}
        onChange={(next) => {
          setTab(next);
          void scopesState.reload();
        }}
      />

      {tab === "schemas" && (
        <SchemaWorkspace
          categories={categories}
          scopesState={scopesState}
          dealers={dealers}
          locations={locations}
          brands={brands}
        />
      )}

      {tab === "scopes" && (
        <ScopeBuilderPanel
          scopesState={scopesState}
          dealers={dealers}
          locations={locations}
          brands={brands}
        />
      )}

      {tab === "catalog" && (
        <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
          <CatalogPanel
            catalog={categories}
            label="Document types"
            icon={<FolderTree className="h-4 w-4" />}
            title="Categories"
            description="Core business documents, e.g. PO Order, OOQ, SOQ, MRN, STN."
            placeholder="e.g. MRN"
          />
          <CatalogPanel
            catalog={dealers}
            label="Dealer master"
            icon={<Building2 className="h-4 w-4" />}
            title="Dealers"
            description="Specific dealer entities, e.g. Apex Motors, Metro Auto Group."
            placeholder="e.g. Horizon Motors"
          />
          <CatalogPanel
            catalog={locations}
            label="Location master"
            icon={<MapPin className="h-4 w-4" />}
            title="Locations"
            description="Specific regions, hubs or warehouses, e.g. Mumbai - West, Delhi NCR."
            placeholder="e.g. Ahmedabad Hub"
          />
          <CatalogPanel
            catalog={brands}
            label="Brand master"
            icon={<Tag className="h-4 w-4" />}
            title="Brands"
            description="Specific OEM / product brands, e.g. Toyota, Hyundai, Tata Motors."
            placeholder="e.g. Maruti Suzuki"
          />
        </div>
      )}
    </div>
  );
}
