import express from "express";
import cors from "cors";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import {
  brandsRouter,
  categoriesRouter,
  dealersRouter,
  locationsRouter,
} from "./routes/catalogRoutes";
import { scopesRouter } from "./routes/scopeRoutes";
import { columnsRouter, fileSchemasRouter } from "./routes/fileSchemaRoutes";
import { ingestionRouter } from "./routes/ingestionRoutes";

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    }),
  );
  app.use(express.json({ limit: config.jsonBodyLimit }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/categories", categoriesRouter);
  app.use("/api/dealers", dealersRouter);
  app.use("/api/locations", locationsRouter);
  app.use("/api/brands", brandsRouter);
  app.use("/api/scopes", scopesRouter);
  app.use("/api/file-schemas", fileSchemasRouter);
  app.use("/api/columns", columnsRouter);
  app.use("/api", ingestionRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
