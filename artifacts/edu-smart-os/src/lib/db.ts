import Dexie, { type Table } from "dexie";

export interface Student {
  id: string;
  student_code?: string;
  full_name: string;
  age?: number;
  birth_date?: string;
  grade: string;
  address?: string;
  governorate?: string;
  guardian_phone: string;
  secondary_phone?: string;
  email?: string;
  teacher_id?: string;
  teacher_name?: string;
  circle_id?: string;
  circle_name?: string;
  payment_status: string;
  payment_amount?: number;
  is_exempt: boolean;
  current_memorization?: string;
  current_revision?: string;
  last_memorization_position?: string;
  last_revision_position?: string;
  level?: string;
  rating?: number;
  points?: number;
  notes?: string;
  enrollment_date?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  age?: number;
  phone: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  salary?: number;
  hire_date?: string;
  experience?: string;
  notes?: string;
  circle_count?: number;
  student_count?: number;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  teacher_name?: string;
  days?: string;
  time?: string;
  status: string;
  student_count?: number;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  circle_id: string;
  circle_name?: string;
  teacher_id?: string;
  teacher_name?: string;
  date: string;
  day?: string;
  time?: string;
  status: string;
  present_count?: number;
  student_count?: number;
  deleted_at?: string;
  created_at: string;
}

export interface SessionRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  is_present: boolean;
  memorization_amount?: string;
  revision_amount?: string;
  next_memorization?: string;
  next_revision?: string;
  grade?: number;
  performance_label?: string;
  heard_by?: string;
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  student_id: string;
  student_name: string;
  month: string;
  amount: number;
  paid_amount?: number;
  status: string;
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  name?: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  payment_method?: string;
  responsible?: string;
  receipt_url?: string;
  notes?: string;
  linked_to_type?: string;
  linked_to_id?: string;
  deleted_at?: string;
  created_at: string;
}

export interface SalaryRecord {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  month: string;
  base_salary: number;
  bonuses?: number;
  deductions?: number;
  total_amount: number;
  payment_method?: string;
  status: string;
  notes?: string;
  paid_at?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  is_read: boolean;
  student_name?: string;
  student_id?: string;
  teacher_name?: string;
  teacher_id?: string;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  teacher_id?: string;
  teacher_name?: string;
  start_date?: string;
  end_date?: string;
  seats?: number;
  fee?: number;
  status: string;
  student_count?: number;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseStudent {
  id: string;
  course_id: string;
  student_id: string;
  student_name: string;
  enrolled_at: string;
}

export interface CourseSession {
  id: string;
  course_id: string;
  course_name?: string;
  title?: string;
  date: string;
  day?: string;
  start_time?: string;
  end_time?: string;
  what_was_taught?: string;
  notes?: string;
  present_count?: number;
  student_count?: number;
  created_at: string;
}

export interface CourseSessionRecord {
  id: string;
  course_session_id: string;
  student_id: string;
  student_name: string;
  status: "حضور" | "غياب" | "تأخر";
  notes?: string;
  created_at: string;
}

export interface Competition {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  level_count?: number;
  participant_count?: number;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionLevel {
  id: string;
  competition_id: string;
  competition_name?: string;
  name: string;
  required_memorization?: string;
  required_revision?: string;
  test_date?: string;
  instructions?: string;
  student_count?: number;
  deleted_at?: string;
  created_at: string;
}

export interface CompetitionEnrollment {
  id: string;
  competition_id: string;
  level_id: string;
  level_name?: string;
  student_id: string;
  student_name: string;
  enrolled_at: string;
}

export interface CompetitionResult {
  id: string;
  enrollment_id: string;
  competition_id: string;
  level_id: string;
  student_id: string;
  student_name: string;
  degree?: number;
  memorization_amount?: string;
  revision_amount?: string;
  grade?: string;
  score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReport {
  id: string;
  student_id: string;
  student_code?: string;
  student_name: string;
  teacher_name?: string;
  circle_name?: string;
  guardian_phone?: string;
  grade?: string;
  month: string;
  month_label: string;
  sessions_count: number;
  present_count: number;
  absent_count: number;
  late_count?: number;
  excused_count?: number;
  attendance_pct: number;
  avg_grade: number;
  max_grade: number;
  min_grade: number;
  memorization_count: number;
  revision_count: number;
  last_memorization?: string;
  last_revision?: string;
  rating_excellent?: number;
  rating_very_good?: number;
  rating_good?: number;
  rating_acceptable?: number;
  rating_poor?: number;
  evaluation_text: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: "ADD" | "UPDATE" | "DELETE" | "RESTORE" | "PERMANENT_DELETE";
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  details?: string;
  created_at: string;
}

class FurqanDB extends Dexie {
  students!: Table<Student>;
  teachers!: Table<Teacher>;
  circles!: Table<Circle>;
  sessions!: Table<Session>;
  session_records!: Table<SessionRecord>;
  invoices!: Table<Invoice>;
  expenses!: Table<Expense>;
  salary_records!: Table<SalaryRecord>;
  notifications!: Table<Notification>;
  courses!: Table<Course>;
  course_students!: Table<CourseStudent>;
  course_sessions!: Table<CourseSession>;
  course_session_records!: Table<CourseSessionRecord>;
  competitions!: Table<Competition>;
  competition_levels!: Table<CompetitionLevel>;
  competition_enrollments!: Table<CompetitionEnrollment>;
  competition_results!: Table<CompetitionResult>;
  monthly_reports!: Table<MonthlyReport>;
  activity_logs!: Table<ActivityLog>;

