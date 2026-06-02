import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  entityName: text("entity_name"),
  changes: jsonb("changes"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  status: text("status").notNull().default("success"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const backupRecordsTable = pgTable("backup_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  sizeBytes: text("size_bytes"),
  recordCount: text("record_count"),
  status: text("status").notNull().default("completed"),
  triggeredBy: text("triggered_by").notNull().default("auto"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type BackupRecord = typeof backupRecordsTable.$inferSelect;
