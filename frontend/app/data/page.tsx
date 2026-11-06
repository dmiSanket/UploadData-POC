import { DataExplorer } from "@/components/explorer/DataExplorer";
import { PageHeader } from "@/components/shared/PageHeader";

export default function DataExplorerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Database Explorer"
        title="Ingested Data & SQL Tables"
        description="Inspect uploaded batches, browse validated JSONB rows stored in PostgreSQL, and review the relational database schema."
      />
      <DataExplorer />
    </>
  );
}

