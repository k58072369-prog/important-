import React, { createContext, useContext, useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db, genId, now,
  type Student, type Teacher, type Circle, type Session, type SessionRecord,
  type Invoice, type Expense, type SalaryRecord, type Notification,
  type Course, type CourseStudent, type CourseSession, type CourseSessionRecord,
  type Competition, type CompetitionLevel, type CompetitionEnrollment, type CompetitionResult,
  type ActivityLog,
} from "./db";

export type {
  Student, Teacher, Circle, Session, SessionRecord,
  Invoice, Expense, SalaryRecord, Notification,
  Course, CourseStudent, CourseSession, CourseSessionRecord,
  Competition, CompetitionLevel, CompetitionEnrollment, CompetitionResult,
};

interface StoreContextType {
  refresh: () => void;
}
const StoreContext = createContext<StoreContextType>({ refresh: () => {} });
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  return <StoreContext.Provider value={{ refresh }}>{children}</StoreContext.Provider>;
}
export function useStore() { return useContext(StoreContext); }

// ─── HELPERS ───────────────────────────────────────────────────────────────
async function resolveTeacherName(teacher_id?: string): Promise<string | undefined> {
  if (!teacher_id || teacher_id === "none") return undefined;
  const t = await db.teachers.get(teacher_id);
  return t?.full_name;
}
async function resolveCircleName(circle_id?: string): Promise<string | undefined> {
  if (!circle_id || circle_id === "none") return undefined;
  const c = await db.circles.get(circle_id);
  return c?.name;
}

async function logActivity(params: {
  action: ActivityLog["action"];
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  details?: string;
}) {
  try {
    await db.activity_logs.add({ id: genId(), ...params, created_at: now() });
  } catch { /* never block main flow */ }
}

// ─── STUDENTS ──────────────────────────────────────────────────────────────
// ─── STUDENT CODES ─────────────────────────────────────────────────────────
const CODE_COUNTER_KEY = "furqan_student_code_counter";

function generateStudentCode(): string {
  const current = parseInt(localStorage.getItem(CODE_COUNTER_KEY) ?? "0", 10);
  const next = current + 1;
  localStorage.setItem(CODE_COUNTER_KEY, String(next));
  return `STD-${String(next).padStart(5, "0")}`;
}

export async function backfillStudentCodes(): Promise<void> {
  try {
    const all = await db.students.toArray();
    const withoutCode = all.filter(s => !s.student_code);
    if (withoutCode.length === 0) return;
    for (const s of withoutCode) {
      const code = generateStudentCode();
      await db.students.update(s.id, { student_code: code, updated_at: now() });
    }
  } catch { /* ignore */ }
}

export function useStudents(search?: string) {
  const students = useLiveQuery(async () => {
    let all = await db.students.orderBy("created_at").toArray();
    all = all.filter(s => !s.deleted_at);
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.toLowerCase().includes(q)) ||
        (s.guardian_phone && s.guardian_phone.includes(q))
      );
    }
    return all;
  }, [search]);
  return { students: students ?? [], loading: students === undefined };
}

export async function addStudent(data: Omit<Student, "id" | "created_at" | "updated_at">) {
  const id = genId();
  const ts = now();
  const teacher_name = await resolveTeacherName(data.teacher_id);
  const circle_name = await resolveCircleName(data.circle_id);
  const student_code = data.student_code || generateStudentCode();
  await db.students.add({ ...data, id, student_code, teacher_name, circle_name, created_at: ts, updated_at: ts });
  if (!data.is_exempt && data.payment_amount && data.payment_amount > 0) {
    await _generateMonthlyInvoice(id, data.full_name, data.payment_amount);
  }
  return id;
}

export async function updateStudent(id: string, data: Partial<Omit<Student, "id" | "created_at">>) {
  if (data.teacher_id !== undefined) {
    data.teacher_name = await resolveTeacherName(data.teacher_id);
  }
  if (data.circle_id !== undefined) {
    data.circle_name = await resolveCircleName(data.circle_id);
  }
  await db.students.update(id, { ...data, updated_at: now() });
}

export async function deleteStudent(id: string) {
  const s = await db.students.get(id);
  await db.students.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "طالب", entity_id: id, entity_name: s?.full_name });
}

// ─── TEACHERS ─────────────────────────────────────────────────────────────
export function useTeachers() {
  const teachers = useLiveQuery(async () => {
    let all = await db.teachers.orderBy("created_at").toArray();
    all = all.filter(t => !t.deleted_at);
    return Promise.all(all.map(async t => {
      const circles = await db.circles.where("teacher_id").equals(t.id).count();
      const students = await db.students.where("teacher_id").equals(t.id).count();
      return { ...t, circle_count: circles, student_count: students };
    }));
  }, []);
  return { teachers: teachers ?? [], loading: teachers === undefined };
}

export async function addTeacher(data: Omit<Teacher, "id" | "created_at" | "updated_at" | "circle_count" | "student_count">) {
  const id = genId();
  const ts = now();
  await db.teachers.add({ ...data, id, created_at: ts, updated_at: ts });
  return id;
}

export async function updateTeacher(id: string, data: Partial<Omit<Teacher, "id" | "created_at" | "circle_count" | "student_count">>) {
  await db.teachers.update(id, { ...data, updated_at: now() });
  if (data.full_name) {
    await db.students.where("teacher_id").equals(id).modify({ teacher_name: data.full_name, updated_at: now() });
    await db.circles.where("teacher_id").equals(id).modify({ teacher_name: data.full_name, updated_at: now() });
  }
}

export async function deleteTeacher(id: string) {
  const t = await db.teachers.get(id);
  await db.teachers.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "معلم", entity_id: id, entity_name: t?.full_name });
}

// ─── CIRCLES ───────────────────────────────────────────────────────────────
export function useCircles() {
  const circles = useLiveQuery(async () => {
    let all = await db.circles.orderBy("created_at").toArray();
    all = all.filter(c => !c.deleted_at);
    return Promise.all(all.map(async c => {
      const count = await db.students.where("circle_id").equals(c.id).count();
      return { ...c, student_count: count };
    }));
  }, []);
  return { circles: circles ?? [], loading: circles === undefined };
}

export async function addCircle(data: Omit<Circle, "id" | "created_at" | "updated_at" | "student_count">) {
  const id = genId();
  const ts = now();
  const teacher_name = await resolveTeacherName(data.teacher_id);
  await db.circles.add({ ...data, id, teacher_name, created_at: ts, updated_at: ts });
  return id;
}

export async function updateCircle(id: string, data: Partial<Omit<Circle, "id" | "created_at" | "student_count">>) {
  if (data.teacher_id !== undefined) {
    data.teacher_name = await resolveTeacherName(data.teacher_id);
  }
  await db.circles.update(id, { ...data, updated_at: now() });
}

export async function deleteCircle(id: string) {
  const c = await db.circles.get(id);
  await db.circles.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "حلقة", entity_id: id, entity_name: c?.name });
}

// ─── SESSIONS ──────────────────────────────────────────────────────────────
export function useSessions(circleId?: string) {
  const sessions = useLiveQuery(async () => {
    let all = await db.sessions.orderBy("created_at").toArray();
    all = all.filter(s => !s.deleted_at);
    if (circleId && circleId !== "all") {
      all = all.filter(s => s.circle_id === circleId);
    }
    return all;
  }, [circleId]);
  return { sessions: sessions ?? [], loading: sessions === undefined };
}

