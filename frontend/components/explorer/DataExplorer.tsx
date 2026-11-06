"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Code2,
  Database,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Table2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Badge, DataTypeBadge } from "@/components/shared/Badge";
import { Button, IconButton } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScopePills } from "@/components/shared/ScopePills";
import { SegmentedTabs, type TabItem } from "@/components/shared/SegmentedTabs";
import { ingestionService } from "@/lib/services/ingestionService";
import type { IngestedBatchRecord, IngestedDataRow } from "@/lib/types";

type ExplorerTab = "batches" | "tables";

const TABS: TabItem<ExplorerTab>[] = [
  {
    id: "batches",
    label: "Ingested Data & Batches",
    icon: <Table2 className="h-4 w-4" aria-hidden />,
  },
  {
    id: "tables",
    label: "SQL Tables & Schema Structure",
    icon: <Database className="h-4 w-4" aria-hidden />,
  },
];

const SQL_TABLES = [
  {
    name: "Category",
    purpose: "Core document types (e.g. PO Order, OOQ, SOQ, MRN, STN)",
    columns: "id (PK), name (UK), createdAt",
  },
  {
    name: "Dealer / Location / Brand",
    purpose: "Master target entities joined many-to-many with Scope",
    columns: "id (PK), name (UK), createdAt",
  },
  {
    name: "Scope",
    purpose: "Combines 1 or multiple Dealers, Locations, and/or Brands",
    columns: "id (PK), name (UK), dealers[], locations[], brands[]",
  },
  {
    name: "FileSchema",
    purpose: "Unique pair of Category + Scope",
    columns: "id (PK), categoryId (FK), scopeId (FK)",
  },
  {
    name: "ColumnDefinition",
    purpose: "Dynamic column rules (no runtime CREATE TABLE DDL)",
    columns: "id (PK), fileSchemaId (FK), columnName, dataType, isRequired, validationRules (JSONB)",
  },
  {
    name: "IngestedBatch",
    purpose: "Tracks each file upload event",
    columns: "id (PK), fileSchemaId (FK), uploadDate, uploadedBy, fileName, rowCount",
  },
  {
    name: "IngestedData",
    purpose: "Validated spreadsheet rows stored as binary JSONB",
    columns: "id (PK), batchId (FK), rowNumber, rowData (JSONB)",
  },
];

function formatCell(val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "true" : "false";
  return String(val);
}

