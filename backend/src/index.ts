import { config } from "./config";
import { createApp } from "./app";
import { prisma } from "./lib/prisma";

const server = createApp().listen(config.port, () => {
  console.log(`Ingestion API listening on http://localhost:${config.port}`);
  console.log(
    `Allowed CORS origins: ${Array.isArray(config.corsOrigins) ? config.corsOrigins.join(", ") : "*"}`,
  );
});

async function shutdown(): Promise<void> {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

