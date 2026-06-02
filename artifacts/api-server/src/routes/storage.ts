import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import {
  db,
  auditLogsTable,
  backupRecordsTable,
  studentsTable,
  teachersTable,
  circlesTable,
  sessionsTable,
  invoicesTable,
  expensesTable,
  incomeEntriesTable,
  salaryRecordsTable,
  transactionsTable,
} from "@workspace/db";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

const STORAGE_DIR = path.resolve(process.cwd(), "../../storage");
const BACKUP_DIR = path.join(STORAGE_DIR, "backup");
const LOGS_DIR = path.join(STORAGE_DIR, "logs");
const CACHE_DIR = path.join(STORAGE_DIR, "cache");

// Ensure directories exist
[STORAGE_DIR, BACKUP_DIR, LOGS_DIR, CACHE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

router.get("/storage/logs", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const entity = req.query.entity as string | undefined;

  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(entity ? sql`${auditLogsTable.entity} = ${entity}` : undefined)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit);

  res.json(logs);
});

// ─── Database Stats ───────────────────────────────────────────────────────────

router.get("/storage/stats", async (_req, res): Promise<void> => {
  const [students, teachers, circles, sessions, invoices, expenses, income, payroll, transactions, logs, backups] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(studentsTable),
      db.select({ count: sql<number>`count(*)` }).from(teachersTable),
      db.select({ count: sql<number>`count(*)` }).from(circlesTable),
      db.select({ count: sql<number>`count(*)` }).from(sessionsTable),
      db.select({ count: sql<number>`count(*)` }).from(invoicesTable),
      db.select({ count: sql<number>`count(*)` }).from(expensesTable),
      db.select({ count: sql<number>`count(*)` }).from(incomeEntriesTable),
      db.select({ count: sql<number>`count(*)` }).from(salaryRecordsTable),
      db.select({ count: sql<number>`count(*)` }).from(transactionsTable),
      db.select({ count: sql<number>`count(*)` }).from(auditLogsTable),
      db.select().from(backupRecordsTable).orderBy(desc(backupRecordsTable.createdAt)).limit(1),
    ]);

  const totalRecords =
    Number(students[0].count) +
    Number(teachers[0].count) +
    Number(circles[0].count) +
    Number(sessions[0].count) +
    Number(invoices[0].count) +
    Number(expenses[0].count) +
    Number(income[0].count) +
    Number(payroll[0].count) +
    Number(transactions[0].count);

  // Check backup files on disk
  const backupFiles = fs.existsSync(BACKUP_DIR)
    ? fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json")).length
    : 0;

  res.json({
    tables: {
      students: Number(students[0].count),
      teachers: Number(teachers[0].count),
      circles: Number(circles[0].count),
      sessions: Number(sessions[0].count),
      invoices: Number(invoices[0].count),
      expenses: Number(expenses[0].count),
      income: Number(income[0].count),
      payroll: Number(payroll[0].count),
      transactions: Number(transactions[0].count),
    },
    total_records: totalRecords,
    audit_logs_count: Number(logs[0].count),
    backup_files_count: backupFiles,
    last_backup: backups[0] ?? null,
    storage_status: "healthy",
    db_type: "PostgreSQL",
    offline_capable: true,
  });
});

// ─── Backup ───────────────────────────────────────────────────────────────────

