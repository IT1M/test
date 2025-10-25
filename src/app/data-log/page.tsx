import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DataLogClient } from "./DataLogClient";

export default async function DataLogPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppLayout user={session.user}>
      <div className="p-6">
        <Breadcrumb items={[{ label: "Data Log" }]} />
        
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Data Log
          </h1>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            View and manage inventory records
          </p>
        </div>

        <DataLogClient userRole={session.user.role} />
      </div>
    </AppLayout>
  );
}
