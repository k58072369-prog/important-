import { Router, type IRouter } from "express";
import { count, eq, sql } from "drizzle-orm";
import { db, studentsTable, teachersTable, circlesTable, sessionsTable, sessionRecordsTable, invoicesTable, expensesTable, notificationsTable } from "@workspace/db";
import { toSnakeCase, toSnakeCaseArray } from "../lib/transform";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [totalStudents] = await db.select({ count: count() }).from(studentsTable);
  const [totalTeachers] = await db.select({ count: count() }).from(teachersTable);
  const [totalCircles] = await db.select({ count: count() }).from(circlesTable);
  const [totalSessions] = await db.select({ count: count() }).from(sessionsTable);

  const todaySessions = await db.select({ id: sessionsTable.id }).from(sessionsTable).where(eq(sessionsTable.date, today));
  let presentToday = 0;
  let absentToday = 0;
  if (todaySessions.length > 0) {
    for (const s of todaySessions) {
      const [p] = await db.select({ count: count() }).from(sessionRecordsTable).where(sql`${sessionRecordsTable.sessionId} = ${s.id} AND ${sessionRecordsTable.isPresent} = true`);
      const [a] = await db.select({ count: count() }).from(sessionRecordsTable).where(sql`${sessionRecordsTable.sessionId} = ${s.id} AND ${sessionRecordsTable.isPresent} = false`);
      presentToday += Number(p.count);
      absentToday += Number(a.count);
    }
  }

  const [latePayments] = await db.select({ count: count() }).from(invoicesTable).where(sql`${invoicesTable.status} = 'غير مدفوع' AND ${invoicesTable.month} <= ${currentMonth}`);
  const [weakStudents] = await db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.level, "ضعيف"));

  const monthInvoices = await db.select().from(invoicesTable).where(eq(invoicesTable.month, currentMonth));
  const totalRevenue = monthInvoices.filter(i => i.status === "مدفوع").reduce((sum, i) => sum + Number(i.amount), 0);
  const allExpenses = await db.select().from(expensesTable);
  const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const recentSessions = await db
    .select({
      id: sessionsTable.id,
      circleId: sessionsTable.circleId,
      circleName: circlesTable.name,
      date: sessionsTable.date,
      status: sessionsTable.status,
      teacherId: sessionsTable.teacherId,
      day: sessionsTable.day,
      time: sessionsTable.time,
      createdAt: sessionsTable.createdAt,
    })
    .from(sessionsTable)
    .leftJoin(circlesTable, eq(sessionsTable.circleId, circlesTable.id))
    .orderBy(sql`${sessionsTable.createdAt} DESC`)
    .limit(5);

  const recentNotifications = await db
    .select({
      id: notificationsTable.id,
      type: notificationsTable.type,
      title: notificationsTable.title,
      message: notificationsTable.message,
      studentId: notificationsTable.studentId,
      isRead: notificationsTable.isRead,
      priority: notificationsTable.priority,
      createdAt: notificationsTable.createdAt,
    })
    .from(notificationsTable)
    .orderBy(sql`${notificationsTable.createdAt} DESC`)
    .limit(5);

  res.json({
    total_students: Number(totalStudents.count),
    total_teachers: Number(totalTeachers.count),
    total_circles: Number(totalCircles.count),
    total_sessions: Number(totalSessions.count),
    present_today: presentToday,
    absent_today: absentToday,
    late_students: 0,
    weak_students: Number(weakStudents.count),
    late_payments: Number(latePayments.count),
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    profit: totalRevenue - totalExpenses,
    recent_sessions: recentSessions.map(s => ({
      ...toSnakeCase(s as any),
      student_count: 0,
      present_count: 0,
      teacher_name: null,
    })),
    recent_notifications: recentNotifications.map(n => ({
      ...toSnakeCase(n as any),
      student_name: null,
    })),
  });
});

export default router;
