"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatters";
import toast from "react-hot-toast";
import { Download, FileText, Plus, X } from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: "MONTHLY" | "YEARLY" | "CUSTOM" | "AUDIT";
  periodStart: string;
  periodEnd: string;
  status: "GENERATING" | "COMPLETED" | "FAILED";
  aiInsights: string | null;
  createdAt: string;
  generatedBy: {
    name: string;
    email: string;
  };
}

interface ReportsClientProps {
  userRole: string;
}

export default function ReportsClient({ userRole }: ReportsClientProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [reportType, setReportType] = useState<"MONTHLY" | "YEARLY" | "CUSTOM">("MONTHLY");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [includeAI, setIncludeAI] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    // Auto-set dates based on report type
    const now = new Date();
    if (reportType === "MONTHLY") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setPeriodStart(firstDay.toISOString().split("T")[0]);
      setPeriodEnd(lastDay.toISOString().split("T")[0]);
    } else if (reportType === "YEARLY") {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setPeriodStart(firstDay.toISOString().split("T")[0]);
      setPeriodEnd(lastDay.toISOString().split("T")[0]);
    }
  }, [reportType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports");
      const result = await response.json();

      if (result.success) {
        setReports(result.data.reports);
      } else {
        toast.error(result.error?.message || "Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("An error occurred while fetching reports");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!periodStart || !periodEnd) {
      toast.error("Please select a date range");
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: reportType,
          periodStart,
          periodEnd,
          title: reportTitle || undefined,
          includeAIInsights: includeAI,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Report generated successfully");
        setShowCreateModal(false);
        resetForm();
        fetchReports();
      } else {
        toast.error(result.error?.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("An error occurred while generating report");
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: string, title: string) => {
    try {
      toast.loading("Downloading report...", { id: "download" });
      
      const response = await fetch(`/api/reports/${reportId}/download`);
      
      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error?.message || "Failed to download report", { id: "download" });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Report downloaded successfully", { id: "download" });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("An error occurred while downloading report", { id: "download" });
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Report deleted successfully");
        fetchReports();
      } else {
        toast.error(result.error?.message || "Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("An error occurred while deleting report");
    }
  };

  const resetForm = () => {
    setReportType("MONTHLY");
    setPeriodStart("");
    setPeriodEnd("");
    setReportTitle("");
    setIncludeAI(false);
  };

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "GENERATING":
        return <Badge variant="warning">Generating</Badge>;
      case "FAILED":
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: Report["type"]) => {
    const colors: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
      MONTHLY: "primary",
      YEARLY: "success",
      CUSTOM: "warning",
      AUDIT: "default",
    };
    return <Badge variant={colors[type] || "default"}>{type}</Badge>;
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">Reports</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Generate and manage inventory reports
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate your first report to get started
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Generated By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.title}
                        </div>
                        {report.aiInsights && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Includes AI Insights
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(report.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(report.periodStart).toLocaleDateString()} -{" "}
                    {new Date(report.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {report.generatedBy.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {report.status === "COMPLETED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(report.id, report.title)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {userRole === "ADMIN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReport(report.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Generate Report</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Report Title (Optional)</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Auto-generated if left empty"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Period Start</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Period End</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeAI"
                  checked={includeAI}
                  onChange={(e) => setIncludeAI(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="includeAI" className="ml-2 text-sm">
                  Include AI-generated insights
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button onClick={generateReport} disabled={generating}>
                {generating ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
