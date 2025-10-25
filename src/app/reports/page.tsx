import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check authorization - MANAGER role or higher
  const allowedRoles = ["MANAGER", "ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppLayout user={session.user}>
      <div className="p-6">
        <Breadcrumb items={[{ label: "Reports" }]} />
        <ReportsClient userRole={session.user.role} />
      </div>
    </AppLayout>
  );
}
