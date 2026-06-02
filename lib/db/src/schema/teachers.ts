import { pgTable, text, integer, numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teachersTable = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  photoUrl: text("photo_url"),
  age: integer("age"),
  phone: text("phone").notNull(),
  secondaryPhone: text("secondary_phone"),
  email: text("email"),
  address: text("address"),
  salary: numeric("salary", { precision: 10, scale: 2 }),
  hireDate: text("hire_date"),
  experience: text("experience"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTeacherSchema = createInsertSchema(teachersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachersTable.$inferSelect;
