import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Schema management"
        description="Maintain categories and scopes, and design the column rules each upload is validated against."
      />
      <AdminWorkspace />
    </>
  );
}