export function DataExplorer() {
  const [tab, setTab] = useState<ExplorerTab>("batches");
  const [batches, setBatches] = useState<IngestedBatchRecord[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [rowsData, setRowsData] = useState<{
    batchId: number;
    rows: IngestedDataRow[];
    total: number;
  } | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IngestedBatchRecord | null>(null);

  // `loadingBatches` starts true, so the initial fetch needs no synchronous setState.
  const loadBatches = useCallback(async () => {
    try {
      const list = await ingestionService.listBatches();
      setBatches(list);
      setSelectedBatchId((current) => {
        if (list.some((b) => b.id === current)) return current;
        return list.length > 0 ? list[0].id : null;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load batches");
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  const refresh = () => {
    setLoadingBatches(true);
    void loadBatches();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    // Rows are only rendered while a batch is selected, so nothing to reset otherwise.
    if (selectedBatchId === null) return;
    let cancelled = false;
    ingestionService
      .getBatchRows(selectedBatchId, 200, 0)
      .then((res) => {
        if (!cancelled) setRowsData({ batchId: selectedBatchId, rows: res.rows, total: res.total });
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load rows"));
    return () => {
      cancelled = true;
    };
  }, [selectedBatchId]);

  // Derived from which batch the fetched rows belong to, so no loading flag is needed.
  const rows = rowsData?.batchId === selectedBatchId ? rowsData.rows : [];
  const totalRows = rowsData?.batchId === selectedBatchId ? rowsData.total : 0;
  const loadingRows = selectedBatchId !== null && rowsData?.batchId !== selectedBatchId;

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? null;

  // Determine columns to show: schema columns + any extra keys in rowData
  const columnNames = selectedBatch
    ? Array.from(
        new Set([
          ...selectedBatch.fileSchema.columns.map((c) => c.columnName),
          ...rows.flatMap((r) => Object.keys(r.rowData ?? {})),
        ]),
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs label="Explorer sections" tabs={TABS} value={tab} onChange={setTab} />
        <Button size="sm" variant="secondary" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {tab === "batches" && (
        <div className="grid gap-5 lg:grid-cols-[20rem_1fr] lg:items-start lg:gap-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-frame">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <FileSpreadsheet className="h-4 w-4 text-zinc-400" aria-hidden />
                Ingested Batches ({batches.length})
              </h2>
            </div>

            <div className="max-h-[34rem] overflow-y-auto p-2">
              {loadingBatches && <p className="p-3 text-sm text-zinc-500">Loading batches…</p>}
              {!loadingBatches && batches.length === 0 && (
                <EmptyState
                  icon={<UploadCloud className="h-5 w-5" />}
                  title="No uploaded batches yet"
                  description="Upload an Excel or CSV file to inspect its validated rows here."
                  action={
                    <Link
                      href="/upload"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-brand-500"
                    >
                      Upload a file
                    </Link>
                  }
                />
              )}

              <ul className="space-y-1.5">
                {batches.map((batch) => {
                  const active = batch.id === selectedBatchId;
                  return (
                    <li key={batch.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedBatchId(batch.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setSelectedBatchId(batch.id);
                        }}
                        className={clsx(
                          "cursor-pointer rounded-xl p-3 transition-colors",
                          active
                            ? "bg-accent/10 text-zinc-900 ring-1 ring-inset ring-accent/40"
                            : "text-zinc-700 hover:bg-zinc-50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                              #{batch.id} · {batch.fileName ?? "Upload"}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {batch.fileSchema.category.name} · {batch.rowCount} rows
                            </p>
                          </div>
                          <IconButton
                            aria-label={`Delete batch ${batch.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDelete(batch);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </IconButton>
                        </div>
                        <ScopePills scope={batch.fileSchema.scope} compact className="mt-2" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="min-w-0">
            {selectedBatch ? (
              <Card
                label={`PostgreSQL Table: IngestedData (batchId = ${selectedBatch.id})`}
                icon={<Table2 className="h-4 w-4" />}
                title={`${selectedBatch.fileSchema.category.name} · ${selectedBatch.fileSchema.scope.name}`}
                description={`Uploaded by ${selectedBatch.uploadedBy} on ${new Date(selectedBatch.uploadDate).toLocaleString()} · ${totalRows} stored rows`}
                actions={
                  <Button
                    size="sm"
                    variant={showRawJson ? "soft" : "secondary"}
                    onClick={() => setShowRawJson((v) => !v)}
                  >
                    <Code2 className="h-3.5 w-3.5" aria-hidden />
                    {showRawJson ? "Table view" : "Raw JSONB view"}
                  </Button>
                }
              >
                <div className="mb-4 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Target Scope (Dealers · Locations · Brands)
                  </p>
                  <ScopePills scope={selectedBatch.fileSchema.scope} />
                </div>

                {loadingRows ? (
                  <p className="text-sm text-zinc-500">Loading stored rows…</p>
                ) : showRawJson ? (
                  <pre className="max-h-[30rem] overflow-auto rounded-xl bg-zinc-900 p-4 font-mono text-xs text-zinc-100">
                    {JSON.stringify(rows, null, 2)}
                  </pre>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-200">
                    <table className="w-full min-w-max text-left text-sm">
                      <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        <tr>
                          <th className="px-3 py-2.5 text-zinc-400">Row #</th>
                          {columnNames.map((colName) => {
                            const colDef = selectedBatch.fileSchema.columns.find(
                              (c) => c.columnName === colName,
                            );
                            return (
                              <th key={colName} className="whitespace-nowrap px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs text-zinc-800">{colName}</span>
                                  {colDef && <DataTypeBadge dataType={colDef.dataType} />}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {rows.map((row) => (
                          <tr key={row.id} className="hover:bg-zinc-50/70">
                            <td className="px-3 py-2 tabular-nums text-zinc-400">{row.rowNumber}</td>
                            {columnNames.map((colName) => (
                              <td
                                key={colName}
                                className="max-w-60 truncate px-3 py-2 font-mono text-xs text-zinc-800"
                              >
                                {formatCell(row.rowData?.[colName])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : (
              <EmptyState
                icon={<Layers className="h-5 w-5" />}
                title="Select an ingested batch"
                description="Choose a batch on the left to inspect its validated rows stored in PostgreSQL."
              />
            )}
          </div>
        </div>
      )}

      {tab === "tables" && (
        <Card
          label="PostgreSQL Relational + JSONB Architecture"
          icon={<Database className="h-4 w-4" />}
          title="Database Tables (backend/prisma/schema.prisma)"
          description="All tables live in PostgreSQL (port 5433, database ingestion_poc). You can also browse them visually with npx prisma studio inside /backend."
        >
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5">SQL Table</th>
                  <th className="px-4 py-2.5">Key Columns</th>
                  <th className="px-4 py-2.5">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {SQL_TABLES.map((t) => (
                  <tr key={t.name}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-zinc-900">
                      <Badge tone="brand">{t.name}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">{t.columns}</td>
                    <td className="px-4 py-3 text-zinc-700">{t.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete batch #${pendingDelete?.id}?`}
        description="All stored rows in this batch will be permanently removed from IngestedData."
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) {
            await ingestionService.removeBatch(pendingDelete.id);
            setPendingDelete(null);
            await loadBatches();
          }
        }}
      />
    </div>
  );
}

