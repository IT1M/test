"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

export default function APISettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [formData, setFormData] = useState({
    geminiApiKey: "",
    geminiModel: "gemini-pro",
    geminiRateLimit: "60",
    geminiCacheDuration: "30",
    backupRetentionDays: "30",
    backupRetentionWeeks: "12",
    backupRetentionMonths: "12",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings?category=api");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        
        // Populate form with existing settings
        const settingsMap: any = {};
        data.data.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value;
        });

        setFormData({
          geminiApiKey: settingsMap.geminiApiKey || "",
          geminiModel: settingsMap.geminiModel || "gemini-pro",
          geminiRateLimit: settingsMap.geminiRateLimit || "60",
          geminiCacheDuration: settingsMap.geminiCacheDuration || "30",
          backupRetentionDays: settingsMap.backupRetentionDays || "30",
          backupRetentionWeeks: settingsMap.backupRetentionWeeks || "12",
          backupRetentionMonths: settingsMap.backupRetentionMonths || "12",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const settingsToUpdate = [
        { key: "geminiApiKey", value: formData.geminiApiKey, category: "api" },
        { key: "geminiModel", value: formData.geminiModel, category: "api" },
        { key: "geminiRateLimit", value: parseInt(formData.geminiRateLimit), category: "api" },
        { key: "geminiCacheDuration", value: parseInt(formData.geminiCacheDuration), category: "api" },
        { key: "backupRetentionDays", value: parseInt(formData.backupRetentionDays), category: "backup" },
        { key: "backupRetentionWeeks", value: parseInt(formData.backupRetentionWeeks), category: "backup" },
        { key: "backupRetentionMonths", value: parseInt(formData.backupRetentionMonths), category: "backup" },
      ];

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToUpdate),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("API settings saved successfully");
        fetchSettings();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
            API Configuration
          </h2>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Configure external API integrations and system settings
          </p>
        </div>
        <Button variant="ghost" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gemini AI Settings */}
        <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Gemini AI Configuration
          </h3>
          
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Gemini API Key"
                type={showApiKey ? "text" : "password"}
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                placeholder="Enter your Gemini API key"
                helperText="Get your API key from Google AI Studio"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Select
              label="Model"
              value={formData.geminiModel}
              onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
            >
              <option value="gemini-pro">Gemini Pro</option>
              <option value="gemini-pro-vision">Gemini Pro Vision</option>
            </Select>

            <Input
              label="Rate Limit (requests per minute)"
              type="number"
              value={formData.geminiRateLimit}
              onChange={(e) => setFormData({ ...formData, geminiRateLimit: e.target.value })}
              min="1"
              max="1000"
            />

            <Input
              label="Cache Duration (minutes)"
              type="number"
              value={formData.geminiCacheDuration}
              onChange={(e) => setFormData({ ...formData, geminiCacheDuration: e.target.value })}
              min="1"
              max="1440"
              helperText="How long to cache AI responses"
            />
          </div>
        </div>

        {/* Backup Settings */}
        <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Backup Retention Policy
          </h3>
          
          <div className="space-y-4">
            <Input
              label="Daily Backups Retention (days)"
              type="number"
              value={formData.backupRetentionDays}
              onChange={(e) => setFormData({ ...formData, backupRetentionDays: e.target.value })}
              min="1"
              max="365"
            />

            <Input
              label="Weekly Backups Retention (weeks)"
              type="number"
              value={formData.backupRetentionWeeks}
              onChange={(e) => setFormData({ ...formData, backupRetentionWeeks: e.target.value })}
              min="1"
              max="52"
            />

            <Input
              label="Monthly Backups Retention (months)"
              type="number"
              value={formData.backupRetentionMonths}
              onChange={(e) => setFormData({ ...formData, backupRetentionMonths: e.target.value })}
              min="1"
              max="60"
            />
          </div>
        </div>

        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
          <p className="text-sm text-warning-800 dark:text-warning-200">
            <strong>Warning:</strong> Changes to API settings may affect system functionality.
            Ensure you have valid credentials before saving.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