export async function addSession(data: {
  circle_id: string;
  date: string;
  day?: string;
  time?: string;
  status: string;
}): Promise<string> {
  const id = genId();
  const ts = now();
  const circle = await db.circles.get(data.circle_id);
  const teacher_name = circle?.teacher_name;
  const teacher_id = circle?.teacher_id;
  const circle_name = circle?.name;
  const studentCount = await db.students.where("circle_id").equals(data.circle_id).count();
  await db.sessions.add({
    ...data,
    id,
    circle_name,
    teacher_id,
    teacher_name,
    student_count: studentCount,
    present_count: 0,
    created_at: ts,
  });
  return id;
}

export async function getSession(id: string) {
  return db.sessions.get(id);
}

export async function saveSessionRecords(sessionId: string, records: Omit<SessionRecord, "id" | "created_at">[]) {
  const ts = now();
  const toAdd: SessionRecord[] = records.map(r => ({ ...r, id: genId(), created_at: ts }));
  await db.session_records.bulkAdd(toAdd);
  const presentCount = records.filter(r => r.is_present).length;
  await db.sessions.update(sessionId, { present_count: presentCount, student_count: records.length });

  for (const r of records) {
    if (r.is_present && (r.memorization_amount || r.revision_amount)) {
      const updates: Partial<Student> = { updated_at: ts };
      if (r.memorization_amount) updates.current_memorization = r.memorization_amount;
      if (r.revision_amount) updates.current_revision = r.revision_amount;
      if (r.performance_label) updates.level = r.performance_label;
      await db.students.update(r.student_id, updates);
    }
    if (!r.is_present) {
      await addNotification({
        title: "غياب طالب",
        message: `الطالب ${r.student_name} غائب عن حصة اليوم`,
        type: "غياب",
        priority: "مهم",
        student_name: r.student_name,
        student_id: r.student_id,
        is_read: false,
      });
    }
  }
}

export function useSessionRecords(sessionId: string | null) {
  const records = useLiveQuery(async () => {
    if (!sessionId) return [];
    return db.session_records.where("session_id").equals(sessionId).toArray();
  }, [sessionId]);
  return { records: records ?? [], loading: records === undefined };
}

// ─── FINANCE ───────────────────────────────────────────────────────────────
export function useInvoices(search?: string) {
  const invoices = useLiveQuery(async () => {
    let all = await db.invoices.orderBy("created_at").toArray();
    all = all.filter(inv => !inv.deleted_at);
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(inv => inv.student_name?.toLowerCase().includes(q));
    }
    return all;
  }, [search]);
  return { invoices: invoices ?? [], loading: invoices === undefined };
}

export async function addInvoice(data: Omit<Invoice, "id" | "created_at" | "updated_at">) {
  const id = genId();
  const ts = now();
  await db.invoices.add({ ...data, id, created_at: ts, updated_at: ts });
  return id;
}

export async function updateInvoice(id: string, data: Partial<Omit<Invoice, "id" | "created_at">>) {
  await db.invoices.update(id, { ...data, updated_at: now() });
}

export async function deleteInvoice(id: string) {
  const inv = await db.invoices.get(id);
  await db.invoices.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "فاتورة", entity_id: id, entity_name: inv ? `${inv.student_name} — ${inv.month}` : undefined });
}

export function useExpenses() {
  const expenses = useLiveQuery(() => db.expenses.filter(e => !e.deleted_at).sortBy("date").then(a => a.reverse()), []);
  return { expenses: expenses ?? [], loading: expenses === undefined };
}

export async function addExpense(data: Omit<Expense, "id" | "created_at">) {
  const id = genId();
  await db.expenses.add({ ...data, id, created_at: now() });
  return id;
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, "id" | "created_at">>) {
  await db.expenses.update(id, data);
}

export async function deleteExpense(id: string) {
  const e = await db.expenses.get(id);
  await db.expenses.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "مصروف", entity_id: id, entity_name: e?.name ?? e?.category });
}

// ─── SALARY RECORDS ────────────────────────────────────────────────────────
export function useSalaryRecords(month?: string) {
  const records = useLiveQuery(async () => {
    let all = await db.salary_records.orderBy("created_at").reverse().toArray();
    if (month) all = all.filter(r => r.month === month);
    return Promise.all(all.map(async r => {
      const teacher = r.teacher_id ? await db.teachers.get(r.teacher_id) : undefined;
      return { ...r, teacher_name: teacher?.full_name ?? r.teacher_name };
    }));
  }, [month]);
  return { salaryRecords: records ?? [], loading: records === undefined };
}

export async function addSalaryRecord(data: Omit<SalaryRecord, "id" | "created_at" | "updated_at">) {
  const id = genId();
  const ts = now();
  const teacher = data.teacher_id ? await db.teachers.get(data.teacher_id) : undefined;
  const rec: SalaryRecord = { ...data, id, teacher_name: teacher?.full_name ?? data.teacher_name, created_at: ts, updated_at: ts };
  await db.salary_records.add(rec);
  // Auto add as expense
  if (data.status === "مدفوع") {
    await addExpense({
      category: "رواتب",
      name: `راتب - ${teacher?.full_name ?? ""}`,
      description: `راتب شهر ${data.month}`,
      amount: data.total_amount,
      date: new Date().toISOString().split("T")[0],
      linked_to_type: "teacher",
      linked_to_id: data.teacher_id,
    });
  }
  return id;
}

export async function updateSalaryRecord(id: string, data: Partial<Omit<SalaryRecord, "id" | "created_at">>) {
  const existing = await db.salary_records.get(id);
  await db.salary_records.update(id, { ...data, updated_at: now() });
  // If marking as paid for the first time, add expense
  if (data.status === "مدفوع" && existing?.status !== "مدفوع") {
    const teacher = existing?.teacher_id ? await db.teachers.get(existing.teacher_id) : undefined;
    await addExpense({
      category: "رواتب",
      name: `راتب - ${teacher?.full_name ?? ""}`,
      description: `راتب شهر ${existing?.month ?? ""}`,
      amount: data.total_amount ?? existing?.total_amount ?? 0,
      date: new Date().toISOString().split("T")[0],
      linked_to_type: "teacher",
      linked_to_id: existing?.teacher_id,
    });
    await addNotification({
      title: "صرف راتب",
      message: `تم صرف راتب ${teacher?.full_name ?? ""} لشهر ${existing?.month ?? ""}`,
      type: "رواتب",
      priority: "عادي",
      teacher_name: teacher?.full_name,
      teacher_id: existing?.teacher_id,
      is_read: false,
    });
  }
}

export async function deleteSalaryRecord(id: string) {
  const r = await db.salary_records.get(id);
  await db.salary_records.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "سجل راتب", entity_id: id, entity_name: r ? `${r.teacher_name} — ${r.month}` : undefined });
}

export async function generateMonthSalaries(month: string) {
  const teachers = await db.teachers.toArray();
  for (const t of teachers) {
    if (!t.salary || t.salary <= 0) continue;
    const existing = await db.salary_records.where("teacher_id").equals(t.id).filter(r => r.month === month).count();
    if (existing > 0) continue;
    await addSalaryRecord({
      teacher_id: t.id,
      teacher_name: t.full_name,
      month,
      base_salary: t.salary,
      bonuses: 0,
      deductions: 0,
      total_amount: t.salary,
      payment_method: "نقداً",
      status: "معلق",
    });
  }
}

