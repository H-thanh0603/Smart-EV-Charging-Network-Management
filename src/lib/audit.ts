import { prisma } from "./prisma";

/**
 * Ghi audit log admin action — ai làm gì, entity nào, IP đâu.
 * Không throw: log hỏng không được chặn nghiệp vụ chính.
 */
export async function audit(
  params: {
    actorId?: string | null;
    role?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    detail?: string;
    ip?: string | null;
  }
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        role: params.role ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        detail: params.detail ?? null,
        ip: params.ip ?? null,
      },
    });
  } catch {
    /* bỏ qua lỗi log */
  }
}
