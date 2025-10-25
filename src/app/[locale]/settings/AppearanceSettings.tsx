"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { Sun, Moon, Monitor } from "lucide-react";

interface AppearanceSettingsProps {
  user: {
    id: string;
    preferences: any;
  };
}

export default function AppearanceSettings({ user }: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(
    user.preferences?.fontSize || "medium"
  );
  const [language, setLanguage] = useState(
    user.preferences?.language || "en"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const preferences = {
        ...user.preferences,
        theme,
        fontSize,
        language,
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Appearance settings saved successfully");
        
        // Apply font size
        document.documentElement.style.fontSize = 
          fontSize === "small" ? "14px" : 
          fontSize === "large" ? "18px" : "16px";
      } else {
        toast.error(data.error?.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
          Appearance Settings
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Customize how the application looks and feels
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                theme === "light"
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                  : "border-secondary-300 dark:border-secondary-700 hover:border-secondary-400"
              }`}
            >
              <Sun className="h-6 w-6 mb-2 text-secondary-700 dark:text-secondary-300" />
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Light
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                  : "border-secondary-300 dark:border-secondary-700 hover:border-secondary-400"
              }`}
            >
              <Moon className="h-6 w-6 mb-2 text-secondary-700 dark:text-secondary-300" />
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Dark
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                theme === "system"
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                  : "border-secondary-300 dark:border-secondary-700 hover:border-secondary-400"
              }`}
            >
              <Monitor className="h-6 w-6 mb-2 text-secondary-700 dark:text-secondary-300" />
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                System
              </span>
            </button>
          </div>
        </div>

        {/* Font Size */}
        <Select
          label="Font Size"
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium (Default)</option>
          <option value="large">Large</option>
        </Select>

        {/* Language */}
        <Select
          label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          helperText="Language changes will take effect after page reload"
        >
          <option value="en">English</option>
          <option value="ar">العربية (Arabic)</option>
        </Select>

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
