# CampusSense — Build Plan

Code freeze: **21:00 IST**. Each step is 10–20 min, ends green (`tsc --noEmit`, plus `next build` when relevant), and gets one conventional commit. Checkpoint times are targets; if one slips by more than 30 min, cut the ✂ items.

## Phase 0 — Foundation (done)
0.1 Architecture diagram + overview (teammates' docs in repo) ✅
0.2 Next 15 init, shadcn, drizzle, env, skeleton — `chore: initialize next15 app…` ✅

## Phase 1 — Database (target 11:30)
1. Schema: enums (category, status), `departments`, `complaints` (geography point via customType, vector(512)), `audit_log` — `feat(db): add complaints, departments and audit_log schema`
2. Migration SQL: `CREATE EXTENSION postgis, vector`; GIST(location), HNSW(embedding cosine), btree(status, created_at); push to Neon — `feat(db): add extensions and spatial/vector indexes`
3. Shared domain types in `src/types` (Complaint, Analysis, PriorityBreakdown, Department, AuditEntry) + zod request schemas — `feat(types): add domain types and api validation schemas`
4. DB query helpers: insert/update complaint, nearby-within-radius, audit write — `feat(db): add complaint and audit query helpers`

## Phase 2 — AI pipeline + API (target 14:00)
5. `ai/priority.ts` (pure, exported WEIGHTS, breakdown) + vitest — `feat(ai): add explainable priority scoring with tests`
6. `ai/classify.ts`: Claude structured JSON, vision block, 20 s timeout, 1 retry, fallback other/0.3 — `feat(ai): add claude text+vision classifier with fallback`
7. `ai/embed.ts`: Voyage voyage-3-lite, null on failure — `feat(ai): add voyage embeddings`
8. `ai/dedup.ts`: pgvector cosine + 75 m + 14 d; >0.82 duplicate, 0.65–0.82 related; thresholds unit-tested — `feat(ai): add semantic + spatial duplicate detection`
9. `ai/route.ts`: department by category + urgency + load + test — `feat(ai): add department routing`
10. `ai/pipeline.ts`: classify → embed → dedup → priority → route → update → audit `ai_analysis` — `feat(ai): add complaint analysis pipeline`
11. `POST /api/upload` (Vercel Blob, type/size limits) — `feat(api): add photo upload route`
12. `POST /api/complaints` (validate → insert → pipeline → return) — `feat(api): add complaint submission route`
13. `GET /api/complaints` (status/category/department/bbox/sort/page) — `feat(api): add complaint listing with filters`
14. `GET /api/complaints/[id]` (+ related, duplicates, audit, department) — `feat(api): add complaint detail route`
15. `PATCH /api/complaints/[id]` (status/department/category override, audit before/after, x-actor) — `feat(api): add audited complaint overrides`
16. `geo/clusters.ts` (ST_ClusterDBSCAN eps≈60 m, minpoints 2, recurring ≥3/30 d) + `GET /api/clusters` — `feat(geo): add hotspot clustering`
17. `scripts/seed.ts`: reads `data/*.json` (fallback 10 placeholders), runs the real pipeline — `feat(scripts): add pipeline-backed seed script`
18. `lib/api.ts` typed client for frontends — `feat(lib): add typed api client`

## Phase 3 — Citizen app (target 16:15)
19. Landing `/`: hero, how it works, live counters — `feat(citizen): add landing page with live counters`
20. Map primitives: APIProvider wrapper, pin picker (click + "use my location") — `feat(map): add location picker`
21. Places Autocomplete + reverse-geocoded label — `feat(map): add places search and reverse geocoding`
22. Report form: fields, validation, photo compress + preview + upload — `feat(citizen): add report form with photo upload`
23. Submit flow + result card (category + confidence bar, severity, "N similar nearby — linked to #id", rank, department), skeletons + toasts — `feat(citizen): add analysis result card`
24. `/my-reports`: localStorage contact key, status timeline, empty state — `feat(citizen): add my reports timeline`

## Phase 4 — Admin (target 19:30)
25. Role switch cookie + admin layout guard — `feat(admin): add cookie role switch`
26. Dashboard map: priority-coloured markers + marker clustering — `feat(admin): add priority map`
27. Heatmap toggle + cluster bubbles with recurring badge — `feat(admin): add heatmap and hotspot overlays`
28. Triage table (tanstack): sort/filter in URL state — `feat(admin): add triage table with url state`
29. Bulk status update — `feat(admin): add bulk status actions`
30. Detail page: photo, AI prediction + reasoning, priority breakdown bars — `feat(admin): add complaint detail view`
31. Detail actions: assign department, status, category override — `feat(admin): add override and assignment controls`
32. Audit timeline + related/duplicates merge/unmerge — `feat(admin): add audit trail and duplicate management`
33. Street View + `ai/explain.ts` "why is this #1" + resource recommendation — `feat(ai): add natural-language priority explanation`
34. `GET /api/analytics` (open/resolved, avg resolution hrs, by category/department, 30-day trend, hotspots, SLA >72 h) — `feat(api): add analytics aggregation`
35. Analytics page: KPI cards + recharts (trend, category pie, department bar, resolution time) — `feat(admin): add analytics charts`
36. Hotspots table + CSV export — `feat(admin): add hotspots table and csv export`

## Phase 5 — Ship (target 20:45)
37. Vercel project + env vars + Neon/Blob wiring, first prod deploy — `chore: configure vercel deployment`
38. Seed prod with teammates' data, sanity-check every page — `chore: seed production data`
39. Polish: mobile layout, loading/empty/error states, a11y basics — `fix: polish mobile and empty states`
40. Final: build, tests, lint, smoke-test deployed URL; freeze — `chore: final pre-freeze checks`

✂ Cut order if behind: 36 CSV export → 33 Street View → 29 bulk actions → 32 merge/unmerge (keep read-only lists) → 21 Places search (keep pin + my location).

Tip: deploy to Vercel early (after step 12) so prod issues surface before 20:00.
