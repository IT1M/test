import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { prisma } from "@/services/prisma";
import { AuditClient } from "./AuditClient";

export default async function AuditPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only AUDITOR, MANAGER, and ADMIN can view audit logs
  if (!["AUDITOR", "MANAGER", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch initial audit logs
  const [logs, total, users, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 50,
    }),
    prisma.auditLog.count(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.auditLog.findMany({
      select: {
        entityType: true,
      },
      distinct: ["entityType"],
    }),
  ]);

  const availableEntityTypes = entityTypes.map((e) => e.entityType);

  return (
    <AppLayout user={session.user}>
      <div className="p-6">
        <Breadcrumb items={[{ label: "Audit Log" }]} />
        
        <div className="mt-6">
          <AuditClient
            initialLogs={JSON.parse(JSON.stringify(logs))}
            initialMeta={{
              page: 1,
              limit: 50,
              total,
              pages: Math.ceil(total / 50),
            }}
            availableUsers={users}
            availableEntityTypes={availableEntityTypes}
          />
        </div>
      </div>
    </AppLayout>
  );
}
