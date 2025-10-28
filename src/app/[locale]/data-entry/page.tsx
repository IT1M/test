import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EnhancedDataEntryClient } from "./EnhancedDataEntryClient";

export default async function DataEntryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppLayout user={session.user}>
      <div className="p-6">
        <Breadcrumb items={[{ label: "Data Entry" }]} />
        
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Smart Data Entry
          </h1>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            Add inventory items individually or import in bulk with intelligent validation
          </p>
        </div>

        <EnhancedDataEntryClient />
      </div>
    </AppLayout>
  );
}
