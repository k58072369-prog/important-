import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  circleId: uuid("circle_id").notNull(),
  teacherId: uuid("teacher_id"),
  date: text("date").notNull(),
  day: text("day"),
  time: text("time"),
  status: text("status").notNull().default("مكتملة"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessionRecordsTable = pgTable("session_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  studentId: uuid("student_id").notNull(),
  isPresent: boolean("is_present").notNull().default(true),
  memorizationAmount: text("memorization_amount"),
  revisionAmount: text("revision_amount"),
  nextMemorization: text("next_memorization"),
  nextRevision: text("next_revision"),
  grade: integer("grade"),
  performanceLabel: text("performance_label"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true });
export const insertSessionRecordSchema = createInsertSchema(sessionRecordsTable).omit({ id: true, createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
export type InsertSessionRecord = z.infer<typeof insertSessionRecordSchema>;
export type SessionRecord = typeof sessionRecordsTable.$inferSelect;
