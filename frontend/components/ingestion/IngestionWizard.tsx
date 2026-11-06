"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert } from "@/components/shared/Alert";
import { Stepper } from "@/components/shared/Stepper";
import { useComputedColumns } from "@/hooks/useComputedColumns";
import { useFileSchema } from "@/hooks/useFileSchema";
import { useRowFilters } from "@/hooks/useRowFilters";
import type {
  ColumnInput,
  DefaultValuesDictionary,
  MappingDictionary,
  MappingPersistenceMode,
  ParsedSpreadsheet,
} from "@/lib/types";
import { missingRequired } from "@/lib/utils/autoMap";
import { resolveSavedMapping } from "@/lib/utils/savedMapping";
import { ComputedColumnsPanel } from "./ComputedColumnsPanel";
import { ContextStep, type SelectedContext } from "./ContextStep";
import { MappingStep } from "./MappingStep";
import { RowFiltersPanel } from "./RowFiltersPanel";
import { SubmitStep } from "./SubmitStep";
import { UploadStep, type SavedMappingBannerInfo } from "./UploadStep";

const STEPS = ["Select context", "Upload file", "Map columns", "Preview & submit"];

export function IngestionWizard() {
  const [step, setStep] = useState(0);
  const [context, setContext] = useState<SelectedContext | null>(null);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [mapping, setMapping] = useState<MappingDictionary>({});
  const [defaultValues, setDefaultValues] = useState<DefaultValuesDictionary>({});
  const [addedSystemColumns, setAddedSystemColumns] = useState<string[]>([]);
  const [persistenceMode, setPersistenceMode] = useState<MappingPersistenceMode>("save");
  const [appliedFromDb, setAppliedFromDb] = useState(false);
  const [restoredCounts, setRestoredCounts] = useState({
    mapped: 0,
    computed: 0,
    defaults: 0,
  });

  // Column rules + saved mapping are fetched from the API for the chosen category + scope.
  const { schema, loading, error, reload, saveMapping, addColumn } = useFileSchema(
    context?.categoryId ?? null,
    context?.scopeId ?? null,
  );

  const updateMapping = useCallback(
    (update: (current: MappingDictionary) => MappingDictionary) => setMapping(update),
    [],
  );
  // 1) Append any calculated columns to the uploaded file.
  const calculated = useComputedColumns(parsed, updateMapping);
  const withComputed = calculated.effective;
  // 2) Filter rows by any single-column or combined-column multi-select filters.
  const rowFilters = useRowFilters(withComputed);
  const effective = rowFilters.filtered;
  const calculatedNames = calculated.computed.map((column) => column.name.trim());

  const handleContext = (next: SelectedContext) => {
    const changed = next.categoryId !== context?.categoryId || next.scopeId !== context?.scopeId;
    if (changed) {
      setMapping({});
      setDefaultValues({});
      setAddedSystemColumns([]);
      setAppliedFromDb(false);
    }
    setContext(next);
    setStep(1);
  };

  const handleParsed = (next: ParsedSpreadsheet | null) => {
    setParsed(next);
    rowFilters.reset();

    if (!next || !schema) {
      setMapping({});
      setDefaultValues({});
      calculated.reset();
      setAppliedFromDb(false);
      return;
    }

    // Automatically apply saved scope mapping & calculated columns from PostgreSQL if available
    const resolved = resolveSavedMapping(next, schema.columns, schema.savedMapping);
    calculated.setAll(resolved.computedColumns);
    setMapping(resolved.mapping);
    setDefaultValues(resolved.defaultValues);
    setAppliedFromDb(resolved.appliedFromDb);
    setRestoredCounts({
      mapped: resolved.restoredMappedCount,
      computed: resolved.restoredComputedCount,
      defaults: resolved.restoredDefaultCount,
    });
  };

  const restart = () => {
    setContext(null);
    setParsed(null);
    setMapping({});
    setDefaultValues({});
    setAddedSystemColumns([]);
    setAppliedFromDb(false);
    calculated.reset();
    rowFilters.reset();
    setStep(0);
  };

  const onMappingChange = useCallback((next: MappingDictionary) => setMapping(next), []);
  const onDefaultValuesChange = useCallback(
    (next: DefaultValuesDictionary) => setDefaultValues(next),
    [],
  );

  const handleSaveMappingNow = useCallback(async () => {
    return saveMapping({
      mapping,
      defaultValues,
      computedColumns: calculated.computed,
    });
  }, [saveMapping, mapping, defaultValues, calculated.computed]);

  const handleAddSystemColumn = useCallback(
    async (
      input: ColumnInput,
      mappedHeader: string,
      defaultValue: string,
    ): Promise<string | null> => {
      const err = await addColumn(input);
      if (err) return err;

      setAddedSystemColumns((prev) =>
        prev.includes(input.columnName) ? prev : [...prev, input.columnName],
      );
      setMapping((prev) => ({ ...prev, [input.columnName]: mappedHeader }));
      if (defaultValue) {
        setDefaultValues((prev) => ({ ...prev, [input.columnName]: defaultValue }));
      }
      return null;
    },
    [addColumn],
  );

  const savedMappingInfo: SavedMappingBannerInfo | null = useMemo(() => {
    if (!appliedFromDb || !schema) return null;
    const missing = missingRequired(schema.columns, mapping, defaultValues);
    return {
      appliedFromDb: true,
      restoredMappedCount: restoredCounts.mapped,
      restoredComputedCount: restoredCounts.computed,
      restoredDefaultCount: restoredCounts.defaults,
      canSkipToSubmit: missing.length === 0,
    };
  }, [appliedFromDb, schema, mapping, defaultValues, restoredCounts]);

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} current={step} />

      {step === 0 && <ContextStep initial={context} onNext={handleContext} />}

      {step === 1 && (
        <UploadStep
          parsed={parsed}
          previewData={effective}
          calculatedNames={calculatedNames}
          savedMappingInfo={savedMappingInfo}
          onParsed={handleParsed}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
          onSkipToSubmit={() => setStep(3)}
        >
          {withComputed && effective && (
            <>
              <ComputedColumnsPanel
                parsed={withComputed}
                computed={calculated.computed}
                targets={schema?.columns ?? []}
                onAdd={calculated.add}
                onRemove={calculated.remove}
              />
              <RowFiltersPanel
                source={withComputed}
                filtered={effective}
                filters={rowFilters.filters}
                calculatedNames={calculatedNames}
                onAddFilter={rowFilters.addFilter}
                onToggleValue={rowFilters.toggleValue}
                onSetValues={rowFilters.setSelectedValues}
                onRemoveFilter={rowFilters.removeFilter}
                onReset={rowFilters.reset}
              />
            </>
          )}
        </UploadStep>
      )}

      {step === 2 && effective && (
        <MappingStep
          schema={schema}
          schemaLoading={loading}
          schemaError={error}
          parsed={effective}
          mapping={mapping}
          defaultValues={defaultValues}
          addedSystemColumns={addedSystemColumns}
          calculatedNames={calculatedNames}
          persistenceMode={persistenceMode}
          appliedFromDb={appliedFromDb}
          onPersistenceModeChange={setPersistenceMode}
          onSaveMappingNow={handleSaveMappingNow}
          onMappingChange={onMappingChange}
          onDefaultValuesChange={onDefaultValuesChange}
          onAddSystemColumn={handleAddSystemColumn}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && effective && schema && (
        <SubmitStep
          schema={schema}
          parsed={effective}
          totalUploadedRows={parsed?.rows.length}
          mapping={mapping}
          defaultValues={defaultValues}
          computed={calculated.computed}
          filters={rowFilters.filters}
          addedSystemColumns={addedSystemColumns}
          persistenceMode={persistenceMode}
          onPersistenceModeChange={setPersistenceMode}
          onSavedMappingSuccess={() => void reload()}
          onBack={() => setStep(2)}
          onRestart={restart}
        />
      )}

      {step >= 2 && !parsed && <Alert tone="error">Please upload a file first.</Alert>}
    </div>
  );
}
