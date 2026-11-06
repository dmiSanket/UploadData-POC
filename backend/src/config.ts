import "dotenv/config";

function parseOrigins(value: string | undefined): string[] | boolean {
  if (!value) {
    return process.env.VERCEL ? true : ["http://localhost:3000"];
  }
  const trimmed = value.trim();
  if (trimmed === "*") return true;
  return trimmed
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  /** Maximum rows accepted in a single ingest request. */
  maxIngestRows: 50_000,
  /** JSON body limit; spreadsheets are posted as JSON rows. */
  jsonBodyLimit: "50mb",
};

