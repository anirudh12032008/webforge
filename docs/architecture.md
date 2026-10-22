# CampusSense — Architecture

- **Frontends:** Citizen App (`/`, `/report`, `/my-reports`) and Admin Dashboard (`/dashboard`, `/complaints/[id]`, `/analytics`), both Next.js 15 App Router; Google Maps JS for map, Places, heatmap, Street View.
- **API:** Next.js route handlers validated with zod; Vercel Blob stores photos via `POST /api/upload`.
- **AI pipeline (`src/lib/ai`):** Claude `claude-sonnet-4-5` classifies (text + vision), Voyage `voyage-3-lite` embeds, then dedup, explainable priority score, and department routing.
- **Data:** Neon Postgres with PostGIS (location, `ST_ClusterDBSCAN` hotspots) and pgvector (HNSW cosine dedup); every AI result and admin override is written to `audit_log`.
- **New complaint flow:** photo → `/api/upload` → `POST /api/complaints` → zod validate → insert → classify → embed → dedup (cosine + 75 m + 14 d) → priority → route → update row → audit `ai_analysis` → return complaint + analysis.
