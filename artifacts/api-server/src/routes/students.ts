import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { db, studentsTable, teachersTable, circlesTable } from "@workspace/db";
import {
  CreateStudentBody,
  UpdateStudentBody,
  GetStudentParams,
  UpdateStudentParams,
  DeleteStudentParams,
  ListStudentsQueryParams,
} from "@workspace/api-zod";
import { toSnakeCaseArray, toSnakeCase } from "../lib/transform";

const router: IRouter = Router();

function formatStudent(s: Record<string, unknown>) {
  return {
    ...toSnakeCase(s),
    payment_amount: s.paymentAmount != null ? Number(s.paymentAmount) : null,
  };
}

router.get("/students", async (req, res): Promise<void> => {
  const query = ListStudentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.search) conditions.push(ilike(studentsTable.fullName, `%${query.data.search}%`));
  if (query.data.circle_id) conditions.push(eq(studentsTable.circleId, query.data.circle_id));
  if (query.data.level) conditions.push(eq(studentsTable.level, query.data.level));
  if (query.data.payment_status) conditions.push(eq(studentsTable.paymentStatus, query.data.payment_status));

  const students = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      photoUrl: studentsTable.photoUrl,
      age: studentsTable.age,
      birthDate: studentsTable.birthDate,
      grade: studentsTable.grade,
      address: studentsTable.address,
      governorate: studentsTable.governorate,
      guardianPhone: studentsTable.guardianPhone,
      secondaryPhone: studentsTable.secondaryPhone,
      email: studentsTable.email,
      teacherId: studentsTable.teacherId,
      teacherName: teachersTable.fullName,
      circleId: studentsTable.circleId,
      circleName: circlesTable.name,
      paymentStatus: studentsTable.paymentStatus,
      paymentAmount: studentsTable.paymentAmount,
      isExempt: studentsTable.isExempt,
      currentMemorization: studentsTable.currentMemorization,
      currentRevision: studentsTable.currentRevision,
      level: studentsTable.level,
      rating: studentsTable.rating,
      notes: studentsTable.notes,
      enrollmentDate: studentsTable.enrollmentDate,
      points: studentsTable.points,
      createdAt: studentsTable.createdAt,
      updatedAt: studentsTable.updatedAt,
    })
    .from(studentsTable)
    .leftJoin(teachersTable, eq(studentsTable.teacherId, teachersTable.id))
    .leftJoin(circlesTable, eq(studentsTable.circleId, circlesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(studentsTable.fullName);

  res.json(students.map(s => formatStudent(s as any)));
});

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const [student] = await db.insert(studentsTable).values({
    fullName: d.full_name,
    photoUrl: d.photo_url,
    birthDate: d.birth_date,
    guardianPhone: d.guardian_phone,
    secondaryPhone: d.secondary_phone,
    teacherId: d.teacher_id,
    circleId: d.circle_id,
    paymentAmount: d.payment_amount?.toString(),
    enrollmentDate: d.enrollment_date ?? new Date().toISOString().split("T")[0],
    isExempt: d.is_exempt ?? false,
    grade: d.grade,
    age: d.age,
    address: d.address,
    governorate: d.governorate,
    email: d.email,
    paymentStatus: d.payment_status ?? "غير مدفوع",
    currentMemorization: d.current_memorization,
    currentRevision: d.current_revision,
    level: d.level,
    rating: d.rating,
    notes: d.notes,
  }).returning();

  res.status(201).json(formatStudent({ ...student, teacherName: null, circleName: null } as any));
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      photoUrl: studentsTable.photoUrl,
      age: studentsTable.age,
      birthDate: studentsTable.birthDate,
      grade: studentsTable.grade,
      address: studentsTable.address,
      governorate: studentsTable.governorate,
      guardianPhone: studentsTable.guardianPhone,
      secondaryPhone: studentsTable.secondaryPhone,
      email: studentsTable.email,
      teacherId: studentsTable.teacherId,
      teacherName: teachersTable.fullName,
      circleId: studentsTable.circleId,
      circleName: circlesTable.name,
      paymentStatus: studentsTable.paymentStatus,
      paymentAmount: studentsTable.paymentAmount,
      isExempt: studentsTable.isExempt,
      currentMemorization: studentsTable.currentMemorization,
      currentRevision: studentsTable.currentRevision,
      level: studentsTable.level,
      rating: studentsTable.rating,
      notes: studentsTable.notes,
      enrollmentDate: studentsTable.enrollmentDate,
      points: studentsTable.points,
      createdAt: studentsTable.createdAt,
      updatedAt: studentsTable.updatedAt,
    })
    .from(studentsTable)
    .leftJoin(teachersTable, eq(studentsTable.teacherId, teachersTable.id))
    .leftJoin(circlesTable, eq(studentsTable.circleId, circlesTable.id))
    .where(eq(studentsTable.id, params.data.id));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(formatStudent(student as any));
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data as any;
  const updates: Record<string, unknown> = {};
  if (d.full_name !== undefined) updates.fullName = d.full_name;
  if (d.photo_url !== undefined) updates.photoUrl = d.photo_url;
  if (d.birth_date !== undefined) updates.birthDate = d.birth_date;
  if (d.guardian_phone !== undefined) updates.guardianPhone = d.guardian_phone;
  if (d.secondary_phone !== undefined) updates.secondaryPhone = d.secondary_phone;
  if (d.teacher_id !== undefined) updates.teacherId = d.teacher_id;
  if (d.circle_id !== undefined) updates.circleId = d.circle_id;
  if (d.payment_amount !== undefined) updates.paymentAmount = d.payment_amount?.toString();
  if (d.is_exempt !== undefined) updates.isExempt = d.is_exempt;
  if (d.payment_status !== undefined) updates.paymentStatus = d.payment_status;
  if (d.grade !== undefined) updates.grade = d.grade;
  if (d.age !== undefined) updates.age = d.age;
  if (d.address !== undefined) updates.address = d.address;
  if (d.governorate !== undefined) updates.governorate = d.governorate;
  if (d.email !== undefined) updates.email = d.email;
  if (d.current_memorization !== undefined) updates.currentMemorization = d.current_memorization;
  if (d.current_revision !== undefined) updates.currentRevision = d.current_revision;
  if (d.level !== undefined) updates.level = d.level;
  if (d.rating !== undefined) updates.rating = d.rating;
  if (d.notes !== undefined) updates.notes = d.notes;
  if (d.points !== undefined) updates.points = d.points;

  const [student] = await db.update(studentsTable).set(updates).where(eq(studentsTable.id, params.data.id)).returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(formatStudent({ ...student, teacherName: null, circleName: null } as any));
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db.delete(studentsTable).where(eq(studentsTable.id, params.data.id)).returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json({ success: true, id: params.data.id });
});

export default router;