export function useFinanceSummary() {
  const summary = useLiveQuery(async () => {
    const invoices = (await db.invoices.toArray()).filter(i => !i.deleted_at);
    const expenses = (await db.expenses.toArray()).filter(e => !e.deleted_at);
    const salaries = (await db.salary_records.toArray()).filter(s => !s.deleted_at);
    const revenue = invoices.filter(i => i.status === "مدفوع").reduce((s, i) => s + i.amount, 0);
    const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const paidSalaries = salaries.filter(s => s.status === "مدفوع").reduce((s, r) => s + r.total_amount, 0);
    const totalExpenses = expTotal + paidSalaries;
    const paid = invoices.filter(i => i.status === "مدفوع").length;
    const unpaid = invoices.filter(i => i.status === "غير مدفوع" || i.status === "متأخر").length;
    const exempt = invoices.filter(i => i.status === "معفي").length;
    const partial = invoices.filter(i => i.status === "مدفوع جزئياً").length;
    return { revenue, expenses: totalExpenses, profit: revenue - totalExpenses, paid_invoices: paid, unpaid_invoices: unpaid, exempt_invoices: exempt, partial_invoices: partial };
  }, []);
  return { summary, loading: summary === undefined };
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
export function useNotifications() {
  const notifications = useLiveQuery(() => db.notifications.orderBy("created_at").reverse().toArray(), []);
  return { notifications: notifications ?? [], loading: notifications === undefined };
}

export async function addNotification(data: Omit<Notification, "id" | "created_at">) {
  await db.notifications.add({ ...data, id: genId(), created_at: now() });
}

export async function markNotificationRead(id: string) {
  await db.notifications.update(id, { is_read: true });
}

export async function markAllNotificationsRead() {
  await db.notifications.toCollection().modify({ is_read: true });
}

export async function deleteNotification(id: string) {
  await db.notifications.delete(id);
}

// ─── LEADERBOARD ───────────────────────────────────────────────────────────
export function useLeaderboard() {
  const leaderboard = useLiveQuery(async () => {
    const students = (await db.students.toArray()).filter(s => !s.deleted_at);
    const sessionRecords = await db.session_records.toArray();

    return students.map(s => {
      const myRecords = sessionRecords.filter(r => r.student_id === s.id);
      const totalSessions = myRecords.length;
      const presentSessions = myRecords.filter(r => r.is_present).length;
      const attendance_score = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
      const avgGrade = myRecords.filter(r => r.grade != null).reduce((s, r) => s + (r.grade ?? 0), 0) / (myRecords.filter(r => r.grade != null).length || 1);
      const memorization_score = Math.min(100, Math.round(avgGrade));
      const points = presentSessions * 10 + Math.round(memorization_score * 0.5) + (s.rating ?? 0) * 5;

      return {
        student_id: s.id,
        student_name: s.full_name,
        circle_name: s.circle_name,
        points,
        attendance_score,
        memorization_score,
        is_student_of_month: false,
      };
    }).sort((a, b) => b.points - a.points).slice(0, 25);
  }, []);
  return { leaderboard: leaderboard ?? [], loading: leaderboard === undefined };
}

// ─── COMPETITION LEADERBOARD ───────────────────────────────────────────────
export function useCompetitionLeaderboard(competitionId?: string) {
  const leaderboard = useLiveQuery(async () => {
    let results = await db.competition_results.toArray();
    if (competitionId) results = results.filter(r => r.competition_id === competitionId);
    const enrollments = await db.competition_enrollments.toArray();
    const levels = await db.competition_levels.toArray();

    const byStudent: Record<string, { student_id: string; student_name: string; level_name: string; best_score: number; best_grade: string; degree: number; results: CompetitionResult[] }> = {};
    for (const r of results) {
      const enr = enrollments.find(e => e.id === r.enrollment_id);
      const lvl = levels.find(l => l.id === r.level_id);
      if (!byStudent[r.student_id]) {
        byStudent[r.student_id] = { student_id: r.student_id, student_name: r.student_name, level_name: lvl?.name ?? "", best_score: 0, best_grade: "", degree: 0, results: [] };
      }
      byStudent[r.student_id].results.push(r);
      if ((r.score ?? 0) > byStudent[r.student_id].best_score) {
        byStudent[r.student_id].best_score = r.score ?? 0;
        byStudent[r.student_id].best_grade = r.grade ?? "";
        byStudent[r.student_id].degree = r.degree ?? 0;
        byStudent[r.student_id].level_name = lvl?.name ?? (enr?.level_name ?? "");
      }
    }

    return Object.values(byStudent).sort((a, b) => b.best_score - a.best_score);
  }, [competitionId]);
  return { leaderboard: leaderboard ?? [], loading: leaderboard === undefined };
}

// ─── COURSES ────────────────────────────────────────────────────────────────
export function useCourses() {
  const courses = useLiveQuery(async () => {
    let all = await db.courses.orderBy("created_at").reverse().toArray();
    all = all.filter(c => !c.deleted_at);
    return Promise.all(all.map(async c => {
      const count = await db.course_students.where("course_id").equals(c.id).count();
      return { ...c, student_count: count };
    }));
  }, []);
  return { courses: courses ?? [], loading: courses === undefined };
}

export async function addCourse(data: Omit<Course, "id" | "created_at" | "updated_at" | "student_count">) {
  const id = genId();
  const ts = now();
  const teacher_name = await resolveTeacherName(data.teacher_id);
  await db.courses.add({ ...data, id, teacher_name, created_at: ts, updated_at: ts });
  await addNotification({
    title: "دورة جديدة",
    message: `تم إنشاء دورة جديدة: ${data.name}`,
    type: "دورات",
    priority: "عادي",
    is_read: false,
  });
  return id;
}

export async function updateCourse(id: string, data: Partial<Omit<Course, "id" | "created_at" | "student_count">>) {
  if (data.teacher_id !== undefined) {
    data.teacher_name = await resolveTeacherName(data.teacher_id);
  }
  await db.courses.update(id, { ...data, updated_at: now() });
}

export async function deleteCourse(id: string) {
  const c = await db.courses.get(id);
  await db.courses.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "دورة", entity_id: id, entity_name: c?.name });
}

export function useCourseStudents(courseId: string) {
  const students = useLiveQuery(async () => {
    return db.course_students.where("course_id").equals(courseId).toArray();
  }, [courseId]);
  return { students: students ?? [], loading: students === undefined };
}

export async function enrollStudentInCourse(courseId: string, studentId: string) {
  const student = await db.students.get(studentId);
  if (!student) return;
  const existing = await db.course_students.where("course_id").equals(courseId).filter(e => e.student_id === studentId).count();
  if (existing > 0) return;
  await db.course_students.add({ id: genId(), course_id: courseId, student_id: studentId, student_name: student.full_name, enrolled_at: now() });
}

export async function unenrollStudentFromCourse(courseId: string, studentId: string) {
  await db.course_students.where("course_id").equals(courseId).filter(e => e.student_id === studentId).delete();
}

export function useCourseSessions(courseId?: string) {
  const sessions = useLiveQuery(async () => {
    if (!courseId) return [];
    return db.course_sessions.where("course_id").equals(courseId).sortBy("date");
  }, [courseId]);
  return { sessions: sessions ?? [], loading: sessions === undefined };
}

export async function addCourseSession(data: Omit<CourseSession, "id" | "created_at">) {
  const id = genId();
  const course = data.course_id ? await db.courses.get(data.course_id) : undefined;
  await db.course_sessions.add({ ...data, id, course_name: course?.name ?? data.course_name, created_at: now() });
  return id;
}

export async function updateCourseSession(id: string, data: Partial<Omit<CourseSession, "id" | "created_at">>) {
  await db.course_sessions.update(id, data);
}

export async function deleteCourseSession(id: string) {
  await db.course_sessions.delete(id);
  await db.course_session_records.where("course_session_id").equals(id).delete();
}

export function useCourseSessionRecords(sessionId: string | null) {
  const records = useLiveQuery(async () => {
    if (!sessionId) return [];
    return db.course_session_records.where("course_session_id").equals(sessionId).toArray();
  }, [sessionId]);
  return { records: records ?? [], loading: records === undefined };
}

