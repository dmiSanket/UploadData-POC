"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, BookmarkCheck, FastForward, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button, IconButton } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import type { ParsedSpreadsheet } from "@/lib/types";
import { ACCEPTED_EXTENSIONS, parseSpreadsheet } from "@/lib/utils/parseSpreadsheet";
import { DataPreview } from "./DataPreview";
import { StepActions } from "./StepActions";

export interface SavedMappingBannerInfo {
  appliedFromDb: boolean;
  restoredMappedCount: number;
  restoredComputedCount: number;
  restoredDefaultCount: number;
  canSkipToSubmit: boolean;
}

interface UploadStepProps {
  parsed: ParsedSpreadsheet | null;
  /** File data including calculated columns, shown in the preview table. */
  previewData?: ParsedSpreadsheet | null;
  calculatedNames?: string[];
  savedMappingInfo?: SavedMappingBannerInfo | null;
  onParsed: (parsed: ParsedSpreadsheet | null) => void;
  onBack: () => void;
  onNext: () => void;
  onSkipToSubmit?: () => void;
  /** Rendered under the preview once a file is parsed (e.g. the calculated-columns builder). */
  children?: React.ReactNode;
}

export function UploadStep({
  parsed,
  previewData,
  calculatedNames,
  savedMappingInfo,
  onParsed,
  onBack,
  onNext,
  onSkipToSubmit,
  children,
}: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      onParsed(await parseSpreadsheet(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the file");
    } finally {
      setParsing(false);
    }
  };

  return (
    <Card
      label="Step 2"
      icon={<UploadCloud className="h-4 w-4" />}
      title="Upload your file"
      description="Drop an .xlsx or .csv file. It is read in your browser — nothing is sent until you submit."
    >
      {!parsed && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          className={clsx(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all sm:py-16",
            dragging
              ? "scale-[1.01] border-accent bg-accent/5"
              : "border-zinc-300 bg-zinc-50/60 hover:border-brand-400 hover:bg-brand-50/40",
          )}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent text-white shadow-lg shadow-brand-500/30">
            <UploadCloud className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {parsing ? "Reading file…" : dragging ? "Drop to upload" : "Drag & drop your file here"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              or <span className="font-medium text-brand-600">browse</span> from your device
            </p>
          </div>
          <p className="text-xs text-zinc-400">Supported: {ACCEPTED_EXTENSIONS.join("  ·  ")}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        data-testid="file-input"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      {error && <Alert tone="error" className="mt-4">{error}</Alert>}

      {parsed && (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200">
              <FileSpreadsheet className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">{parsed.fileName}</p>
              <p className="text-xs text-zinc-600">
                {(previewData ?? parsed).headers.length} columns ·{" "}
                {previewData && previewData.rows.length !== parsed.rows.length
                  ? `${previewData.rows.length} of ${parsed.rows.length} rows matching filters`
                  : `${parsed.rows.length} data rows`}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <IconButton aria-label="Remove file" onClick={() => onParsed(null)}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>

          {savedMappingInfo?.appliedFromDb && (
            <div
              data-testid="saved-mapping-loaded-banner"
              className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 py-2.5 text-xs text-brand-900"
            >
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <span>
                  <strong className="font-semibold">Saved scope mapping loaded from database:</strong>{" "}
                  {savedMappingInfo.restoredMappedCount} mapped columns
                  {savedMappingInfo.restoredComputedCount > 0 &&
                    `, ${savedMappingInfo.restoredComputedCount} calculated columns`}
                  {savedMappingInfo.restoredDefaultCount > 0 &&
                    `, ${savedMappingInfo.restoredDefaultCount} custom defaults`}{" "}
                  applied automatically.
                </span>
              </div>
              {savedMappingInfo.canSkipToSubmit && onSkipToSubmit && (
                <button
                  type="button"
                  data-testid="skip-to-submit-banner-btn"
                  onClick={onSkipToSubmit}
                  className="inline-flex items-center gap-1 font-semibold text-brand-700 underline decoration-brand-400 underline-offset-2 hover:text-brand-900"
                >
                  Skip mapping &amp; preview data <FastForward className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>
          )}

          <DataPreview
            parsed={previewData ?? parsed}
            calculated={calculatedNames}
            totalUnfilteredRows={parsed.rows.length}
          />
        </>
      )}

      {parsed && children && <div className="mt-6 space-y-6">{children}</div>}

      <StepActions
        back={
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {parsed &&
            savedMappingInfo?.appliedFromDb &&
            savedMappingInfo.canSkipToSubmit &&
            onSkipToSubmit && (
              <Button
                variant="secondary"
                data-testid="skip-mapping-btn"
                disabled={previewData !== undefined && previewData !== null && previewData.rows.length === 0}
                onClick={onSkipToSubmit}
              >
                <FastForward className="h-4 w-4" aria-hidden /> Skip mapping &rarr; Preview
              </Button>
            )}
          <Button
            disabled={!parsed || (previewData !== undefined && previewData !== null && previewData.rows.length === 0)}
            onClick={onNext}
          >
            Continue <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </StepActions>
    </Card>
  );
}
