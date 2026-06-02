---
name: EDU Smart OS
description: Key facts about the EDU Smart OS Quran center management system
---

## Architecture

- **100% local-first** frontend using Dexie (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`)
- Backend (Express + PostgreSQL) exists but the **frontend does NOT use it** for data
- React + Vite, Wouter routing with `base={import.meta.env.BASE_URL}`, shadcn/ui components
- RTL Arabic UI, emerald green + gold/amber Islamic luxury aesthetic
- pnpm monorepo: `@workspace/edu-smart-os` is the frontend artifact

## Workflow

- Command: `PORT=23917 BASE_PATH=/ pnpm --filter @workspace/edu-smart-os run dev`
- `vite.config.ts` throws if PORT or BASE_PATH env vars are missing
- Local port: 23917 (mapped to external port 80)

## Dexie DB

- `furqan_db` version 2 (bumped from 1 to add new tables)
- Version 1 tables: students, teachers, circles, sessions, session_records, invoices, expenses, notifications
- Version 2 adds: salary_records, courses, course_students, course_sessions, course_session_records, competitions, competition_levels, competition_enrollments, competition_results

**Why:** Dexie requires version bumping when adding new stores; old schema must be declared in v1 and new stores in v2.

## New Sections Added

- `/courses` — Courses page: CRUD, student enrollment, course sessions with attendance
- `/competitions` — Competitions: CRUD, levels, student enrollment per level, results/grading
- `/competition-leaderboard` — Competition leaderboard with podium display and stats
- Finance page now has 4 tabs: ملخص, فواتير, المصروفات, الرواتب (payroll)
- Dashboard shows 10 stat cards including courses + competitions counts, alert banners for unpaid invoices and pending salaries

## Store Pattern

- All hooks use `useLiveQuery` — reactive, auto-updates UI on DB change
- Notification side effects built into add/update functions
- `generateMonthSalaries()` auto-generates salary records for all teachers who have a salary set
- Salary marked as paid auto-adds to expenses table
