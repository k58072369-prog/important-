import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, circlesTable, teachersTable, studentsTable } from "@workspace/db";
import {
  CreateCircleBody,
  UpdateCircleBody,
  GetCircleParams,
  UpdateCircleParams,
  DeleteCircleParams,
} from "@workspace/api-zod";
import { toSnakeCase } from "../lib/transform";

const router: IRouter = Router();

async function formatCircle(c: Record<string, unknown>) {
  const [studentCount] = await db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.circleId, c.id as string));
  return {
    ...toSnakeCase(c),
    student_count: Number(studentCount.count),
  };
}

router.get("/circles", async (_req, res): Promise<void> => {
  const circles = await db
    .select({
      id: circlesTable.id,
      name: circlesTable.name,
      description: circlesTable.description,
      days: circlesTable.days,
      time: circlesTable.time,
      teacherId: circlesTable.teacherId,
      teacherName: teachersTable.fullName,
      status: circlesTable.status,
      createdAt: circlesTable.createdAt,
      updatedAt: circlesTable.updatedAt,
    })
    .from(circlesTable)
    .leftJoin(teachersTable, eq(circlesTable.teacherId, teachersTable.id))
    .orderBy(circlesTable.name);

  const result = await Promise.all(circles.map(c => formatCircle(c as any)));
  res.json(result);
});

router.post("/circles", async (req, res): Promise<void> => {
  const parsed = CreateCircleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const [circle] = await db.insert(circlesTable).values({
    name: d.name,
    description: d.description,
    days: d.days,
    time: d.time,
    teacherId: d.teacher_id,
    status: d.status ?? "نشطة",
  }).returning();

  res.status(201).json(await formatCircle({ ...circle, teacherName: null } as any));
});

router.get("/circles/:id", async (req, res): Promise<void> => {
  const params = GetCircleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [circle] = await db
    .select({
      id: circlesTable.id,
      name: circlesTable.name,
      description: circlesTable.description,
      days: circlesTable.days,
      time: circlesTable.time,
      teacherId: circlesTable.teacherId,
      teacherName: teachersTable.fullName,
      status: circlesTable.status,
      createdAt: circlesTable.createdAt,
      updatedAt: circlesTable.updatedAt,
    })
    .from(circlesTable)
    .leftJoin(teachersTable, eq(circlesTable.teacherId, teachersTable.id))
    .where(eq(circlesTable.id, params.data.id));

  if (!circle) {
    res.status(404).json({ error: "Circle not found" });
    return;
  }

  res.json(await formatCircle(circle as any));
});

router.patch("/circles/:id", async (req, res): Promise<void> => {
  const params = UpdateCircleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCircleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const updates: Record<string, unknown> = {};
  if (d.name !== undefined) updates.name = d.name;
  if (d.description !== undefined) updates.description = d.description;
  if (d.days !== undefined) updates.days = d.days;
  if (d.time !== undefined) updates.time = d.time;
  if (d.teacher_id !== undefined) updates.teacherId = d.teacher_id;
  if (d.status !== undefined) updates.status = d.status;

  const [circle] = await db.update(circlesTable).set(updates).where(eq(circlesTable.id, params.data.id)).returning();

  if (!circle) {
    res.status(404).json({ error: "Circle not found" });
    return;
  }

  res.json(await formatCircle({ ...circle, teacherName: null } as any));
});

router.delete("/circles/:id", async (req, res): Promise<void> => {
  const params = DeleteCircleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [circle] = await db.delete(circlesTable).where(eq(circlesTable.id, params.data.id)).returning();

  if (!circle) {
    res.status(404).json({ error: "Circle not found" });
    return;
  }

  res.json({ success: true, id: params.data.id });
});

export default router;