export async function saveCourseSessionRecords(sessionId: string, records: Omit<CourseSessionRecord, "id" | "created_at">[]) {
  await db.course_session_records.where("course_session_id").equals(sessionId).delete();
  const toAdd = records.map(r => ({ ...r, id: genId(), created_at: now() }));
  await db.course_session_records.bulkAdd(toAdd);
  const presentCount = records.filter(r => r.status === "حضور").length;
  await db.course_sessions.update(sessionId, { present_count: presentCount, student_count: records.length });
}

// ─── COMPETITIONS ──────────────────────────────────────────────────────────
export function useCompetitions() {
  const competitions = useLiveQuery(async () => {
    let all = await db.competitions.orderBy("created_at").reverse().toArray();
    all = all.filter(c => !c.deleted_at);
    return Promise.all(all.map(async c => {
      const level_count = await db.competition_levels.where("competition_id").equals(c.id).count();
      const participant_count = await db.competition_enrollments.where("competition_id").equals(c.id).count();
      return { ...c, level_count, participant_count };
    }));
  }, []);
  return { competitions: competitions ?? [], loading: competitions === undefined };
}

export async function addCompetition(data: Omit<Competition, "id" | "created_at" | "updated_at" | "level_count" | "participant_count">) {
  const id = genId();
  const ts = now();
  await db.competitions.add({ ...data, id, created_at: ts, updated_at: ts });
  await addNotification({
    title: "مسابقة جديدة",
    message: `تم إنشاء مسابقة جديدة: ${data.name}`,
    type: "مسابقات",
    priority: "عادي",
    is_read: false,
  });
  return id;
}

export async function updateCompetition(id: string, data: Partial<Omit<Competition, "id" | "created_at" | "level_count" | "participant_count">>) {
  await db.competitions.update(id, { ...data, updated_at: now() });
}

export async function deleteCompetition(id: string) {
  const c = await db.competitions.get(id);
  await db.competitions.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "مسابقة", entity_id: id, entity_name: c?.name });
}

export function useCompetitionLevels(competitionId?: string) {
  const levels = useLiveQuery(async () => {
    if (!competitionId) return [];
    const all = await db.competition_levels.where("competition_id").equals(competitionId).toArray();
    return Promise.all(all.map(async l => {
      const student_count = await db.competition_enrollments.where("level_id").equals(l.id).count();
      return { ...l, student_count };
    }));
  }, [competitionId]);
  return { levels: levels ?? [], loading: levels === undefined };
}

export async function addCompetitionLevel(data: Omit<CompetitionLevel, "id" | "created_at" | "student_count">) {
  const id = genId();
  const competition = data.competition_id ? await db.competitions.get(data.competition_id) : undefined;
  await db.competition_levels.add({ ...data, id, competition_name: competition?.name ?? data.competition_name, created_at: now() });
  return id;
}

export async function updateCompetitionLevel(id: string, data: Partial<Omit<CompetitionLevel, "id" | "created_at" | "student_count">>) {
  await db.competition_levels.update(id, data);
}

export async function deleteCompetitionLevel(id: string) {
  const l = await db.competition_levels.get(id);
  await db.competition_levels.update(id, { deleted_at: now() });
  await logActivity({ action: "DELETE", entity_type: "مستوى مسابقة", entity_id: id, entity_name: l?.name });
}

export function useCompetitionEnrollments(levelId?: string, competitionId?: string) {
  const enrollments = useLiveQuery(async () => {
    let all = await db.competition_enrollments.toArray();
    if (levelId) all = all.filter(e => e.level_id === levelId);
    else if (competitionId) all = all.filter(e => e.competition_id === competitionId);
    return all;
  }, [levelId, competitionId]);
  return { enrollments: enrollments ?? [], loading: enrollments === undefined };
}

export async function enrollStudentInLevel(data: Omit<CompetitionEnrollment, "id" | "enrolled_at">) {
  const existing = await db.competition_enrollments.where("level_id").equals(data.level_id).filter(e => e.student_id === data.student_id).count();
  if (existing > 0) return;
  const level = await db.competition_levels.get(data.level_id);
  await db.competition_enrollments.add({ ...data, id: genId(), level_name: level?.name ?? data.level_name, enrolled_at: now() });
}

export async function unenrollStudentFromLevel(enrollmentId: string) {
  await db.competition_enrollments.delete(enrollmentId);
}

export function useCompetitionResults(levelId?: string, competitionId?: string) {
  const results = useLiveQuery(async () => {
    let all = await db.competition_results.toArray();
    if (levelId) all = all.filter(r => r.level_id === levelId);
    else if (competitionId) all = all.filter(r => r.competition_id === competitionId);
    return all;
  }, [levelId, competitionId]);
  return { results: results ?? [], loading: results === undefined };
}

