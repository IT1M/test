import { Suspense } from "react";
import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { canPerformAction } from "@/utils/rbac";
import SystemHealthMonitoring from "@/components/admin/SystemHealthMonitoring";
import { Loading } from "@/components/ui/Loading";

export default async function MonitoringPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to view monitoring
  if (!canPerformAction(session.user.role, "read", "monitoring")) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<Loading />}>
        <SystemHealthMonitoring />
      </Suspense>
    </div>
  );
}