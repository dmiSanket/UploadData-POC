"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Database, ListChecks, Send } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Field, INPUT_CLASSES } from "@/components/shared/Field";
import { ScopePills } from "@/components/shared/ScopePills";
import { ingestionService } from "@/lib/services/ingestionService";
import type {
  ComputedColumn,
  DefaultValuesDictionary,
  FileSchemaDetail,
  IngestResult,
  MappingDictionary,
  MappingPersistenceMode,
  ParsedSpreadsheet,
  RowFilter,
} from "@/lib/types";
import { prepareIngestionPayload } from "@/lib/utils/prepareIngestionPayload";
import { ChangesSummaryPanel } from "./ChangesSummaryPanel";
import { InsertionPreviewTable } from "./InsertionPreviewTable";
import { MappingPersistenceControl } from "./MappingPersistenceControl";
import { StepActions } from "./StepActions";
import { ValidationErrorTable } from "./ValidationErrorTable";

interface SubmitStepProps {
  schema: FileSchemaDetail;
  parsed: ParsedSpreadsheet;
  totalUploadedRows?: number;
  mapping: MappingDictionary;
  defaultValues?: DefaultValuesDictionary;
  computed?: ComputedColumn[];
  filters?: RowFilter[];
  addedSystemColumns?: string[];
  persistenceMode: MappingPersistenceMode;
  onPersistenceModeChange: (mode: MappingPersistenceMode) => void;
  onSavedMappingSuccess?: () => void;
  onBack: () => void;
  onRestart: () => void;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}

export function SubmitStep({
  schema,
  parsed,
  totalUploadedRows,
  mapping,
  defaultValues = {},
  computed = [],
  filters = [],
  addedSystemColumns = [],
  persistenceMode,
  onPersistenceModeChange,
  onSavedMappingSuccess,
  onBack,
  onRestart,
}: SubmitStepProps) {
  const [uploadedBy, setUploadedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculatedNames = useMemo(() => computed.map((c) => c.name.trim()), [computed]);

  const prepared = useMemo(
    () =>
      prepareIngestionPayload(
        schema.columns,
        parsed,
        mapping,
        defaultValues,
        calculatedNames,
      ),
    [schema.columns, parsed, mapping, defaultValues, calculatedNames],
  );

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await ingestionService.submit({
        fileSchemaId: schema.id,
        mapping: prepared.mapping,
        rows: prepared.rows,
        rowNumbers: prepared.rowNumbers,
        fileName: parsed.fileName,
        uploadedBy: uploadedBy.trim() || "anonymous",
        ...(persistenceMode === "save"
          ? {
              savedMapping: {
                mapping,
                defaultValues,
                computedColumns: computed,
              },
            }
          : {}),
      });
      setResult(res);
      if (res.success && persistenceMode === "save") {
        onSavedMappingSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <Card label="Done">
        <div className="flex flex-col items-center px-2 py-6 text-center sm:py-10">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
            <CheckCircle2 className="h-9 w-9" aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-zinc-900">{result.rowsInserted} rows saved</h2>
          <p className="mt-1 max-w-md text-sm text-zinc-600">
            Batch #{result.batchId} from <span className="font-medium">{parsed.fileName}</span> passed
            validation and was stored.
            {persistenceMode === "save" && (
              <span className="mt-1 block font-medium text-emerald-700">
                Column mapping &amp; calculated columns saved in database for future uploads on this scope.
              </span>
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/data"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              <Database className="h-4 w-4 text-brand-600" aria-hidden /> View stored rows
            </Link>
            <Button onClick={onRestart}>Upload another file</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      label="Step 4"
      icon={<ListChecks className="h-4 w-4" />}
      title="Preview all changes & data to be inserted"
      description="Review the applied filters, calculated columns, custom default values, and exact rows before inserting into PostgreSQL."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Document" value={`${schema.category.name} · ${schema.scope.name}`} />
        <SummaryTile label="File" value={parsed.fileName} />
        <SummaryTile
          label="Rows to insert"
          value={
            totalUploadedRows !== undefined && totalUploadedRows !== parsed.rows.length
              ? `${parsed.rows.length} (filtered from ${totalUploadedRows})`
              : `${parsed.rows.length}`
          }
        />
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Target Scope (Dealers · Locations · Brands)
        </p>
        <ScopePills scope={schema.scope} />
      </div>

      <ChangesSummaryPanel
        columns={schema.columns}
        mapping={mapping}
        defaultValues={defaultValues}
        computed={computed}
        filters={filters}
        addedSystemColumns={addedSystemColumns}
        filteredRowCount={parsed.rows.length}
        totalUploadedRows={totalUploadedRows}
      />

      <InsertionPreviewTable
        columns={schema.columns}
        previewRows={prepared.previewRows}
        totalUploadedRows={totalUploadedRows}
      />

      <MappingPersistenceControl
        mode={persistenceMode}
        hasExistingSavedMapping={Boolean(schema.savedMapping)}
        scopeName={`${schema.category.name} · ${schema.scope.name}`}
        onModeChange={onPersistenceModeChange}
      />

      <Field label="Uploaded by" htmlFor="uploaded-by" className="mt-5 sm:max-w-sm">
        <input
          id="uploaded-by"
          className={INPUT_CLASSES}
          placeholder="Your name (optional)"
          value={uploadedBy}
          onChange={(e) => setUploadedBy(e.target.value)}
        />
      </Field>

      <div className="mt-5 space-y-3">
        {error && <Alert tone="error">{error}</Alert>}
        {result && !result.success && <ValidationErrorTable failure={result} />}
      </div>

      <StepActions
        back={
          <Button variant="secondary" onClick={onBack} disabled={submitting}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {result ? "Adjust mapping" : "Back"}
          </Button>
        }
      >
        <Button onClick={submit} loading={submitting}>
          <Send className="h-4 w-4" aria-hidden /> {result ? "Submit again" : "Submit & insert data"}
        </Button>
      </StepActions>
    </Card>
  );
}
