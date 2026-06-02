import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, notificationsTable, studentsTable } from "@workspace/db";
import { ListNotificationsQueryParams } from "@workspace/api-zod";
import { toSnakeCase } from "../lib/transform";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const query = ListNotificationsQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success && query.data.type) conditions.push(eq(notificationsTable.type, query.data.type));
  if (query.success && query.data.unread === true) conditions.push(eq(notificationsTable.isRead, false));

  const notifications = await db
    .select({
      id: notificationsTable.id,
      type: notificationsTable.type,
      title: notificationsTable.title,
      message: notificationsTable.message,
      studentId: notificationsTable.studentId,
      studentName: studentsTable.fullName,
      isRead: notificationsTable.isRead,
      priority: notificationsTable.priority,
      createdAt: notificationsTable.createdAt,
    })
    .from(notificationsTable)
    .leftJoin(studentsTable, eq(notificationsTable.studentId, studentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(notificationsTable.createdAt);

  res.json(notifications.map(n => toSnakeCase(n as any)));
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, rawId))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(toSnakeCase(notification as any));
});

export default router;