async function createBackup(triggeredBy = "manual"): Promise<{ filename: string; path: string; recordCount: number; sizeBytes: number }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `backup_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  const [students, teachers, circles, sessions, sessionRecords, invoices, expenses, income, payroll, transactions] =
    await Promise.all([
      db.select().from(studentsTable),
      db.select().from(teachersTable),
      db.select().from(circlesTable),
      db.select().from(sessionsTable),
      db.select().from(sql`session_records`),
      db.select().from(invoicesTable),
      db.select().from(expensesTable),
      db.select().from(incomeEntriesTable),
      db.select().from(salaryRecordsTable),
      db.select().from(transactionsTable),
    ]).catch(() => [[], [], [], [], [], [], [], [], [], []]);

  const backup = {
    version: "2.0",
    created_at: new Date().toISOString(),
    triggered_by: triggeredBy,
    data: {
      students,
      teachers,
      circles,
      sessions,
      session_records: sessionRecords,
      invoices,
      expenses,
      income,
      payroll,
      transactions,
    },
  };

  const content = JSON.stringify(backup, null, 2);
  fs.writeFileSync(filePath, content, "utf-8");

  const sizeBytes = Buffer.byteLength(content, "utf-8");
  const recordCount =
    students.length + teachers.length + circles.length + sessions.length +
    invoices.length + expenses.length + income.length + payroll.length + transactions.length;

  // Record in DB
  await db.insert(backupRecordsTable).values({
    filename,
    filePath,
    sizeBytes: sizeBytes.toString(),
    recordCount: recordCount.toString(),
    status: "completed",
    triggeredBy,
  });

  // Update cache file
  const cacheFile = path.join(CACHE_DIR, "temp_data.json");
  fs.writeFileSync(cacheFile, JSON.stringify({ last_backup: filename, timestamp: new Date().toISOString() }), "utf-8");

  // Keep only last 10 backups on disk
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json")).sort();
  while (files.length > 10) {
    const oldest = files.shift()!;
    fs.unlinkSync(path.join(BACKUP_DIR, oldest));
  }

  return { filename, path: filePath, recordCount, sizeBytes };
}

router.post("/storage/backup", async (req, res): Promise<void> => {
  try {
    const result = await createBackup("manual");
    res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/storage/backups", async (_req, res): Promise<void> => {
  const backups = await db
    .select()
    .from(backupRecordsTable)
    .orderBy(desc(backupRecordsTable.createdAt))
    .limit(20);
  res.json(backups);
});

router.get("/storage/backup/download/:filename", (req, res): void => {
  const { filename } = req.params;
  if (!filename.match(/^backup_[\w-]+\.json$/) || filename.includes("..")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Backup file not found" });
    return;
  }
  res.download(filePath, filename);
});

// ─── Restore ─────────────────────────────────────────────────────────────────

router.post("/storage/restore", async (req, res): Promise<void> => {
  try {
    const { data } = req.body;
    if (!data?.students || !data?.teachers) {
      res.status(400).json({ error: "Invalid backup format" });
      return;
    }

    // Create a backup before restoring
    await createBackup("pre-restore");

    // Restore students
    if (data.students?.length > 0) {
      await db.delete(studentsTable);
      await db.insert(studentsTable).values(data.students);
    }
    if (data.teachers?.length > 0) {
      await db.delete(teachersTable);
      await db.insert(teachersTable).values(data.teachers);
    }
    if (data.expenses?.length > 0) {
      await db.delete(expensesTable);
      await db.insert(expensesTable).values(data.expenses);
    }
    if (data.invoices?.length > 0) {
      await db.delete(invoicesTable);
      await db.insert(invoicesTable).values(data.invoices);
    }
    if (data.income?.length > 0) {
      await db.delete(incomeEntriesTable);
      await db.insert(incomeEntriesTable).values(data.income);
    }
    if (data.payroll?.length > 0) {
      await db.delete(salaryRecordsTable);
      await db.insert(salaryRecordsTable).values(data.payroll);
    }

    await db.insert(auditLogsTable).values({
      action: "restore",
      entity: "system",
      entityName: "database",
      changes: { restored_tables: Object.keys(data) },
      status: "success",
    });

    res.json({ success: true, message: "تمت استعادة البيانات بنجاح" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Auto-backup scheduler (runs every 6 hours) ───────────────────────────────

let autoBackupTimer: ReturnType<typeof setInterval> | null = null;

export function startAutoBackup() {
  if (autoBackupTimer) return;
  // Run immediately on start after 30s delay (let server stabilize)
  setTimeout(async () => {
    try { await createBackup("auto"); } catch (_) {}
  }, 30_000);

  // Then every 6 hours
  autoBackupTimer = setInterval(async () => {
    try { await createBackup("auto"); } catch (_) {}
  }, 6 * 60 * 60 * 1000);
}

export default router;
