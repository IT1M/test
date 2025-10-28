import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EnhancedDashboard } from "./EnhancedDashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppLayout user={session.user}>
      <div className="p-6">
        <Breadcrumb items={[{ label: "Dashboard" }]} />
        
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Dashboard
          </h1>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            Welcome to the Saudi Mais Inventory System, {session.user.name}
          </p>
        </div>

        <EnhancedDashboard user={session.user} />
      </div>
    </AppLayout>
  );
}
