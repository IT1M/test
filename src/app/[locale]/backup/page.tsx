import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import BackupClient from "./BackupClient";

export default async function BackupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only ADMIN and MANAGER can access backup page
  const allowedRoles = ["ADMIN", "MANAGER"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <BackupClient userRole={session.user.role} />;
}
