import { Suspense } from "react";
import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { canPerformAction } from "@/utils/rbac";
import UserManagementClient from "./UserManagementClient";
import { Loading } from "@/components/ui/Loading";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has permission to manage users
  if (!canPerformAction(session.user.role, "read", "user")) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
          User Management
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-2">
          Manage system users, roles, and permissions
        </p>
      </div>

      <Suspense fallback={<Loading />}>
        <UserManagementClient userRole={session.user.role} />
      </Suspense>
    </div>
  );
}
