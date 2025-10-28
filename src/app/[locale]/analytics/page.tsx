import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
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
        <Breadcrumb items={[{ label: "Analytics" }]} />
        
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            View insights and trends for inventory data with AI-powered analytics
          </p>
        </div>

        <div className="mt-8">
          <AnalyticsDashboard />
        </div>
      </div>
    </AppLayout>
  );
}
