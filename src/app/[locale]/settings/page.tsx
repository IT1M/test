import { Suspense } from "react";
import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { Loading } from "@/components/ui/Loading";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
          Settings
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Suspense fallback={<Loading />}>
        <SettingsClient user={session.user} />
      </Suspense>
    </div>
  );
}
