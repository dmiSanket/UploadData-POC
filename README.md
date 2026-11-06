# Dynamic File Ingestion & Mapping POC

Two fully independent services plus a database:

| Service  | Path        | Stack                                              | Port |
|----------|-------------|----------------------------------------------------|------|
| Frontend | `frontend/` | Next.js (UI only), Tailwind CSS v4, ExcelJS        | 3000 |
| Backend  | `backend/`  | Express + TypeScript, Prisma 6, Zod                | 4000 |
| Database | compose     | PostgreSQL 16 (JSONB for dynamic row data)         | 5433 |

The frontend only talks to the backend over REST (`NEXT_PUBLIC_API_URL`); the backend allows the
frontend origin through CORS (`CORS_ORIGINS`). No DDL is run at runtime – dynamic columns are rows in
`ColumnDefinition`, and ingested rows are stored in `IngestedData.rowData` (JSONB).

## Run it

```bash
docker compose up -d                     # Postgres on :5433

cd backend
cp .env.example .env
npm install
npx prisma migrate deploy                # apply migrations
npm run db:seed                          # sample categories, dealers, locations, brands, scopes & schemas
npm run dev                              # http://localhost:4000

cd ../frontend
cp .env.example .env.local
npm install
npm run dev                              # http://localhost:3000
```

- `/admin` – manage Master Data (Categories, Dealers, Locations, Brands), compose Scopes from one or multiple specific Dealers, Locations, and/or Brands, and build File Schemas for each Category + Scope combination.
- `/upload` – 4-step flow: select Category & Target Scope (with Dealer/Location/Brand filters) → drag-and-drop file → header mapping → submit.

## Data model (`backend/prisma/schema.prisma`)

- `Category` – core document types (e.g., `"PO Order"`, `"OOQ"`, `"SOQ"`, `"MRN"`, `"STN"`).
- `Dealer`, `Location`, `Brand` – specific master entities (e.g., `"Apex Motors"`, `"Mumbai - West"`, `"Toyota"`).
- `Scope` – combines one or multiple specific `Dealer`s, `Location`s, and/or `Brand`s via many-to-many join tables.
- `FileSchema` – joins a `Category` and a `Scope` (`@@unique([categoryId, scopeId])`).
- `ColumnDefinition` – dynamic column rules (`columnName`, `dataType`, `isRequired`, `validationRules` JSON).
- `IngestedBatch` & `IngestedData` – upload event metadata and validated row JSONB payloads.

`validationRules`: `{ regex, minLength, maxLength }` for String, `{ min, max }` for Number and Date.

## API

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/categories`, `/api/dealers`, `/api/locations`, `/api/brands` | list / create (`{ name }`) |
| PUT/DELETE | `/api/categories/:id`, `/api/dealers/:id`, `/api/locations/:id`, `/api/brands/:id` | rename / delete |
| GET | `/api/scopes?categoryId=` | list scopes with `dealers`, `locations`, `brands` (filtered by category when provided) |
| POST/PUT/DELETE | `/api/scopes`, `/api/scopes/:id` | create / update (`{ name?, dealerIds, locationIds, brandIds }`) / delete scope |
| GET/POST | `/api/file-schemas` | list / create (`{ categoryId, scopeId }`) |
| GET | `/api/file-schemas/lookup?categoryId=&scopeId=` | schema + column definitions (404 if none) |
| GET/DELETE | `/api/file-schemas/:id` | read / delete |
| POST | `/api/file-schemas/:id/columns` | add column |
| PUT/DELETE | `/api/columns/:id` | edit / remove column |
| POST | `/api/ingest` | map, validate, store |
| GET | `/api/batches`, `/api/batches/:id/rows` | inspect stored uploads |
