import { db } from "./db";

const BACKUP_PREFIX = "furqan_backup_";
const MAX_BACKUPS = 7;
export const AUTO_BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const ALL_TABLES = [
  "students", "teachers", "circles", "sessions", "session_records",
  "invoices", "expenses", "salary_records", "notifications",
  "courses", "course_students", "course_sessions", "course_session_records",
  "competitions", "competition_levels", "competition_enrollments", "competition_results",
  "monthly_reports",
] as const;

export interface BackupMeta {
  id: string;
  created_at: string;
  label: string;
  counts: Record<string, number>;
  size_bytes: number;
  version: number;
}

export interface BackupData extends BackupMeta {
  tables: Record<string, any[]>;
}

// ─── CREATE BACKUP ──────────────────────────────────────────────────────────
export async function createBackup(label?: string): Promise<BackupMeta> {
  const id = Date.now().toString();
  const tables: Record<string, any[]> = {};
  const counts: Record<string, number> = {};

  for (const table of ALL_TABLES) {
    try {
      const rows = await (db as any)[table].toArray();
      tables[table] = rows;
      counts[table] = rows.length;
    } catch {
      tables[table] = [];
      counts[table] = 0;
    }
  }

  const created_at = new Date().toISOString();
  const backupLabel = label ?? `نسخة احتياطية — ${new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}`;

  const payload: BackupData = {
    id,
    created_at,
    label: backupLabel,
    counts,
    tables,
    size_bytes: 0,
    version: 2,
  };

  const json = JSON.stringify(payload);
  payload.size_bytes = new Blob([json]).size;

  try {
    localStorage.setItem(`${BACKUP_PREFIX}${id}`, JSON.stringify({ ...payload }));
    pruneOldBackups();
  } catch (e) {
    // localStorage might be full — prune and retry
    pruneOldBackups(MAX_BACKUPS - 2);
    try {
      localStorage.setItem(`${BACKUP_PREFIX}${id}`, JSON.stringify(payload));
    } catch {
      console.warn("[Backup] localStorage full — backup skipped");
    }
  }

  const meta: BackupMeta = { id, created_at, label: backupLabel, counts, size_bytes: payload.size_bytes, version: 2 };
  return meta;
}

// ─── LIST BACKUPS ────────────────────────────────────────────────────────────
export function listBackups(): BackupMeta[] {
  const metas: BackupMeta[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(BACKUP_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const b: BackupData = JSON.parse(raw);
      metas.push({ id: b.id, created_at: b.created_at, label: b.label, counts: b.counts, size_bytes: b.size_bytes ?? 0, version: b.version ?? 1 });
    } catch {}
  }
  return metas.sort((a, b) => Number(b.id) - Number(a.id));
}