export async function saveCompetitionResult(data: Omit<CompetitionResult, "id" | "created_at" | "updated_at">) {
  const existing = await db.competition_results.where("enrollment_id").equals(data.enrollment_id).toArray();
  if (existing.length > 0) {
    await db.competition_results.update(existing[0].id, { ...data, updated_at: now() });
    return existing[0].id;
  }
  const id = genId();
  const ts = now();
  await db.competition_results.add({ ...data, id, created_at: ts, updated_at: ts });
  // Notify
  const gradeLabel = data.grade ?? "";
  await addNotification({
    title: "نتيجة مسابقة",
    message: `${data.student_name} حصل على تقدير "${gradeLabel}" في المسابقة`,
    type: "مسابقات",
    priority: "عادي",
    student_name: data.student_name,
    student_id: data.student_id,
    is_read: false,
  });
  return id;
}

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────
export function useDashboardStats() {
  const stats = useLiveQuery(async () => {
    const [students, teachers, circles, sessions, invoices, expenses, notifications, courses, competitions, salaryRecords] = await Promise.all([
      db.students.count(),
      db.teachers.count(),
      db.circles.where("status").equals("نشطة").count(),
      db.sessions.count(),
      db.invoices.toArray(),
      db.expenses.toArray(),
      db.notifications.orderBy("created_at").reverse().limit(5).toArray(),
      db.courses.count(),
      db.competitions.count(),
      db.salary_records.toArray(),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const todaySessions = await db.sessions.where("date").equals(today).toArray();
    let present_today = 0, absent_today = 0;
    for (const s of todaySessions) {
      present_today += s.present_count ?? 0;
      absent_today += (s.student_count ?? 0) - (s.present_count ?? 0);
    }

    const total_revenue = invoices.filter(i => i.status === "مدفوع").reduce((s, i) => s + i.amount, 0);
    const total_expenses = expenses.reduce((s, e) => s + e.amount, 0);
    const paidSalaries = salaryRecords.filter(s => s.status === "مدفوع").reduce((s, r) => s + r.total_amount, 0);
    const unpaid_invoices = invoices.filter(i => i.status === "غير مدفوع").length;
    const pending_salaries = salaryRecords.filter(s => s.status === "معلق").reduce((s, r) => s + r.total_amount, 0);

    return {
      total_students: students,
      total_teachers: teachers,
      total_circles: circles,
      total_sessions: sessions,
      total_courses: courses,
      total_competitions: competitions,
      present_today,
      absent_today,
      total_revenue,
      total_expenses: total_expenses + paidSalaries,
      profit: total_revenue - total_expenses - paidSalaries,
      unpaid_invoices,
      pending_salaries,
      recent_notifications: notifications,
    };
  }, []);
  return { stats, loading: stats === undefined };
}

// ─── INVOICE AUTO-GENERATION ───────────────────────────────────────────────
async function _generateMonthlyInvoice(student_id: string, student_name: string, amount: number) {
  const month = new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  const existing = await db.invoices.where("student_id").equals(student_id).filter(i => i.month === month).count();
  if (existing === 0) {
    await addInvoice({ student_id, student_name, month, amount, status: "غير مدفوع" });
  }
}

export async function generateMonthlyInvoices(month?: string) {
  const monthLabel = month ?? new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  const students = await db.students.filter(s => !s.is_exempt && !!s.payment_amount && (s.payment_amount ?? 0) > 0).toArray();
  for (const s of students) {
    const existing = await db.invoices.where("student_id").equals(s.id).filter(i => i.month === monthLabel).count();
    if (existing === 0) {
      await addInvoice({ student_id: s.id, student_name: s.full_name, month: monthLabel, amount: s.payment_amount!, status: "غير مدفوع" });
    }
  }
  await addNotification({
    title: "فواتير شهرية",
    message: `تم إنشاء الفواتير الشهرية لـ ${monthLabel}`,
    type: "مالي",
    priority: "عادي",
    is_read: false,
  });
}

// ─── MONTHLY LEADERBOARD ─────────────────────────────────────────────────────
export function useMonthlyLeaderboard(month: string) {
  const leaderboard = useLiveQuery(async () => {
    const students = await db.students.toArray();
    const allSessions = await db.sessions.toArray();
    const monthSessions = allSessions.filter(s => s.date && s.date.startsWith(month));
    if (monthSessions.length === 0) return [];
    const sessionIds = new Set(monthSessions.map(s => s.id));
    const allRecords = await db.session_records.toArray();
    const monthRecords = allRecords.filter(r => sessionIds.has(r.session_id));

    const result = students.map(s => {
      const myRecs = monthRecords.filter(r => r.student_id === s.id);
      if (myRecs.length === 0) return null;
      const present = myRecs.filter(r => r.is_present).length;
      const attendance_score = Math.round((present / myRecs.length) * 100);
      const graded = myRecs.filter(r => r.grade != null && r.grade > 0);
      const avgGrade = graded.length > 0 ? graded.reduce((a, r) => a + (r.grade ?? 0), 0) / graded.length : 0;
      const memorization_score = Math.min(100, Math.round(avgGrade));
      const points = present * 10 + Math.round(memorization_score * 0.5) + (s.rating ?? 0) * 5;
      return {
        student_id: s.id,
        student_name: s.full_name,
        circle_name: s.circle_name,
        teacher_id: s.teacher_id,
        teacher_name: s.teacher_name,
        points,
        attendance_score,
        memorization_score,
        present_count: present,
        total_sessions: myRecs.length,
        is_student_of_month: false,
      };
    }).filter(Boolean) as any[];

    const sorted = (result as any[]).sort((a, b) => b.points - a.points).slice(0, 25);
    if (sorted.length > 0) (sorted[0] as any).is_student_of_month = true;
    return sorted;
  }, [month]);
  return { leaderboard: leaderboard ?? [], loading: leaderboard === undefined };
}

// ─── TEACHER MONTHLY LEADERBOARD ─────────────────────────────────────────────
export function useTeacherLeaderboard(month: string) {
  const leaderboard = useLiveQuery(async () => {
    const teachers = await db.teachers.toArray();
    const allStudents = await db.students.toArray();
    const allSessions = await db.sessions.toArray();
    const monthSessions = allSessions.filter(s => s.date && s.date.startsWith(month));
    if (monthSessions.length === 0) return [];
    const sessionIds = new Set(monthSessions.map(s => s.id));
    const allRecords = await db.session_records.toArray();
    const monthRecords = allRecords.filter(r => sessionIds.has(r.session_id));

    const result = teachers.map(t => {
      const myStudents = allStudents.filter(s => s.teacher_id === t.id);
      const myStudentIds = new Set(myStudents.map(s => s.id));
      const myRecs = monthRecords.filter(r => myStudentIds.has(r.student_id));
      if (myRecs.length === 0) return null;
      const present = myRecs.filter(r => r.is_present).length;
      const attendance_rate = Math.round((present / myRecs.length) * 100);
      const graded = myRecs.filter(r => r.grade != null && r.grade > 0);
      const avg_grade = graded.length > 0 ? Math.round(graded.reduce((a, r) => a + (r.grade ?? 0), 0) / graded.length) : 0;

      const studentPoints = myStudents.map(s => {
        const sRecs = monthRecords.filter(r => r.student_id === s.id);
        if (sRecs.length === 0) return 0;
        const sPresent = sRecs.filter(r => r.is_present).length;
        const sGraded = sRecs.filter(r => r.grade != null && r.grade > 0);
        const sAvg = sGraded.length > 0 ? sGraded.reduce((a, r) => a + (r.grade ?? 0), 0) / sGraded.length : 0;
        return sPresent * 10 + Math.round(sAvg * 0.5) + (s.rating ?? 0) * 5;
      });

      const activeCount = studentPoints.filter(p => p > 0).length;
      if (activeCount === 0) return null;
      const totalPoints = studentPoints.reduce((a, p) => a + p, 0);
      const topStudents = studentPoints.filter(p => p >= 50).length;
      const points = Math.round(totalPoints / activeCount) + topStudents * 5 + Math.round(attendance_rate * 0.3);
      return {
        teacher_id: t.id,
        teacher_name: t.full_name,
        student_count: activeCount,
        attendance_rate,
        avg_grade,
        top_students: topStudents,
        total_points_earned: totalPoints,
        points,
      };
    }).filter(Boolean);

    return (result as any[]).sort((a, b) => b.points - a.points);
  }, [month]);
  return { leaderboard: leaderboard ?? [], loading: leaderboard === undefined };
}

// ─── AVAILABLE MONTHS ─────────────────────────────────────────────────────────
export function useAvailableMonths() {
  const months = useLiveQuery(async () => {
    const sessions = await db.sessions.toArray();
    const monthSet = new Set<string>();
    for (const s of sessions) {
      if (s.date) monthSet.add(s.date.substring(0, 7));
    }
    const { getCurrentMonth } = await import("./db");
    const current = getCurrentMonth();
    monthSet.add(current);
    return Array.from(monthSet).sort().reverse();
  }, []);
  return { months: months ?? [], loading: months === undefined };
}

// ─── MONTHLY REPORTS ─────────────────────────────────────────────────────────
export function useMonthlyReports(studentId?: string) {
  const reports = useLiveQuery(async () => {
    const all = await db.monthly_reports.orderBy("month").reverse().toArray();
    if (studentId) return all.filter(r => r.student_id === studentId);
    return all;
  }, [studentId]);
  return { reports: reports ?? [], loading: reports === undefined };
}

function _buildEvaluationText(data: {
  student_name: string; month_label: string; sessions_count: number;
  present_count: number; attendance_pct: number; avg_grade: number;
  memorization_count: number; revision_count: number;
}): string {
  const { student_name, month_label, sessions_count, present_count, attendance_pct, avg_grade, memorization_count, revision_count } = data;
  const parts: string[] = [];
  const attLevel = attendance_pct >= 90 ? "ممتازاً" : attendance_pct >= 75 ? "جيداً" : attendance_pct >= 60 ? "متوسطاً" : "ضعيفاً";
  const attNote = attendance_pct >= 75 ? "مما يدل على انتظام واضح وحرص على التحصيل" : "وهذا يستوجب متابعة دقيقة مع ولي الأمر";
  parts.push(`أظهر الطالب ${student_name} خلال شهر ${month_label} مستوىً ${attLevel} في الالتزام بالحضور، إذ حضر ${present_count} من أصل ${sessions_count} حصصٍ مقررة بنسبة ${Math.round(attendance_pct)}%، ${attNote}.`);

  if (avg_grade >= 90) {
    parts.push(`وقد حقق درجاتٍ ممتازة في تقييمات الأداء بمتوسط ${avg_grade} درجة، مما يعكس مستوى الإتقان الرفيع في الحفظ والمراجعة.`);
  } else if (avg_grade >= 75) {
    parts.push(`وجاءت درجاته جيدة في تقييمات الأداء بمتوسط ${avg_grade} درجة، مع قدرة واعدة على التحسن المستمر.`);
  } else if (avg_grade >= 60) {
    parts.push(`وجاءت درجاته مقبولة في تقييمات الأداء بمتوسط ${avg_grade} درجة، ويحتاج إلى مزيد من الجهد والمراجعة المنتظمة.`);
  } else if (avg_grade > 0) {
    parts.push(`وجاءت درجاته منخفضة في تقييمات الأداء بمتوسط ${avg_grade} درجة، مما يستوجب اهتماماً خاصاً ومتابعةً مكثفة.`);
  }

  if (memorization_count > 0 || revision_count > 0) {
    const items: string[] = [];
    if (memorization_count > 0) items.push(`الحفظ الجديد في ${memorization_count} حصة`);
    if (revision_count > 0) items.push(`مراجعة المحفوظات في ${revision_count} حصة`);
    parts.push(`على صعيد التحصيل القرآني، تمكّن الطالب من ${items.join(" و")} خلال هذا الشهر.`);
  }

  if (attendance_pct >= 85 && avg_grade >= 80) {
    parts.push(`نوصي بالاستمرار في هذا المستوى المتميز وتشجيع الطالب على المشاركة في المسابقات القرآنية.`);
  } else if (attendance_pct < 70 || avg_grade < 60) {
    parts.push(`نوصي بالتواصل مع أولياء الأمور لمناقشة أسباب هذا المستوى ووضع خطة عملية للتحسين.`);
  } else {
    parts.push(`نوصي بالمداومة على المراجعة اليومية وزيادة وقت التحفيظ المنزلي للوصول إلى مستوى أفضل.`);
  }

  return parts.join(" ");
}

export async function generateMonthlyReport(studentId: string, month: string): Promise<string> {
  const { genId, now: nowFn, getMonthLabel } = await import("./db");
  const student = await db.students.get(studentId);
  if (!student) throw new Error("Student not found");

  const allSessions = await db.sessions.toArray();
  const monthSessions = allSessions.filter(s => s.date && s.date.startsWith(month));
  const sessionIds = new Set(monthSessions.map(s => s.id));
  const allRecords = await db.session_records.toArray();
  const myRecords = allRecords.filter(r => sessionIds.has(r.session_id) && r.student_id === studentId);

  const sessions_count = myRecords.length;
  const present_count = myRecords.filter(r => r.is_present).length;
  const absent_count = sessions_count - present_count;
  const late_count = myRecords.filter(r => !r.is_present && (r.notes?.includes("تأخر") || r.notes?.includes("متأخر"))).length;
  const excused_count = myRecords.filter(r => !r.is_present && (r.notes?.includes("اعتذار") || r.notes?.includes("عذر") || r.notes?.includes("مريض"))).length;
  const attendance_pct = sessions_count > 0 ? Math.round((present_count / sessions_count) * 100) : 0;

  const graded = myRecords.filter(r => r.grade != null && r.grade > 0);
  const avg_grade = graded.length > 0 ? Math.round(graded.reduce((a, r) => a + (r.grade ?? 0), 0) / graded.length) : 0;
  const max_grade = graded.length > 0 ? Math.max(...graded.map(r => r.grade ?? 0)) : 0;
  const min_grade = graded.length > 0 ? Math.min(...graded.map(r => r.grade ?? 0)) : 0;

  const memorization_count = myRecords.filter(r => r.is_present && r.memorization_amount && r.memorization_amount.trim()).length;
  const revision_count = myRecords.filter(r => r.is_present && r.revision_amount && r.revision_amount.trim()).length;

  // last memorization / revision position from session records
  const presentRecords = [...myRecords].filter(r => r.is_present);
  const lastMemoRec = [...presentRecords].reverse().find(r => r.next_memorization && r.next_memorization.trim());
  const lastRevRec = [...presentRecords].reverse().find(r => r.next_revision && r.next_revision.trim());
  const last_memorization = lastMemoRec?.next_memorization;
  const last_revision = lastRevRec?.next_revision;

  // performance labels
  const perf = myRecords.filter(r => r.is_present && r.performance_label);
  const rating_excellent = perf.filter(r => r.performance_label === "ممتاز").length;
  const rating_very_good = perf.filter(r => r.performance_label === "جيد جداً").length;
  const rating_good = perf.filter(r => r.performance_label === "جيد").length;
  const rating_acceptable = perf.filter(r => r.performance_label === "مقبول").length;
  const rating_poor = perf.filter(r => r.performance_label === "ضعيف").length;

  const month_label = getMonthLabel(month);

  const evaluation_text = _buildEvaluationText({
    student_name: student.full_name, month_label, sessions_count, present_count,
    attendance_pct, avg_grade, memorization_count, revision_count,
  });

  const existing = await db.monthly_reports.where("student_id").equals(studentId).filter(r => r.month === month).first();
  const reportId = existing?.id ?? genId();

  const reportData = {
    id: reportId,
    student_id: studentId,
    student_code: student.student_code,
    student_name: student.full_name,
    teacher_name: student.teacher_name,
    circle_name: student.circle_name,
    guardian_phone: student.guardian_phone,
    grade: student.grade,
    month,
    month_label,
    sessions_count,
    present_count,
    absent_count,
    late_count,
    excused_count,
    attendance_pct,
    avg_grade,
    max_grade,
    min_grade,
    memorization_count,
    revision_count,
    last_memorization,
    last_revision,
    rating_excellent,
    rating_very_good,
    rating_good,
    rating_acceptable,
    rating_poor,
    evaluation_text,
    created_at: nowFn(),
  };

  if (existing) {
    await db.monthly_reports.update(existing.id, reportData);
  } else {
    await db.monthly_reports.add(reportData);
  }
  return reportId;
}

export async function generateAllMonthlyReports(month: string): Promise<number> {
  const allStudents = await db.students.filter(s => !s.deleted_at).toArray();
  let count = 0;
  for (const s of allStudents) {
    try {
      await generateMonthlyReport(s.id, month);
      count++;
    } catch { /* skip */ }
  }
  return count;
}

// ─── TRASH + RESTORE + PERMANENT DELETE ─────────────────────────────────────
export function useTrash() {
  const trash = useLiveQuery(async () => {
    const [students, teachers, circles, invoices, expenses, courses, competitions] = await Promise.all([
      db.students.filter(s => !!s.deleted_at).toArray(),
      db.teachers.filter(t => !!t.deleted_at).toArray(),
      db.circles.filter(c => !!c.deleted_at).toArray(),
      db.invoices.filter(i => !!i.deleted_at).toArray(),
      db.expenses.filter(e => !!e.deleted_at).toArray(),
      db.courses.filter(c => !!c.deleted_at).toArray(),
      db.competitions.filter(c => !!c.deleted_at).toArray(),
    ]);
    return { students, teachers, circles, invoices, expenses, courses, competitions };
  }, []);
  return { trash, loading: trash === undefined };
}

export async function restoreStudent(id: string) {
  const s = await db.students.get(id);
  await db.students.update(id, { deleted_at: undefined });
  await logActivity({ action: "RESTORE", entity_type: "طالب", entity_id: id, entity_name: s?.full_name });
}

export async function permanentDeleteStudent(id: string) {
  const s = await db.students.get(id);
  await db.students.delete(id);
  await db.invoices.where("student_id").equals(id).delete();
  await logActivity({ action: "PERMANENT_DELETE", entity_type: "طالب", entity_id: id, entity_name: s?.full_name });
}

export async function restoreTeacher(id: string) {
  const t = await db.teachers.get(id);
  await db.teachers.update(id, { deleted_at: undefined });
  await logActivity({ action: "RESTORE", entity_type: "معلم", entity_id: id, entity_name: t?.full_name });
}

export async function permanentDeleteTeacher(id: string) {
  const t = await db.teachers.get(id);
  await db.teachers.delete(id);
  await logActivity({ action: "PERMANENT_DELETE", entity_type: "معلم", entity_id: id, entity_name: t?.full_name });
}

export async function restoreCircle(id: string) {
  const c = await db.circles.get(id);
  await db.circles.update(id, { deleted_at: undefined });
  await logActivity({ action: "RESTORE", entity_type: "حلقة", entity_id: id, entity_name: c?.name });
}

export async function permanentDeleteCircle(id: string) {
  const c = await db.circles.get(id);
  await db.circles.delete(id);
  await logActivity({ action: "PERMANENT_DELETE", entity_type: "حلقة", entity_id: id, entity_name: c?.name });
}

export async function restoreInvoice(id: string) {
  const inv = await db.invoices.get(id);
  await db.invoices.update(id, { deleted_at: undefined });
  await logActivity({ action: "RESTORE", entity_type: "فاتورة", entity_id: id, entity_name: inv ? `${inv.student_name} — ${inv.month}` : undefined });
}

export async function permanentDeleteInvoice(id: string) {
  const inv = await db.invoices.get(id);
  await db.invoices.delete(id);
  await logActivity({ action: "PERMANENT_DELETE", entity_type: "فاتورة", entity_id: id, entity_name: inv ? `${inv.student_name} — ${inv.month}` : undefined });
}

export async function restoreExpense(id: string) {
  const e = await db.expenses.get(id);
  await db.expenses.update(id, { deleted_at: undefined });
  await logActivity({ action: "RESTORE", entity_type: "مصروف", entity_id: id, entity_name: e?.name ?? e?.category });
}

export async function permanentDeleteExpense(id: string) {
  const e = await db.expenses.get(id);
  await db.expenses.delete(id);
  await logActivity({ action: "PERMANENT_DELETE", entity_type: "مصروف", entity_id: id, entity_name: e?.name ?? e?.category });
}

export async function restoreCourse(id: string) {
  const c = await db.courses.get(id);
  await db.courses.update(id, { deleted_at: undefined });
  await logActivity({ action: "RESTORE", entity_type: "دورة", entity_id: id, entity_name: c?.name });
}

export async function permanentDeleteCourse(id: string) {
  const c = await db.courses.get(id);
  await db.courses.delete(id);
  await db.course_students.where("course_id").equals(id).delete();
  const sessions = await db.course_sessions.where("course_id").equals(id).toArray();
  for (const s of sessions) {
    await db.course_session_records.where("course_session_id").equals(s.id).delete();
  }
  await db.course_sessions.where("course_id").equals(id).delete();
  await logActivity({ action: "PERMANENT_DELETE", entity_type: "دورة", entity_id: id, entity_name: c?.name });
}

export async function restoreCompetition(id: string) {
  const c = await db.competitions.get(id);
  await db.competitions.update(id, { deleted_at: undefined });
  await logActivity({ action: "RESTORE", entity_type: "مسابقة", entity_id: id, entity_name: c?.name });
}

export async function permanentDeleteCompetition(id: string) {
  const c = await db.competitions.get(id);
  await db.competitions.delete(id);
  const levels = await db.competition_levels.where("competition_id").equals(id).toArray();
  for (const l of levels) {
    await db.competition_enrollments.where("level_id").equals(l.id).delete();
    await db.competition_results.where("level_id").equals(l.id).delete();
  }
  await db.competition_levels.where("competition_id").equals(id).delete();
  await db.competition_enrollments.where("competition_id").equals(id).delete();
  await db.competition_results.where("competition_id").equals(id).delete();
  await logActivity({ action: "PERMANENT_DELETE", entity_type: "مسابقة", entity_id: id, entity_name: c?.name });
}

// ─── ACTIVITY LOG ────────────────────────────────────────────────────────────
export function useActivityLog() {
  const logs = useLiveQuery(
    () => db.activity_logs.orderBy("created_at").reverse().toArray(),
    []
  );
  return { logs: logs ?? [], loading: logs === undefined };
}

// ─── UPDATE SESSION RECORD (لتعديل الحضور لاحقاً) ────────────────────────────
export async function updateSessionRecord(id: string, data: Partial<Omit<SessionRecord, "id" | "created_at">>) {
  await db.session_records.update(id, data);
  const rec = await db.session_records.get(id);
  if (rec?.session_id) {
    const allRecs = await db.session_records.where("session_id").equals(rec.session_id).toArray();
    const presentCount = allRecs.filter(r => r.is_present).length;
    await db.sessions.update(rec.session_id, { present_count: presentCount });
  }
}

// ─── STUDENT SMART STATS ─────────────────────────────────────────────────────
export function useStudentStats(studentId: string | null) {
  const stats = useLiveQuery(async () => {
    if (!studentId) return null;
    const student = await db.students.get(studentId);
    if (!student) return null;

    const allRecords = await db.session_records.where("student_id").equals(studentId).toArray();
    const present = allRecords.filter(r => r.is_present);
    const absent = allRecords.filter(r => !r.is_present);
    const graded = present.filter(r => r.grade != null && r.grade > 0);
    const avgGrade = graded.length > 0 ? Math.round(graded.reduce((a, r) => a + (r.grade ?? 0), 0) / graded.length) : 0;
    const attendancePct = allRecords.length > 0 ? Math.round((present.length / allRecords.length) * 100) : 0;

    const recentSessions: Array<{ date: string; present: boolean; grade?: number; memorization?: string; heard_by?: string }> = [];
    const sessionIds = [...new Set(allRecords.map(r => r.session_id))];
    for (const sid of sessionIds.slice(0, 10)) {
      const ses = await db.sessions.get(sid);
      const rec = allRecords.find(r => r.session_id === sid);
      if (ses && rec) {
        recentSessions.push({ date: ses.date, present: rec.is_present, grade: rec.grade, memorization: rec.memorization_amount, heard_by: rec.heard_by });
      }
    }
    recentSessions.sort((a, b) => b.date.localeCompare(a.date));

    const enrollments = await db.competition_enrollments.where("student_id").equals(studentId).toArray();
    const competitionResults: Array<{ name: string; level: string; score?: number; grade?: string }> = [];
    for (const en of enrollments) {
      const comp = await db.competitions.get(en.competition_id);
      const lvl = await db.competition_levels.get(en.level_id);
      const res = await db.competition_results.where("enrollment_id").equals(en.id).first();
      if (comp) competitionResults.push({ name: comp.name, level: lvl?.name ?? "—", score: res?.score, grade: res?.grade });
    }

    const courseStudents = await db.course_students.where("student_id").equals(studentId).toArray();
    const courses: string[] = [];
    for (const cs of courseStudents) {
      const course = await db.courses.get(cs.course_id);
      if (course) courses.push(course.name);
    }

    const invoices = await db.invoices.where("student_id").equals(studentId).filter(i => !i.deleted_at).toArray();
    const paidInvoices = invoices.filter(i => i.status === "مدفوع").length;
    const unpaidInvoices = invoices.filter(i => i.status === "غير مدفوع").length;
    const totalPaid = invoices.filter(i => i.status === "مدفوع").reduce((s, i) => s + i.amount, 0);

    return {
      student,
      totalSessions: allRecords.length,
      presentCount: present.length,
      absentCount: absent.length,
      attendancePct,
      avgGrade,
      recentSessions,
      competitionResults,
      courses,
      paidInvoices,
      unpaidInvoices,
      totalPaid,
    };
  }, [studentId]);
  return { stats, loading: stats === undefined };
}

// ─── TEACHER SMART STATS ──────────────────────────────────────────────────────
export function useTeacherStats(teacherId: string | null) {
  const stats = useLiveQuery(async () => {
    if (!teacherId) return null;
    const teacher = await db.teachers.get(teacherId);
    if (!teacher) return null;

    const students = await db.students.where("teacher_id").equals(teacherId).filter(s => !s.deleted_at).toArray();
    const circles = await db.circles.where("teacher_id").equals(teacherId).filter(c => !c.deleted_at).toArray();
    const sessions = await db.sessions.where("teacher_id").equals(teacherId).filter(s => !s.deleted_at).toArray();

    const studentIds = new Set(students.map(s => s.id));
    const allRecords = await db.session_records.toArray();
    const myRecords = allRecords.filter(r => studentIds.has(r.student_id));
    const present = myRecords.filter(r => r.is_present);
    const graded = myRecords.filter(r => r.grade != null && r.grade > 0);
    const avgGrade = graded.length > 0 ? Math.round(graded.reduce((a, r) => a + (r.grade ?? 0), 0) / graded.length) : 0;
    const attendancePct = myRecords.length > 0 ? Math.round((present.length / myRecords.length) * 100) : 0;

    const salaryRecords = await db.salary_records.where("teacher_id").equals(teacherId).filter(s => !s.deleted_at).toArray();
    const lastSalary = salaryRecords.sort((a, b) => b.month.localeCompare(a.month))[0];

    const recentSessions = sessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    return { teacher, students, circles, sessions, avgGrade, attendancePct, salaryRecords, lastSalary, recentSessions };
  }, [teacherId]);
  return { stats, loading: stats === undefined };
}

// ─── CIRCLE SMART STATS ───────────────────────────────────────────────────────
export function useCircleStats(circleId: string | null) {
  const stats = useLiveQuery(async () => {
    if (!circleId) return null;
    const circle = await db.circles.get(circleId);
    if (!circle) return null;

    const students = await db.students.where("circle_id").equals(circleId).filter(s => !s.deleted_at).toArray();
    const sessions = await db.sessions.where("circle_id").equals(circleId).filter(s => !s.deleted_at).toArray();
    const recentSessions = sessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    const allRecords = await db.session_records.toArray();
    const circleSids = new Set(sessions.map(s => s.id));
    const myRecords = allRecords.filter(r => circleSids.has(r.session_id));
    const present = myRecords.filter(r => r.is_present);
    const attendancePct = myRecords.length > 0 ? Math.round((present.length / myRecords.length) * 100) : 0;

    const studentPoints = students.map(s => {
      const recs = myRecords.filter(r => r.student_id === s.id);
      const p = recs.filter(r => r.is_present).length;
      const gr = recs.filter(r => r.grade != null && r.grade > 0);
      const avg = gr.length > 0 ? gr.reduce((a, r) => a + (r.grade ?? 0), 0) / gr.length : 0;
      return { ...s, attendancePct: recs.length > 0 ? Math.round((p / recs.length) * 100) : 0, avgGrade: Math.round(avg) };
    });
    const topStudents = studentPoints.sort((a, b) => b.attendancePct - a.attendancePct).slice(0, 5);

    return { circle, students, sessions: recentSessions, totalSessions: sessions.length, attendancePct, topStudents };
  }, [circleId]);
  return { stats, loading: stats === undefined };
}

// ─── COMPETITION GLOBAL STATS ─────────────────────────────────────────────────
export function useCompetitionStatsGlobal() {
  const stats = useLiveQuery(async () => {
    const competitions = await db.competitions.filter(c => !c.deleted_at).toArray();
    const levels = await db.competition_levels.filter(l => !l.deleted_at).toArray();
    const enrollments = await db.competition_enrollments.toArray();
    const results = await db.competition_results.toArray();

    const totalParticipants = enrollments.length;
    const resultsWithScore = results.filter(r => r.score != null && r.score > 0);
    const avgScore = resultsWithScore.length > 0 ? Math.round(resultsWithScore.reduce((a, r) => a + (r.score ?? 0), 0) / resultsWithScore.length) : 0;
    const passing = results.filter(r => (r.score ?? 0) >= 50).length;
    const successPct = results.length > 0 ? Math.round((passing / results.length) * 100) : 0;

    const byComp = competitions.map(c => {
      const cLevels = levels.filter(l => l.competition_id === c.id);
      const cEnrollments = enrollments.filter(e => e.competition_id === c.id);
      const cResults = results.filter(r => r.competition_id === c.id);
      const cPassing = cResults.filter(r => (r.score ?? 0) >= 50).length;
      const cAvg = cResults.filter(r => (r.score ?? 0) > 0).length > 0
        ? Math.round(cResults.filter(r => r.score != null).reduce((a, r) => a + (r.score ?? 0), 0) / cResults.filter(r => r.score != null).length) : 0;
      return { name: c.name, status: c.status, levelCount: cLevels.length, participants: cEnrollments.length, passing: cPassing, avgScore: cAvg };
    });

    const topScorers = results
      .filter(r => r.score != null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10)
      .map(r => ({ name: r.student_name, score: r.score ?? 0, competition: competitions.find(c => c.id === r.competition_id)?.name ?? "—" }));

    return {
      totalCompetitions: competitions.length,
      totalLevels: levels.length,
      totalParticipants,
      totalResults: results.length,
      avgScore,
      passing,
      successPct,
      byComp,
      topScorers,
    };
  }, []);
  return { stats, loading: stats === undefined };
}

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
export function useGlobalSearch(query: string) {
  const results = useLiveQuery(async () => {
    if (!query || query.trim().length < 2) return null;
    const q = query.trim().toLowerCase();

    const [students, teachers, circles, sessions, invoices] = await Promise.all([
      db.students.filter(s => !s.deleted_at && (
        s.full_name.toLowerCase().includes(q) ||
        (s.guardian_phone ?? "").includes(q) ||
        (s.circle_name ?? "").toLowerCase().includes(q) ||
        (s.teacher_name ?? "").toLowerCase().includes(q) ||
        (s.grade ?? "").toLowerCase().includes(q)
      )).toArray(),
      db.teachers.filter(t => !t.deleted_at && (
        t.full_name.toLowerCase().includes(q) ||
        t.phone.includes(q)
      )).toArray(),
      db.circles.filter(c => !c.deleted_at && (
        c.name.toLowerCase().includes(q) ||
        (c.teacher_name ?? "").toLowerCase().includes(q) ||
        (c.days ?? "").includes(q)
      )).toArray(),
      db.sessions.filter(s => !s.deleted_at && (
        (s.circle_name ?? "").toLowerCase().includes(q) ||
        (s.teacher_name ?? "").toLowerCase().includes(q) ||
        (s.date ?? "").includes(q) ||
        (s.day ?? "").includes(q)
      )).limit(20).toArray(),
      db.invoices.filter(i => !i.deleted_at && (
        i.student_name.toLowerCase().includes(q) ||
        i.month.toLowerCase().includes(q)
      )).limit(20).toArray(),
    ]);

    return { students, teachers, circles, sessions, invoices };
  }, [query]);
  return { results, loading: results === undefined };
}
