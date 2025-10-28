"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface NotificationSettingsProps {
  user: {
    id: string;
    preferences: any;
  };
}

export default function NotificationSettings({ user }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState({
    emailNotifications: user.preferences?.emailNotifications ?? true,
    highRejectAlerts: user.preferences?.highRejectAlerts ?? true,
    backupAlerts: user.preferences?.backupAlerts ?? true,
    systemUpdates: user.preferences?.systemUpdates ?? true,
    newUserAlerts: user.preferences?.newUserAlerts ?? false,
    reportGeneration: user.preferences?.reportGeneration ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${user.id}/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Notification preferences saved successfully");
      } else {
        toast.error(data.error?.message || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  const NotificationToggle = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-secondary-200 dark:border-secondary-700 last:border-0">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
          {label}
        </h4>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          checked ? "bg-primary-600" : "bg-secondary-300 dark:bg-secondary-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
          Notification Preferences
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Manage how and when you receive notifications
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Notifications */}
        <div>
          <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Email Notifications
          </h3>
          <NotificationToggle
            label="Enable Email Notifications"
            description="Receive notifications via email for important events"
            checked={preferences.emailNotifications}
            onChange={() => handleToggle("emailNotifications")}
          />
        </div>

        {/* Alert Types */}
        <div>
          <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Alert Types
          </h3>
          <div className="space-y-0">
            <NotificationToggle
              label="High Reject Rate Alerts"
              description="Get notified when inventory items have reject rate > 15%"
              checked={preferences.highRejectAlerts}
              onChange={() => handleToggle("highRejectAlerts")}
            />
            <NotificationToggle
              label="Backup Alerts"
              description="Receive notifications about backup completion or failures"
              checked={preferences.backupAlerts}
              onChange={() => handleToggle("backupAlerts")}
            />
            <NotificationToggle
              label="System Updates"
              description="Get notified about system maintenance and updates"
              checked={preferences.systemUpdates}
              onChange={() => handleToggle("systemUpdates")}
            />
            <NotificationToggle
              label="New User Registrations"
              description="Receive alerts when new users register (Admin only)"
              checked={preferences.newUserAlerts}
              onChange={() => handleToggle("newUserAlerts")}
            />
            <NotificationToggle
              label="Report Generation"
              description="Get notified when reports are generated"
              checked={preferences.reportGeneration}
              onChange={() => handleToggle("reportGeneration")}
            />
          </div>
        </div>

        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <p className="text-sm text-primary-800 dark:text-primary-200">
            <strong>Note:</strong> Some notifications are mandatory for security and compliance
            purposes and cannot be disabled.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
