---
name: Soft Delete + Activity Log
description: How the soft delete system and audit trail work in EDU Smart OS
---

## DB Schema (v4)
- `deleted_at?: string` added to: students, teachers, circles, sessions, invoices, expenses, salary_records, courses, competitions, competition_levels
- New `activity_logs` table with fields: id, action, entity_type, entity_id, entity_name?, details?, created_at

## Soft Delete Strategy
- **Delete**: set `deleted_at = now()` on the record — never call `db.xxx.delete()` in the user-facing delete functions
- **Hooks filter**: every `useXxx()` hook adds `all = all.filter(x => !x.deleted_at)` so deleted items are invisible in normal views
- **Restore**: `update(id, { deleted_at: undefined })` — sets deleted_at back to undefined
- **Permanent delete**: actual `db.xxx.delete(id)` — with cascade where appropriate

## logActivity()
- Private async function (not exported) defined in store.tsx right after the helper functions section
- Called from every delete/restore/permanentDelete function
- Signature: `{ action, entity_type, entity_id, entity_name?, details? }`
- Action values: "ADD" | "UPDATE" | "DELETE" | "RESTORE" | "PERMANENT_DELETE"

## UI Components
- `SafeDeleteDialog` at `src/components/safe-delete-dialog.tsx` — reusable dialog replacing `confirm()` calls
  - Props: open, onClose, onConfirm, itemName, itemType, requireTyping?, relatedItems?, impact?
  - requireTyping=true forces user to type "حذف" before confirming (used for students, teachers)
- Trash page at `/trash` — tabs by entity type, restore/permanent delete buttons
- Activity Log page at `/activity-log` — filterable table with pagination (50/page), stat cards

## Sidebar
- System pages (Trash, Activity Log) placed in a separate `إدارة النظام` sidebar group below main navigation

**Why:** Irreversible data loss was a critical risk; soft delete gives users a safety net while keeping the DB clean via permanent delete in the trash.
