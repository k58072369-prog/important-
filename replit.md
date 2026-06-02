# EDU SMART OS

نظام إدارة حلقات تحفيظ القرآن الكريم — منصة شاملة (LMS + ERP) تتيح إدارة الطلاب والمعلمين والحلقات والحصص والشؤون المالية مع واجهة عربية RTL فاخرة.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/edu-smart-os run dev` — run the frontend (port 23917, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed sample data
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, TanStack Query, Wouter, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- AI: Replit AI Integrations (OpenAI gpt-5.2) for insights + student analysis
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for all endpoints)
- `lib/api-zod/` — generated Zod schemas from spec
- `lib/api-client-react/` — generated React Query hooks from spec
- `lib/db/src/schema/` — Drizzle ORM table definitions (students, teachers, circles, sessions, finance, notifications)
- `artifacts/api-server/src/routes/` — all Express route handlers (one file per domain)
- `artifacts/edu-smart-os/src/pages/` — all 10 React page components
- `artifacts/edu-smart-os/src/components/` — shared components (layout, ui/)
- `scripts/src/seed.ts` — sample data seeder

## Architecture decisions

- Contract-first: OpenAPI spec defined before any routes or hooks are written
- All API responses use snake_case keys (matching OpenAPI spec); DB columns use camelCase internally — `lib/transform.ts` handles conversion
- Sessions auto-populate attendance records for all circle students on creation, carrying over next_memorization/next_revision from previous session
- Finance invoices are per-student per-month; exempt students get "معفي" status automatically
- AI routes (`/api/ai/insights`, `/api/ai/analyze-student/:id`) use Replit AI Integrations with no user API key required

## Product

10 modules accessible from the RTL sidebar:
1. **لوحة التحكم** — real-time stats: student/teacher/circle/session counts, today's attendance, revenue, notifications, financial chart
2. **الطلاب** — full CRUD, search, filter by circle/level/payment, guardian phone, memorization tracking
3. **المعلمين** — teacher profiles with salary, hire date, student & circle counts
4. **الحلقات** — circle management with teacher assignment, schedule, status
5. **الحصص** — session management with auto-populated attendance records, carry-forward logic
6. **الشؤون المالية** — invoices per student/month, expenses, summary with monthly breakdown
7. **الإشعارات** — notification center with read/unread, priority levels, types
8. **لوحة الصدارة** — student leaderboard ranked by points with gold/silver/bronze badges
9. **التقارير** — attendance and memorization reports
10. **مركز المساعدة** — help center with WhatsApp support link (wa.me/201127416995)

## User preferences

- Arabic RTL UI throughout
- Islamic luxury aesthetic: Emerald Green (#10b981), Dark Green (#065f46), Gold/Amber (#f59e0b)
- All responses must be snake_case matching OpenAPI spec
- WhatsApp support: https://wa.me/201127416995 (Adham)

## Gotchas

- `lib/transform.ts` converts camelCase DB results → snake_case API responses; always use it in route handlers
- The `pnpm-workspace.yaml` catalog pins most package versions; use `"catalog:"` for those
- DB UUIDs as primary keys; no integer IDs
- `pnpm --filter @workspace/db run push-force` if push fails with column conflicts
- Express 5: wildcard routes need names (`/{*splat}`), async handlers annotated `Promise<void>`, early returns: `res.json(); return;`
- AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY auto-set by Replit; never modify

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
