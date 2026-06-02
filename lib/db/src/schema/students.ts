import { pgTable, text, integer, numeric, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  photoUrl: text("photo_url"),
  age: integer("age"),
  birthDate: text("birth_date"),
  grade: text("grade").notNull(),
  address: text("address"),
  governorate: text("governorate"),
  guardianPhone: text("guardian_phone").notNull(),
  secondaryPhone: text("secondary_phone"),
  email: text("email"),
  teacherId: uuid("teacher_id"),
  circleId: uuid("circle_id"),
  paymentStatus: text("payment_status").notNull().default("غير مدفوع"),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }),
  isExempt: boolean("is_exempt").notNull().default(false),
  currentMemorization: text("current_memorization"),
  currentRevision: text("current_revision"),
  level: text("level"),
  rating: integer("rating"),
  notes: text("notes"),
  enrollmentDate: text("enrollment_date").notNull().default("2026-01-01"),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
