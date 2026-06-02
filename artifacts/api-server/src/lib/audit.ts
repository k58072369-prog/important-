import { db, auditLogsTable } from "@workspace/db";

export async function logAudit(params: {
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  changes?: Record<string, unknown>;
  status?: string;
  errorMessage?: string;
}) {
  try {
    await db.insert(auditLogsTable).values({
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      entityName: params.entityName ?? null,
      changes: params.changes ?? null,
      status: params.status ?? "success",
      errorMessage: params.errorMessage ?? null,
    });
  } catch {
    // Never let audit logging break the main flow
  }
}

type AuditAction = "create" | "update" | "delete" | "backup" | "restore" | "login";

export function auditMiddleware(entity: string, action: AuditAction) {
  return async (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode < 400) {
        logAudit({
          action,
          entity,
          entityId: body?.id ?? req.params?.id,
          entityName: body?.full_name ?? body?.name ?? body?.description ?? undefined,
          changes: ["create", "update"].includes(action) ? req.body : undefined,
          status: "success",
        });
      } else {
        logAudit({ action, entity, status: "error", errorMessage: body?.error });
      }
      return originalJson(body);
    };
    next();
  };
}
