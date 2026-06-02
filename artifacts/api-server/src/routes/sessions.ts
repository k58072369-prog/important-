import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, sessionsTable, sessionRecordsTable, circlesTable, teachersTable, studentsTable } from "@workspace/db";
import {
  CreateSessionBody,
  UpdateSessionBody,
  GetSessionParams,
  UpdateSessionParams,
  GetSessionRecordsParams,
  SaveSessionRecordsParams,
  SaveSessionRecordsBody,
  ListSessionsQueryParams,
} from "@workspace/api-zod";
import { toSnakeCase } from "../lib/transform";

const router: IRouter = Router();

async function formatSession(s: Record<string, unknown>) {
  const [total] = await db.select({ count: count() }).from(sessionRecordsTable).where(eq(sessionRecordsTable.sessionId, s.id as string));
  const [present] = await db.select({ count: count() }).from(sessionRecordsTable).where(and(eq(sessionRecordsTable.sessionId, s.id as string), eq(sessionRecordsTable.isPresent, true)));
  return {
    ...toSnakeCase(s),
    student_count: Number(total.count),
    present_count: Number(present.count),
  };
}

router.get("/sessions", async (req, res): Promise<void> => {
  const query = ListSessionsQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success && query.data.circle_id) conditions.push(eq(sessionsTable.circleId, query.data.circle_id));
  if (query.success && query.data.date) conditions.push(eq(sessionsTable.date, query.data.date));

  const sessions = await db
    .select({
      id: sessionsTable.id,
      circleId: sessionsTable.circleId,
      circleName: circlesTable.name,
      teacherId: sessionsTable.teacherId,
      teacherName: teachersTable.fullName,
      date: sessionsTable.date,
      day: sessionsTable.day,
      time: sessionsTable.time,
      status: sessionsTable.status,
      createdAt: sessionsTable.createdAt,
    })
    .from(sessionsTable)
    .leftJoin(circlesTable, eq(sessionsTable.circleId, circlesTable.id))
    .leftJoin(teachersTable, eq(sessionsTable.teacherId, teachersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sessionsTable.date);

  const result = await Promise.all(sessions.map(s => formatSession(s as any)));
  res.json(result);
});

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const [circle] = await db.select().from(circlesTable).where(eq(circlesTable.id, d.circle_id));
  const teacherId = circle?.teacherId;

  const [session] = await db.insert(sessionsTable).values({
    circleId: d.circle_id,
    teacherId: teacherId ?? undefined,
    date: d.date,
    day: d.day,
    time: d.time,
    status: d.status ?? "مكتملة",
  }).returning();

  if (d.circle_id) {
    const circleStudents = await db.select().from(studentsTable).where(eq(studentsTable.circleId, d.circle_id));
    const prevSessions = await db.select().from(sessionsTable)
      .where(eq(sessionsTable.circleId, d.circle_id))
      .orderBy(sessionsTable.createdAt);
    const prevSession = prevSessions.filter(s => s.id !== session.id).at(-1);
    const prevRecordsMap = new Map<string, typeof sessionRecordsTable.$inferSelect>();
    if (prevSession) {
      const prevRecords = await db.select().from(sessionRecordsTable).where(eq(sessionRecordsTable.sessionId, prevSession.id));
      prevRecords.forEach(r => prevRecordsMap.set(r.studentId, r));
    }
    if (circleStudents.length > 0) {
      await db.insert(sessionRecordsTable).values(
        circleStudents.map(student => {
          const prev = prevRecordsMap.get(student.id);
          return {
            sessionId: session.id,
            studentId: student.id,
            isPresent: true,
            memorizationAmount: prev?.nextMemorization ?? student.currentMemorization ?? null,
            revisionAmount: prev?.nextRevision ?? student.currentRevision ?? null,
          };
        })
      );
    }
  }

  res.status(201).json(await formatSession({ ...session, circleName: null, teacherName: null } as any));
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .select({
      id: sessionsTable.id,
      circleId: sessionsTable.circleId,
      circleName: circlesTable.name,
      teacherId: sessionsTable.teacherId,
      teacherName: teachersTable.fullName,
      date: sessionsTable.date,
      day: sessionsTable.day,
      time: sessionsTable.time,
      status: sessionsTable.status,
      createdAt: sessionsTable.createdAt,
    })
    .from(sessionsTable)
    .leftJoin(circlesTable, eq(sessionsTable.circleId, circlesTable.id))
    .leftJoin(teachersTable, eq(sessionsTable.teacherId, teachersTable.id))
    .where(eq(sessionsTable.id, params.data.id));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(await formatSession(session as any));
});

router.patch("/sessions/:id", async (req, res): Promise<void> => {
  const params = UpdateSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const updates: Record<string, unknown> = {};
  if (d.date !== undefined) updates.date = d.date;
  if (d.day !== undefined) updates.day = d.day;
  if (d.time !== undefined) updates.time = d.time;
  if (d.status !== undefined) updates.status = d.status;

  const [session] = await db.update(sessionsTable).set(updates).where(eq(sessionsTable.id, params.data.id)).returning();

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(await formatSession({ ...session, circleName: null, teacherName: null } as any));
});

router.get("/sessions/:id/records", async (req, res): Promise<void> => {
  const params = GetSessionRecordsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const records = await db
    .select({
      id: sessionRecordsTable.id,
      sessionId: sessionRecordsTable.sessionId,
      studentId: sessionRecordsTable.studentId,
      studentName: studentsTable.fullName,
      isPresent: sessionRecordsTable.isPresent,
      memorizationAmount: sessionRecordsTable.memorizationAmount,
      revisionAmount: sessionRecordsTable.revisionAmount,
      nextMemorization: sessionRecordsTable.nextMemorization,
      nextRevision: sessionRecordsTable.nextRevision,
      grade: sessionRecordsTable.grade,
      performanceLabel: sessionRecordsTable.performanceLabel,
      notes: sessionRecordsTable.notes,
    })
    .from(sessionRecordsTable)
    .leftJoin(studentsTable, eq(sessionRecordsTable.studentId, studentsTable.id))
    .where(eq(sessionRecordsTable.sessionId, params.data.id));

  res.json(records.map(r => toSnakeCase(r as any)));
});

router.post("/sessions/:id/records", async (req, res): Promise<void> => {
  const params = SaveSessionRecordsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SaveSessionRecordsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const records = (parsed.data as any).records;

  const results = await Promise.all(records.map(async (r: any) => {
    const values = {
      sessionId: params.data.id,
      studentId: r.student_id,
      isPresent: r.is_present,
      memorizationAmount: r.memorization_amount,
      revisionAmount: r.revision_amount,
      nextMemorization: r.next_memorization,
      nextRevision: r.next_revision,
      performanceLabel: r.performance_label,
      grade: r.grade,
      notes: r.notes,
    };

    const existing = await db.select().from(sessionRecordsTable).where(
      and(eq(sessionRecordsTable.sessionId, params.data.id), eq(sessionRecordsTable.studentId, r.student_id))
    );

    if (existing.length > 0) {
      const [updated] = await db.update(sessionRecordsTable).set(values).where(
        and(eq(sessionRecordsTable.sessionId, params.data.id), eq(sessionRecordsTable.studentId, r.student_id))
      ).returning();
      return updated;
    } else {
      const [inserted] = await db.insert(sessionRecordsTable).values(values).returning();
      return inserted;
    }
  }));

  res.json(results.map(r => toSnakeCase(r as any)));
});

export default router;
