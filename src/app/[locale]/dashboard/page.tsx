import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Placeholder for KPI cards - will be implemented in analytics task */}
          <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg border border-secondary-200 dark:border-secondary-800">
            <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
              Total Items
            </h3>
            <p className="mt-2 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
              0
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg border border-secondary-200 dark:border-secondary-800">
            <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
              Total Quantity
            </h3>
            <p className="mt-2 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
              0
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg border border-secondary-200 dark:border-secondary-800">
            <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
              Reject Rate
            </h3>
            <p className="mt-2 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
              0%
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg border border-secondary-200 dark:border-secondary-800">
            <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
              Active Users
            </h3>
            <p className="mt-2 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
              1
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
