import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, studentsTable, sessionRecordsTable, sessionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/reports/attendance", async (_req, res): Promise<void> => {
  const students = await db.select().from(studentsTable);
  const sessions = await db.select().from(sessionsTable);

  const studentStats = await Promise.all(students.map(async (s) => {
    const [totalRecs] = await db.select({ count: count() }).from(sessionRecordsTable).where(eq(sessionRecordsTable.studentId, s.id));
    const [presentRecs] = await db.select({ count: count() }).from(sessionRecordsTable).where(and(eq(sessionRecordsTable.studentId, s.id), eq(sessionRecordsTable.isPresent, true)));
    const total = Number(totalRecs.count);
    const present = Number(presentRecs.count);
    return {
      student_id: s.id,
      student_name: s.fullName,
      present,
      absent: total - present,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }));

  const overall = studentStats.length > 0
    ? Math.round(studentStats.reduce((sum, s) => sum + s.rate, 0) / studentStats.length)
    : 0;

  res.json({
    total_sessions: sessions.length,
    overall_attendance_rate: overall,
    period: "كل الوقت",
    students: studentStats,
    by_circle: [],
  });
});

router.get("/reports/memorization", async (_req, res): Promise<void> => {
  const students = await db.select().from(studentsTable);

  const studentStats = await Promise.all(students.map(async (s) => {
    const records = await db.select().from(sessionRecordsTable).where(eq(sessionRecordsTable.studentId, s.id));
    const lastRecord = records.at(-1);
    return {
      student_id: s.id,
      student_name: s.fullName,
      total_memorized: lastRecord?.memorizationAmount ?? s.currentMemorization ?? "—",
      total_revised: lastRecord?.revisionAmount ?? s.currentRevision ?? "—",
      last_memorized: lastRecord?.memorizationAmount ?? null,
      performance: s.level ?? "غير محدد",
    };
  }));

  res.json({
    total_students: students.length,
    average_memorization_pages: 0,
    students: studentStats,
  });
});

export default router;
