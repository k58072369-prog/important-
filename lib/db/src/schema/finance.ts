import { pgTable, text, numeric, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoicesTable = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull(),
  month: text("month").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("غير مدفوع"),
  isExempt: boolean("is_exempt").notNull().default(false),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expensesTable = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: text("date").notNull(),
  paymentMethod: text("payment_method").default("نقداً"),
  linkedToType: text("linked_to_type"),
  linkedToId: uuid("linked_to_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const incomeEntriesTable = pgTable("income_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull().default("تبرع"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: text("date").notNull(),
  paymentMethod: text("payment_method").default("نقداً"),
  donorName: text("donor_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salaryRecordsTable = pgTable("salary_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id").notNull(),
  month: text("month").notNull(),
  baseSalary: numeric("base_salary", { precision: 10, scale: 2 }).default("0"),
  sessionCount: numeric("session_count", { precision: 6, scale: 0 }).default("0"),
  sessionRate: numeric("session_rate", { precision: 10, scale: 2 }).default("0"),
  bonuses: numeric("bonuses", { precision: 10, scale: 2 }).default("0"),
  deductions: numeric("deductions", { precision: 10, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("نقداً"),
  status: text("status").notNull().default("معلق"),
  calculationMethod: text("calculation_method").notNull().default("ثابت"),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category"),
  date: text("date").notNull(),
  linkedType: text("linked_type"),
  linkedId: uuid("linked_id"),
  linkedName: text("linked_name"),
  sourceTable: text("source_table"),
  sourceId: uuid("source_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIncomeEntrySchema = createInsertSchema(incomeEntriesTable).omit({ id: true, createdAt: true });
export const insertSalaryRecordSchema = createInsertSchema(salaryRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
export type InsertIncomeEntry = z.infer<typeof insertIncomeEntrySchema>;
export type IncomeEntry = typeof incomeEntriesTable.$inferSelect;
export type InsertSalaryRecord = z.infer<typeof insertSalaryRecordSchema>;
export type SalaryRecord = typeof salaryRecordsTable.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
