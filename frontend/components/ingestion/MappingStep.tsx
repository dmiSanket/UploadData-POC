"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight, BookmarkCheck, GitCompareArrows, Wand2 } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import type {
  ColumnInput,
  DefaultValuesDictionary,
  FileSchemaDetail,
  MappingDictionary,
  MappingPersistenceMode,
  ParsedSpreadsheet,
} from "@/lib/types";
import { missingRequired, suggestMapping } from "@/lib/utils/autoMap";
import { MappingPersistenceControl } from "./MappingPersistenceControl";
import { MappingRow } from "./MappingRow";
import { NewSystemColumnPanel } from "./NewSystemColumnPanel";
import { StepActions } from "./StepActions";

interface MappingStepProps {
  schema: FileSchemaDetail | null;
  schemaLoading: boolean;
  schemaError: string | null;
  parsed: ParsedSpreadsheet;
  mapping: MappingDictionary;
  defaultValues: DefaultValuesDictionary;
  addedSystemColumns?: string[];
  calculatedNames?: string[];
  persistenceMode: MappingPersistenceMode;
  appliedFromDb?: boolean;
  onPersistenceModeChange: (mode: MappingPersistenceMode) => void;
  onSaveMappingNow: () => Promise<boolean>;
  onMappingChange: (mapping: MappingDictionary) => void;
  onDefaultValuesChange: (defaultValues: DefaultValuesDictionary) => void;
  onAddSystemColumn: (
    input: ColumnInput,
    mappedHeader: string,
    defaultValue: string,
  ) => Promise<string | null>;
  onBack: () => void;
  onNext: () => void;
}

export function MappingStep({
  schema,
  schemaLoading,
  schemaError,
  parsed,
  mapping,
  defaultValues,
  addedSystemColumns = [],
  calculatedNames = [],
  persistenceMode,
  appliedFromDb = false,
  onPersistenceModeChange,
  onSaveMappingNow,
  onMappingChange,
  onDefaultValuesChange,
  onAddSystemColumn,
  onBack,
  onNext,
}: MappingStepProps) {
  // Pre-fill obvious matches for columns that have no entry yet. Existing choices (for example a
  // calculated column or newly added system column) always win over the suggestion.
  useEffect(() => {
    if (!schema) return;
    const unmapped = schema.columns.some((column) => !(column.columnName in mapping));
    if (unmapped) {
      onMappingChange({ ...suggestMapping(schema.columns, parsed.headers), ...mapping });
    }
  }, [schema, parsed.headers, mapping, onMappingChange]);

  if (schemaLoading) {
    return (
      <Card label="Step 3" title="Loading column rules…">
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      </Card>
    );
  }

  const backButton = (
    <Button variant="secondary" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" aria-hidden /> Back
    </Button>
  );

  if (schemaError || !schema) {
    return (
      <Card label="Step 3" title="Map columns">
        <Alert tone="error">{schemaError ?? "No schema found for this selection."}</Alert>
        <StepActions back={backButton}>{null}</StepActions>
      </Card>
    );
  }

  const missing = missingRequired(schema.columns, mapping, defaultValues);
  const requiredTotal = schema.columns.filter((c) => c.isRequired).length;
  const requiredDone = requiredTotal - missing.length;
  const progress = requiredTotal === 0 ? 100 : Math.round((requiredDone / requiredTotal) * 100);

  const handleChange = (columnName: string, header: string) =>
    onMappingChange({ ...mapping, [columnName]: header });

  const handleDefaultChange = (columnName: string, defaultValue: string) =>
    onDefaultValuesChange({ ...defaultValues, [columnName]: defaultValue });

  return (
    <Card
      label="Step 3"
      icon={<GitCompareArrows className="h-4 w-4" />}
      title="Map columns & set default values"
      description={`Match each system column to a header from ${parsed.fileName}, assign a custom default value, or add a new system column. Fields marked * are mandatory.`}
      actions={
        <Button
          size="sm"
          variant="soft"
          onClick={() => onMappingChange(suggestMapping(schema.columns, parsed.headers))}
        >
          <Wand2 className="h-3.5 w-3.5" aria-hidden /> Auto-match
        </Button>
      }
    >
      <div className="mb-4 rounded-xl bg-zinc-50 p-3">
        {appliedFromDb && (
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <BookmarkCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Pre-filled automatically from saved database mapping for{" "}
              <strong>{schema.category.name} · {schema.scope.name}</strong>.
            </span>
          </p>
        )}
        <div className="mb-1.5 flex justify-between text-xs font-medium text-zinc-600">
          <span>Mandatory columns resolved (mapped or custom default)</span>
          <span>
            {requiredDone} / {requiredTotal}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="hidden grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1.25fr)] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 md:grid">
        <span>System column</span>
        <span />
        <span>Uploaded file header / Custom default value</span>
      </div>
      <ul className="divide-y divide-zinc-100">
        {schema.columns.map((column) => (
          <MappingRow
            key={column.id}
            column={column}
            headers={parsed.headers}
            selected={mapping[column.columnName] ?? ""}
            defaultValue={defaultValues[column.columnName] ?? ""}
            isNewColumn={addedSystemColumns.includes(column.columnName)}
            calculatedNames={calculatedNames}
            rows={parsed.rows}
            onChange={handleChange}
            onDefaultChange={handleDefaultChange}
          />
        ))}
      </ul>

      <NewSystemColumnPanel
        headers={parsed.headers}
        calculatedNames={calculatedNames}
        onAddColumn={onAddSystemColumn}
      />

      <MappingPersistenceControl
        mode={persistenceMode}
        hasExistingSavedMapping={Boolean(schema.savedMapping)}
        scopeName={`${schema.category.name} · ${schema.scope.name}`}
        onModeChange={onPersistenceModeChange}
        onSaveNow={onSaveMappingNow}
      />

      {missing.length > 0 && (
        <Alert tone="info" className="mt-4" title="Still to map or assign a default value">
          <span className="font-mono">{missing.join(", ")}</span>
        </Alert>
      )}

      <StepActions back={backButton}>
        <Button disabled={missing.length > 0} onClick={onNext}>
          Preview changes & data <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </StepActions>
    </Card>
  );
}
