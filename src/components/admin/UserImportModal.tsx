"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  Users,
  Mail,
  Key,
  FileSpreadsheet
} from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";

type UserRole = "ADMIN" | "DATA_ENTRY" | "SUPERVISOR" | "MANAGER" | "AUDITOR";

interface ImportUser {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
}

interface UserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function UserImportModal({ 
  isOpen, 
  onClose, 
  onImportComplete 
}: UserImportModalProps) {
  const [importMethod, setImportMethod] = useState<"manual" | "csv">("manual");
  const [users, setUsers] = useState<ImportUser[]>([
    { email: "", name: "", role: "DATA_ENTRY", isActive: true }
  ]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ImportUser[]>([]);
  const [generatePasswords, setGeneratePasswords] = useState(true);
  const [sendInvitations, setSendInvitations] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUser = (user: ImportUser, index: number): string[] => {
    const errors: string[] = [];
    
    if (!user.email) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push("Invalid email format");
    }
    
    if (!user.name || user.name.length < 2) {
      errors.push("Name must be at least 2 characters");
    }
    
    if (!generatePasswords && (!user.password || user.password.length < 8)) {
      errors.push("Password must be at least 8 characters");
    }
    
    return errors;
  };

  const addUser = () => {
    setUsers([...users, { email: "", name: "", role: "DATA_ENTRY", isActive: true }]);
  };

  const removeUser = (index: number) => {
    if (users.length > 1) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const updateUser = (index: number, field: keyof ImportUser, value: any) => {
    const updatedUsers = [...users];
    updatedUsers[index] = { ...updatedUsers[index], [field]: value };
    setUsers(updatedUsers);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error("CSV file must have at least a header and one data row");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['email', 'name', 'role'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          toast.error(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        const parsedUsers: ImportUser[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const user: any = {};
          
          headers.forEach((header, index) => {
            user[header] = values[index] || '';
          });

          parsedUsers.push({
            email: user.email,
            name: user.name,
            password: user.password || '',
            role: (user.role?.toUpperCase() as UserRole) || 'DATA_ENTRY',
            isActive: user.isactive !== 'false' && user.isactive !== '0',
          });
        }

        setCsvData(parsedUsers);
        toast.success(`Parsed ${parsedUsers.length} users from CSV`);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error("Failed to parse CSV file");
      }
    };
    
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = [
      "email,name,role,password,isActive",
      "john.doe@example.com,John Doe,DATA_ENTRY,,true",
      "jane.smith@example.com,Jane Smith,SUPERVISOR,,true",
      "admin@example.com,Admin User,ADMIN,SecurePass123!,true"
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImport = async () => {
    const usersToImport = importMethod === "csv" ? csvData : users;
    
    // Validate all users
    const validationErrors: Record<string, string[]> = {};
    usersToImport.forEach((user, index) => {
      const userErrors = validateUser(user, index);
      if (userErrors.length > 0) {
        validationErrors[index] = userErrors;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      const flatErrors: Record<string, string> = {};
      Object.entries(validationErrors).forEach(([index, errors]) => {
        flatErrors[index] = errors.join(', ');
      });
      setErrors(flatErrors);
      toast.error("Please fix validation errors before importing");
      return;
    }

    setIsImporting(true);
    setErrors({});

    try {
      const response = await fetch('/api/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: usersToImport.map(user => ({
            email: user.email,
            name: user.name,
            password: generatePasswords ? undefined : user.password,
            role: user.role,
            isActive: user.isActive,
          })),
          generatePasswords,
          sendInvitations,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImportResults(data.data);
        toast.success(`Successfully imported ${data.data.summary.successful} users`);
        
        if (data.data.summary.failed > 0) {
          toast(`${data.data.summary.failed} users failed to import`, { 
          icon: '⚠️',
          style: { background: '#fbbf24', color: '#92400e' }
        });
        }
      } else {
        toast.error(data.error?.message || "Failed to import users");
        if (data.error?.details) {
          console.error("Import errors:", data.error.details);
        }
      }
    } catch (error) {
      console.error("Error importing users:", error);
      toast.error("Failed to import users");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (importResults?.summary?.successful > 0) {
      onImportComplete();
    }
    
    // Reset state
    setImportMethod("manual");
    setUsers([{ email: "", name: "", role: "DATA_ENTRY", isActive: true }]);
    setCsvFile(null);
    setCsvData([]);
    setGeneratePasswords(true);
    setSendInvitations(true);
    setImportResults(null);
    setErrors({});
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Users"
      size="xl"
    >
      <div className="space-y-6">
        {/* Import Method Selection */}
        <div>
          <label className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3 block">
            Import Method
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setImportMethod("manual")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                importMethod === "manual"
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20"
                  : "border-secondary-300 hover:border-secondary-400"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Manual Entry</span>
            </button>
            <button
              onClick={() => setImportMethod("csv")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                importMethod === "csv"
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20"
                  : "border-secondary-300 hover:border-secondary-400"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>CSV Upload</span>
            </button>
          </div>
        </div>

        {/* CSV Upload */}
        {importMethod === "csv" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                CSV File
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                  Upload CSV file with user data
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 cursor-pointer"
                >
                  Choose File
                </label>
                {csvFile && (
                  <div className="mt-2 text-sm text-secondary-600">
                    {csvFile.name} ({csvData.length} users)
                  </div>
                )}
              </div>
            </div>

            {csvData.length > 0 && (
              <div className="max-h-60 overflow-y-auto border border-secondary-200 dark:border-secondary-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-secondary-50 dark:bg-secondary-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((user, index) => (
                      <tr key={index} className="border-t border-secondary-200 dark:border-secondary-700">
                        <td className="px-3 py-2">{user.email}</td>
                        <td className="px-3 py-2">{user.name}</td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary">{user.role}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={user.isActive ? "success" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry */}
        {importMethod === "manual" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Users to Import
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addUser}
              >
                <Users className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {users.map((user, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                  <div className="col-span-3">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={user.email}
                      onChange={(e) => updateUser(index, "email", e.target.value)}
                      error={errors[index]?.includes("Email") ? "Invalid email" : undefined}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={user.name}
                      onChange={(e) => updateUser(index, "name", e.target.value)}
                      error={errors[index]?.includes("Name") ? "Name required" : undefined}
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={user.role}
                      onChange={(e) => updateUser(index, "role", e.target.value as UserRole)}
                    >
                      <option value="DATA_ENTRY">Data Entry</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="AUDITOR">Auditor</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </div>
                  {!generatePasswords && (
                    <div className="col-span-3">
                      <Input
                        type="password"
                        placeholder="Password"
                        value={user.password || ""}
                        onChange={(e) => updateUser(index, "password", e.target.value)}
                        error={errors[index]?.includes("Password") ? "Password required" : undefined}
                      />
                    </div>
                  )}
                  <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={user.isActive}
                      onChange={(e) => updateUser(index, "isActive", e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {users.length > 1 && (
                      <button
                        onClick={() => removeUser(index)}
                        className="text-danger-600 hover:text-danger-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Options */}
        <div className="space-y-4 border-t border-secondary-200 dark:border-secondary-700 pt-4">
          <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            Import Options
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="generatePasswords"
                checked={generatePasswords}
                onChange={(e) => setGeneratePasswords(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="generatePasswords" className="flex items-center space-x-2 text-sm">
                <Key className="h-4 w-4 text-secondary-400" />
                <span>Generate random passwords</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="sendInvitations"
                checked={sendInvitations}
                onChange={(e) => setSendInvitations(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="sendInvitations" className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-secondary-400" />
                <span>Send invitation emails</span>
              </label>
            </div>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4">
            <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3">
              Import Results
            </h4>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-success-50 dark:bg-success-900/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <span className="text-sm font-medium">Successful</span>
                </div>
                <div className="text-2xl font-bold text-success-600">
                  {importResults.summary.successful}
                </div>
              </div>
              
              <div className="bg-danger-50 dark:bg-danger-900/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-danger-600" />
                  <span className="text-sm font-medium">Failed</span>
                </div>
                <div className="text-2xl font-bold text-danger-600">
                  {importResults.summary.failed}
                </div>
              </div>
              
              <div className="bg-secondary-50 dark:bg-secondary-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-secondary-600" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <div className="text-2xl font-bold text-secondary-600">
                  {importResults.summary.totalAttempted}
                </div>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-danger-600">Errors:</h5>
                {importResults.errors.map((error: any, index: number) => (
                  <div key={index} className="text-sm text-danger-600 bg-danger-50 dark:bg-danger-900/20 p-2 rounded">
                    {error.email}: {error.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <Button variant="ghost" onClick={handleClose}>
            {importResults ? "Close" : "Cancel"}
          </Button>
          {!importResults && (
            <Button
              variant="primary"
              onClick={handleImport}
              loading={isImporting}
              disabled={
                (importMethod === "manual" && users.every(u => !u.email || !u.name)) ||
                (importMethod === "csv" && csvData.length === 0)
              }
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Users
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}