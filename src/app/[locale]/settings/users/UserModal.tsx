"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";
import { z } from "zod";

type UserRole = "ADMIN" | "DATA_ENTRY" | "SUPERVISOR" | "MANAGER" | "AUDITOR";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: () => void;
}

const UserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "DATA_ENTRY", "SUPERVISOR", "MANAGER", "AUDITOR"]),
  isActive: z.boolean(),
});

export default function UserModal({ isOpen, onClose, user, onSaved }: UserModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "DATA_ENTRY" as UserRole,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        name: user.name,
        password: "",
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      setFormData({
        email: "",
        name: "",
        password: "",
        role: "DATA_ENTRY",
        isActive: true,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const dataToValidate = {
      ...formData,
      password: user ? (formData.password || undefined) : formData.password,
    };

    const validation = UserSchema.safeParse(dataToValidate);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    // For editing, require password only if provided
    if (user && !formData.password) {
      delete (dataToValidate as any).password;
    }

    // For new users, password is required
    if (!user && !formData.password) {
      setErrors({ password: "Password is required for new users" });
      return;
    }

    try {
      setIsSubmitting(true);

      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PATCH" : "POST";

      const body: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(user ? "User updated successfully" : "User created successfully");
        onSaved();
      } else {
        toast.error(data.error?.message || "Failed to save user");
        if (data.error?.details) {
          const newErrors: Record<string, string> = {};
          data.error.details.forEach((detail: any) => {
            if (detail.path[0]) {
              newErrors[detail.path[0]] = detail.message;
            }
          });
          setErrors(newErrors);
        }
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? "Edit User" : "Add New User"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          helperText={user ? "Leave blank to keep current password" : undefined}
          required={!user}
        />

        <Select
          label="Role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
          error={errors.role}
          required
        >
          <option value="DATA_ENTRY">Data Entry</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="AUDITOR">Auditor</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </Select>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label
            htmlFor="isActive"
            className="text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            Active
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {user ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
