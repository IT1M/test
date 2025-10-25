"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { UserRole } from "@prisma/client";

interface ProfileSettingsProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile updated successfully");
        // Reload page to update session
        window.location.reload();
      } else {
        toast.error(data.error?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole): "default" | "primary" | "success" | "warning" | "danger" | "secondary" => {
    switch (role) {
      case "ADMIN":
        return "danger";
      case "MANAGER":
        return "primary";
      case "SUPERVISOR":
        return "warning";
      case "AUDITOR":
        return "primary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
          Profile Information
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Update your account profile information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            Role
          </label>
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {user.role.replace("_", " ")}
          </Badge>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Contact an administrator to change your role
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
