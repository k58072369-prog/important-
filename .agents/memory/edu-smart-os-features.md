---
name: EduSmart OS Features
description: All implemented features in the offline-first Quran memorization management system
---

## Feature Set (all implemented, 0 TS errors)

### Pages (17 total)
- dashboard, students, teachers, circles, sessions, finance, notifications
- leaderboard (student leaderboard with badges)
- competition-leaderboard (competition-specific leaderboard)
- competitions (full CRUD with levels/enrollments/results)
- courses (course management)
- monthly-reports (per-student monthly report cards)
- competition-stats (Recharts bar/line/pie charts, top scorers, per-competition table)
- search (global search across all entities with filter chips)
- reports, help, activity-log, trash, not-found

### Modals (10 total)
- student-modal, student-detail-modal (5-tab smart card: profile/attendance/competitions/courses/finance)
- teacher-modal, teacher-detail-modal (4 tabs: profile/students/circles/sessions+payroll)
- circle-modal, circle-detail-modal (3 tabs: info/students/sessions)
- session-modal (with free-text "سمع عند" + manual input), session-detail-modal (inline edit per row)
- invoice-modal, expense-modal

### Store Hooks (96 exports)
- useStudentStats, useTeacherStats, useCircleStats — live aggregated data from Dexie
- useCompetitionStatsGlobal — per-competition breakdown for charts
- useGlobalSearch — instant search across all tables
- updateSessionRecord — inline edit individual attendance records

### DB Schema
- Version 5 (Dexie), IndexedDB only, fully offline
- Soft delete (deleted_at) on 9 tables + activity_logs
- monthly_reports table added in v3

### Known Harmless Warnings
- Recharts "width(0) height(0)" console warnings — appear during initial render before layout settles, charts display fine

### SafeDeleteDialog Props
- Correct props: open, onClose, onConfirm, itemName, itemType, requireTyping?, relatedItems?, impact?, loading?
- NOT: title, description, relatedCount, relatedLabel (old API)
