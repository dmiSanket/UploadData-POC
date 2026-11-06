import Link from "next/link";
import { ArrowRight, Database, FileSpreadsheet, GitCompareArrows, Settings2, ShieldCheck, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

const ACTIONS = [
  {
    href: "/upload",
    title: "Upload data",
    body: "Pick a document type and target scope, drop an Excel or CSV file, map its columns and submit.",
    Icon: UploadCloud,
    tint: "from-brand-500 to-accent",
    cta: "Start an upload",
  },
  {
    href: "/data",
    title: "Data & Tables Explorer",
    body: "Browse uploaded batches, inspect validated JSONB rows stored in PostgreSQL, and view SQL tables.",
    Icon: Database,
    tint: "from-amber-500 to-rose-500",
    cta: "Explore data",
  },
  {
    href: "/admin",
    title: "Admin panel",
    body: "Manage Categories, Dealers, Locations, Brands, compose Scopes, and build File Schemas.",
    Icon: Settings2,
    tint: "from-emerald-500 to-sky-500",
    cta: "Open admin",
  },
];

const STEPS = [
  { Icon: Settings2, title: "Define", body: "Admins build a schema per category and scope." },
  { Icon: FileSpreadsheet, title: "Upload", body: "Users drop an .xlsx or .csv, parsed in the browser." },
  { Icon: GitCompareArrows, title: "Map", body: "File headers are matched to the schema columns." },
  { Icon: ShieldCheck, title: "Validate", body: "The server checks every row before saving anything." },
];

export default function HomePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dynamic file ingestion"
        description="Define schemas per document type, then map and validate uploaded spreadsheets against them."
      />

      <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
        {ACTIONS.map(({ href, title, body, Icon, tint, cta }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-frame transition-all hover:-translate-y-0.5 hover:shadow-pop"
          >
            <span
              aria-hidden
              className={`absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${tint} opacity-10 blur-2xl transition-opacity group-hover:opacity-25`}
            />
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-lg`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-zinc-900">{title}</h2>
            <p className="mt-1.5 text-sm text-zinc-600">{body}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
              {cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-10 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">How it works</h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ Icon, title, body }, index) => (
          <li key={title} className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xs font-semibold text-zinc-400">0{index + 1}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-900">{title}</p>
            <p className="mt-0.5 text-sm text-zinc-500">{body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
