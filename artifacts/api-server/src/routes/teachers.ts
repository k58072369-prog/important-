import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, teachersTable, studentsTable, circlesTable } from "@workspace/db";
import {
  CreateTeacherBody,
  UpdateTeacherBody,
  GetTeacherParams,
  UpdateTeacherParams,
  DeleteTeacherParams,
} from "@workspace/api-zod";
import { toSnakeCase } from "../lib/transform";

const router: IRouter = Router();

async function formatTeacher(t: Record<string, unknown>) {
  const [studentCount] = await db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.teacherId, t.id as string));
  const [circleCount] = await db.select({ count: count() }).from(circlesTable).where(eq(circlesTable.teacherId, t.id as string));
  return {
    ...toSnakeCase(t),
    salary: t.salary != null ? Number(t.salary) : null,
    student_count: Number(studentCount.count),
    circle_count: Number(circleCount.count),
  };
}

router.get("/teachers", async (_req, res): Promise<void> => {
  const teachers = await db.select().from(teachersTable).orderBy(teachersTable.fullName);
  const result = await Promise.all(teachers.map(t => formatTeacher(t as any)));
  res.json(result);
});

router.post("/teachers", async (req, res): Promise<void> => {
  const parsed = CreateTeacherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const [teacher] = await db.insert(teachersTable).values({
    fullName: d.full_name,
    photoUrl: d.photo_url,
    secondaryPhone: d.secondary_phone,
    hireDate: d.hire_date,
    salary: d.salary?.toString(),
    phone: d.phone,
    age: d.age,
    email: d.email,
    address: d.address,
    experience: d.experience,
    notes: d.notes,
  }).returning();

  res.status(201).json(await formatTeacher(teacher as any));
});

router.get("/teachers/:id", async (req, res): Promise<void> => {
  const params = GetTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, params.data.id));

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(await formatTeacher(teacher as any));
});

router.patch("/teachers/:id", async (req, res): Promise<void> => {
  const params = UpdateTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTeacherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const updates: Record<string, unknown> = {};
  if (d.full_name !== undefined) updates.fullName = d.full_name;
  if (d.photo_url !== undefined) updates.photoUrl = d.photo_url;
  if (d.secondary_phone !== undefined) updates.secondaryPhone = d.secondary_phone;
  if (d.hire_date !== undefined) updates.hireDate = d.hire_date;
  if (d.salary !== undefined) updates.salary = d.salary?.toString();
  if (d.phone !== undefined) updates.phone = d.phone;
  if (d.age !== undefined) updates.age = d.age;
  if (d.email !== undefined) updates.email = d.email;
  if (d.address !== undefined) updates.address = d.address;
  if (d.experience !== undefined) updates.experience = d.experience;
  if (d.notes !== undefined) updates.notes = d.notes;

  const [teacher] = await db.update(teachersTable).set(updates).where(eq(teachersTable.id, params.data.id)).returning();

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(await formatTeacher(teacher as any));
});

router.delete("/teachers/:id", async (req, res): Promise<void> => {
  const params = DeleteTeacherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [teacher] = await db.delete(teachersTable).where(eq(teachersTable.id, params.data.id)).returning();

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json({ success: true, id: params.data.id });
});

export default router;
