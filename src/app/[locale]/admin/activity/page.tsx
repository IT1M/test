import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActivityMonitoringDashboard from "@/components/admin/ActivityMonitoringDashboard";

export default async function AdminActivityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has admin privileges
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-6">
      <ActivityMonitoringDashboard />
    </div>
  );
}