  constructor() {
    super("furqan_db");
    this.version(1).stores({
      students: "id, full_name, grade, circle_id, teacher_id, payment_status, is_exempt, created_at",
      teachers: "id, full_name, phone, created_at",
      circles: "id, name, teacher_id, status, created_at",
      sessions: "id, circle_id, date, status, created_at",
      session_records: "id, session_id, student_id, is_present, created_at",
      invoices: "id, student_id, month, status, created_at",
      expenses: "id, category, date, created_at",
      notifications: "id, type, is_read, created_at",
    });
    this.version(2).stores({
      students: "id, full_name, grade, circle_id, teacher_id, payment_status, is_exempt, created_at",
      teachers: "id, full_name, phone, created_at",
      circles: "id, name, teacher_id, status, created_at",
      sessions: "id, circle_id, date, status, created_at",
      session_records: "id, session_id, student_id, is_present, created_at",
      invoices: "id, student_id, month, status, created_at",
      expenses: "id, category, date, created_at",
      salary_records: "id, teacher_id, month, status, created_at",
      notifications: "id, type, is_read, created_at",
      courses: "id, name, teacher_id, status, created_at",
      course_students: "id, course_id, student_id, enrolled_at",
      course_sessions: "id, course_id, date, created_at",
      course_session_records: "id, course_session_id, student_id, status, created_at",
      competitions: "id, name, status, created_at",
      competition_levels: "id, competition_id, name, created_at",
      competition_enrollments: "id, competition_id, level_id, student_id, enrolled_at",
      competition_results: "id, enrollment_id, competition_id, level_id, student_id, created_at",
    });
    this.version(3).stores({
      students: "id, full_name, grade, circle_id, teacher_id, payment_status, is_exempt, created_at",
      teachers: "id, full_name, phone, created_at",
      circles: "id, name, teacher_id, status, created_at",
      sessions: "id, circle_id, date, status, created_at",
      session_records: "id, session_id, student_id, is_present, created_at",
      invoices: "id, student_id, month, status, created_at",
      expenses: "id, category, date, created_at",
      salary_records: "id, teacher_id, month, status, created_at",
      notifications: "id, type, is_read, created_at",
      courses: "id, name, teacher_id, status, created_at",
      course_students: "id, course_id, student_id, enrolled_at",
      course_sessions: "id, course_id, date, created_at",
      course_session_records: "id, course_session_id, student_id, status, created_at",
      competitions: "id, name, status, created_at",
      competition_levels: "id, competition_id, name, created_at",
      competition_enrollments: "id, competition_id, level_id, student_id, enrolled_at",
      competition_results: "id, enrollment_id, competition_id, level_id, student_id, created_at",
      monthly_reports: "id, student_id, month, created_at",
    });
    this.version(4).stores({
      students: "id, full_name, grade, circle_id, teacher_id, payment_status, is_exempt, deleted_at, created_at",
      teachers: "id, full_name, phone, deleted_at, created_at",
      circles: "id, name, teacher_id, status, deleted_at, created_at",
      sessions: "id, circle_id, date, status, deleted_at, created_at",
      session_records: "id, session_id, student_id, is_present, created_at",
      invoices: "id, student_id, month, status, deleted_at, created_at",
      expenses: "id, category, date, deleted_at, created_at",
      salary_records: "id, teacher_id, month, status, deleted_at, created_at",
      notifications: "id, type, is_read, created_at",
      courses: "id, name, teacher_id, status, deleted_at, created_at",
      course_students: "id, course_id, student_id, enrolled_at",
      course_sessions: "id, course_id, date, created_at",
      course_session_records: "id, course_session_id, student_id, status, created_at",
      competitions: "id, name, status, deleted_at, created_at",
      competition_levels: "id, competition_id, name, deleted_at, created_at",
      competition_enrollments: "id, competition_id, level_id, student_id, enrolled_at",
      competition_results: "id, enrollment_id, competition_id, level_id, student_id, created_at",
      monthly_reports: "id, student_id, month, created_at",
      activity_logs: "id, action, entity_type, created_at",
    });
    this.version(5).stores({
      students: "id, full_name, grade, circle_id, teacher_id, payment_status, is_exempt, deleted_at, created_at",
      teachers: "id, full_name, phone, deleted_at, created_at",
      circles: "id, name, teacher_id, status, deleted_at, created_at",
      sessions: "id, circle_id, date, status, deleted_at, created_at",
      session_records: "id, session_id, student_id, is_present, created_at",
      invoices: "id, student_id, month, status, deleted_at, created_at",
      expenses: "id, category, date, deleted_at, created_at",
      salary_records: "id, teacher_id, month, status, deleted_at, created_at",
      notifications: "id, type, is_read, created_at",
      courses: "id, name, teacher_id, status, deleted_at, created_at",
      course_students: "id, course_id, student_id, enrolled_at",
      course_sessions: "id, course_id, date, created_at",
      course_session_records: "id, course_session_id, student_id, status, created_at",
      competitions: "id, name, status, deleted_at, created_at",
      competition_levels: "id, competition_id, name, deleted_at, created_at",
      competition_enrollments: "id, competition_id, level_id, student_id, enrolled_at",
      competition_results: "id, enrollment_id, competition_id, level_id, student_id, created_at",
      monthly_reports: "id, student_id, month, created_at",
      activity_logs: "id, action, entity_type, created_at",
    });
    this.version(6).stores({
      students: "id, full_name, student_code, grade, circle_id, teacher_id, payment_status, is_exempt, deleted_at, created_at",
      teachers: "id, full_name, phone, deleted_at, created_at",
      circles: "id, name, teacher_id, status, deleted_at, created_at",
      sessions: "id, circle_id, date, status, deleted_at, created_at",
      session_records: "id, session_id, student_id, is_present, created_at",
      invoices: "id, student_id, month, status, deleted_at, created_at",
      expenses: "id, category, date, deleted_at, created_at",
      salary_records: "id, teacher_id, month, status, deleted_at, created_at",
      notifications: "id, type, is_read, created_at",
      courses: "id, name, teacher_id, status, deleted_at, created_at",
      course_students: "id, course_id, student_id, enrolled_at",
      course_sessions: "id, course_id, date, created_at",
      course_session_records: "id, course_session_id, student_id, status, created_at",
      competitions: "id, name, status, deleted_at, created_at",
      competition_levels: "id, competition_id, name, deleted_at, created_at",
      competition_enrollments: "id, competition_id, level_id, student_id, enrolled_at",
      competition_results: "id, enrollment_id, competition_id, level_id, student_id, created_at",
      monthly_reports: "id, student_id, month, created_at",
      activity_logs: "id, action, entity_type, created_at",
    });
  }
}

export const db = new FurqanDB();

export function genId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(month: string): string {
  const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const [year, m] = month.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${year}`;
}