// ─── GET BACKUP DATA ─────────────────────────────────────────────────────────
export function getBackupData(id: string): BackupData | null {
  try {
    const raw = localStorage.getItem(`${BACKUP_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── DELETE BACKUP ────────────────────────────────────────────────────────────
export function deleteBackup(id: string): void {
  localStorage.removeItem(`${BACKUP_PREFIX}${id}`);
}

// ─── RESTORE BACKUP ──────────────────────────────────────────────────────────
export async function restoreBackup(id: string): Promise<{ success: boolean; message: string }> {
  const data = getBackupData(id);
  if (!data) return { success: false, message: "النسخة الاحتياطية غير موجودة" };

  try {
    for (const table of ALL_TABLES) {
      const rows = data.tables[table];
      if (!rows || !Array.isArray(rows)) continue;
      await (db as any)[table].clear();
      if (rows.length > 0) {
        await (db as any)[table].bulkAdd(rows);
      }
    }
    return { success: true, message: `تمت الاستعادة بنجاح — ${Object.values(data.counts).reduce((s, v) => s + v, 0)} سجل` };
  } catch (err: any) {
    return { success: false, message: `فشل الاستعادة: ${err?.message ?? "خطأ غير معروف"}` };
  }
}

// ─── PRUNE OLD BACKUPS ───────────────────────────────────────────────────────
function pruneOldBackups(keep: number = MAX_BACKUPS): void {
  const backups = listBackups();
  if (backups.length > keep) {
    backups.slice(keep).forEach(b => deleteBackup(b.id));
  }
}

// ─── VERIFY INTEGRITY ────────────────────────────────────────────────────────
export interface IntegrityIssue {
  table: string;
  record_id: string;
  issue: string;
  severity: "error" | "warning";
}

export async function verifyIntegrity(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  try {
    const [students, teachers, circles, sessions, session_records, invoices, course_students, course_sessions, course_session_records, competition_enrollments, competition_results, competition_levels] = await Promise.all([
      db.students.toArray(),
      db.teachers.toArray(),
      db.circles.toArray(),
      db.sessions.toArray(),
      db.session_records.toArray(),
      db.invoices.toArray(),
      db.course_students.toArray(),
      db.course_sessions.toArray(),
      db.course_session_records.toArray(),
      db.competition_enrollments.toArray(),
      db.competition_results.toArray(),
      db.competition_levels.toArray(),
    ]);

    const studentIds = new Set(students.map(s => s.id));
    const teacherIds = new Set(teachers.map(t => t.id));
    const circleIds = new Set(circles.map(c => c.id));
    const sessionIds = new Set(sessions.map(s => s.id));
    const courseStudentIds = new Set(course_students.map(cs => cs.course_id));
    const courseSessionIds = new Set(course_sessions.map(cs => cs.id));
    const levelIds = new Set(competition_levels.map(l => l.id));
    const enrollmentIds = new Set(competition_enrollments.map(e => e.id));

    // Students referencing invalid teachers
    for (const s of students) {
      if (s.teacher_id && !teacherIds.has(s.teacher_id)) {
        issues.push({ table: "students", record_id: s.id, issue: `مرجع معلم غير موجود: ${s.teacher_id}`, severity: "warning" });
      }
      if (s.circle_id && !circleIds.has(s.circle_id)) {
        issues.push({ table: "students", record_id: s.id, issue: `مرجع حلقة غير موجودة: ${s.circle_id}`, severity: "warning" });
      }
    }

    // Session records referencing invalid sessions
    for (const r of session_records) {
      if (!sessionIds.has(r.session_id)) {
        issues.push({ table: "session_records", record_id: r.id, issue: `سجل حصة يشير لحصة غير موجودة`, severity: "error" });
      }
      if (!studentIds.has(r.student_id)) {
        issues.push({ table: "session_records", record_id: r.id, issue: `سجل حصة يشير لطالب غير موجود`, severity: "warning" });
      }
    }

    // Invoices with missing students
    for (const inv of invoices) {
      if (!studentIds.has(inv.student_id)) {
        issues.push({ table: "invoices", record_id: inv.id, issue: `فاتورة تشير لطالب غير موجود`, severity: "warning" });
      }
    }

    // Course session records with missing sessions
    for (const r of course_session_records) {
      if (!courseSessionIds.has(r.course_session_id)) {
        issues.push({ table: "course_session_records", record_id: r.id, issue: `سجل حصة دورة يشير لحصة غير موجودة`, severity: "error" });
      }
    }

    // Competition results with missing enrollments
    for (const r of competition_results) {
      if (!enrollmentIds.has(r.enrollment_id)) {
        issues.push({ table: "competition_results", record_id: r.id, issue: `نتيجة مسابقة تشير لتسجيل غير موجود`, severity: "error" });
      }
    }

    // Competition enrollments with missing levels
    for (const e of competition_enrollments) {
      if (!levelIds.has(e.level_id)) {
        issues.push({ table: "competition_enrollments", record_id: e.id, issue: `تسجيل مسابقة يشير لمستوى غير موجود`, severity: "error" });
      }
      if (!studentIds.has(e.student_id)) {
        issues.push({ table: "competition_enrollments", record_id: e.id, issue: `تسجيل مسابقة يشير لطالب غير موجود`, severity: "warning" });
      }
    }

    // Duplicate invoices (same student same month)
    const invoiceKeys = new Set<string>();
    for (const inv of invoices) {
      const key = `${inv.student_id}_${inv.month}`;
      if (invoiceKeys.has(key)) {
        issues.push({ table: "invoices", record_id: inv.id, issue: `فاتورة مكررة لنفس الطالب ونفس الشهر`, severity: "warning" });
      }
      invoiceKeys.add(key);
    }

  } catch (err: any) {
    issues.push({ table: "system", record_id: "check", issue: `خطأ أثناء التحقق: ${err?.message}`, severity: "error" });
  }

  return issues;
}

// ─── AUTO FIX ─────────────────────────────────────────────────────────────────
export async function autoFixOrphanedRecords(): Promise<number> {
  let fixed = 0;

  const [studentIds, sessionIds, courseSessionIds, enrollmentIds, levelIds] = await Promise.all([
    db.students.toCollection().primaryKeys(),
    db.sessions.toCollection().primaryKeys(),
    db.course_sessions.toCollection().primaryKeys(),
    db.competition_enrollments.toCollection().primaryKeys(),
    db.competition_levels.toCollection().primaryKeys(),
  ]);

  const sSet = new Set(studentIds as string[]);
  const sessSet = new Set(sessionIds as string[]);
  const csSet = new Set(courseSessionIds as string[]);
  const enrSet = new Set(enrollmentIds as string[]);
  const lvlSet = new Set(levelIds as string[]);

  // Delete orphaned session records
  const srToDelete = await db.session_records.filter(r => !sessSet.has(r.session_id)).primaryKeys();
  await db.session_records.bulkDelete(srToDelete as string[]);
  fixed += srToDelete.length;

  // Delete orphaned course session records
  const csrToDelete = await db.course_session_records.filter(r => !csSet.has(r.course_session_id)).primaryKeys();
  await db.course_session_records.bulkDelete(csrToDelete as string[]);
  fixed += csrToDelete.length;

  // Delete orphaned competition results
  const crToDelete = await db.competition_results.filter(r => !enrSet.has(r.enrollment_id)).primaryKeys();
  await db.competition_results.bulkDelete(crToDelete as string[]);
  fixed += crToDelete.length;

  // Delete orphaned competition enrollments (missing level)
  const ceToDelete = await db.competition_enrollments.filter(e => !lvlSet.has(e.level_id)).primaryKeys();
  await db.competition_enrollments.bulkDelete(ceToDelete as string[]);
  fixed += ceToDelete.length;

  return fixed;
}

// ─── EXPORT JSON ─────────────────────────────────────────────────────────────
export async function exportToJson(): Promise<void> {
  const backup = await createBackup("تصدير يدوي");
  const data = getBackupData(backup.id);
  if (!data) return;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `furqan_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── IMPORT FROM JSON ─────────────────────────────────────────────────────────
export async function importFromJson(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data: BackupData = JSON.parse(text);

    if (!data.tables || typeof data.tables !== "object") {
      return { success: false, message: "ملف النسخة غير صحيح" };
    }

    // Save it as a local backup first
    const id = Date.now().toString();
    data.id = id;
    data.label = `مستورد: ${file.name}`;
    data.created_at = new Date().toISOString();
    localStorage.setItem(`${BACKUP_PREFIX}${id}`, JSON.stringify(data));

    // Then restore it
    return restoreBackup(id);
  } catch (err: any) {
    return { success: false, message: `فشل الاستيراد: ${err?.message}` };
  }
}

// ─── AUTO BACKUP SCHEDULER ───────────────────────────────────────────────────
let autoBackupTimer: ReturnType<typeof setInterval> | null = null;

export function startAutoBackup(): void {
  if (autoBackupTimer) return;

  // Create first backup after 30s of starting
  setTimeout(() => createBackup("تلقائي — بدء التشغيل").catch(() => {}), 30_000);

  autoBackupTimer = setInterval(() => {
    createBackup("تلقائي").catch(() => {});
  }, AUTO_BACKUP_INTERVAL_MS);
}

export function stopAutoBackup(): void {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }
}

// ─── FORM DRAFT HELPERS ───────────────────────────────────────────────────────
const DRAFT_PREFIX = "furqan_draft_";

export function saveDraft<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify({ data, saved_at: Date.now() }));
  } catch {}
}

export function loadDraft<T>(key: string, maxAgeMs = 24 * 60 * 60 * 1000): T | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.saved_at > maxAgeMs) {
      clearDraft(key);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  localStorage.removeItem(`${DRAFT_PREFIX}${key}`);
}

export function hasDraft(key: string): boolean {
  return localStorage.getItem(`${DRAFT_PREFIX}${key}`) !== null;
}

// ─── BACKUP SIZE HELPER ───────────────────────────────────────────────────────
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
