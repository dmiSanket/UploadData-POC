import { IngestionWizard } from "@/components/ingestion/IngestionWizard";
import { PageHeader } from "@/components/shared/PageHeader";

export default function UploadPage() {
  return (
    <>
      <PageHeader
        eyebrow="Upload"
        title="Ingest spreadsheet data"
        description="Select the document category and target scope (specific Dealers, Locations, and/or Brands), upload your file, map headers, and validate."
      />
      <IngestionWizard />
    </>
  );
}
