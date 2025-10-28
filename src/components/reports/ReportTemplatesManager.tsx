"use client";

import { useState, useCallback } from "react";
import { ReportTemplate } from "./ReportBuilder";
import { cn } from "@/utils/cn";

export interface ReportTemplatesManagerProps {
  className?: string;
  onSelectTemplate?: (template: ReportTemplate) => void;
  onCreateNew?: () => void;
  onEditTemplate?: (template: ReportTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onDuplicateTemplate?: (template: ReportTemplate) => void;
}

// Mock templates for demonstration
const MOCK_TEMPLATES: ReportTemplate[] = [
  {
    id: "inventory-summary",
    name: "Inventory Summary Report",
    description: "Comprehensive overview of inventory levels, categories, and trends",
    elements: [],
    layout: "grid",
    pageSize: "A4",
    orientation: "portrait",
  },
  {
    id: "monthly-analysis",
    name: "Monthly Analysis Report",
    description: "Detailed monthly performance analysis with charts and KPIs",
    elements: [],
    layout: "flow",
    pageSize: "A4",
    orientation: "landscape",
  },
  {
    id: "reject-analysis",
    name: "Reject Analysis Report",
    description: "Analysis of rejected items by category and destination",
    elements: [],
    layout: "grid",
    pageSize: "A4",
    orientation: "portrait",
  },
  {
    id: "executive-dashboard",
    name: "Executive Dashboard",
    description: "High-level KPIs and trends for executive review",
    elements: [],
    layout: "free",
    pageSize: "A3",
    orientation: "landscape",
  },
];

export function ReportTemplatesManager({
  className,
  onSelectTemplate,
  onCreateNew,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
}: ReportTemplatesManagerProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>(MOCK_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "custom" | "system">("all");
  const [sortBy, setSortBy] = useState<"name" | "created" | "modified">("name");

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           (selectedCategory === "system" && MOCK_TEMPLATES.some(t => t.id === template.id)) ||
                           (selectedCategory === "custom" && !MOCK_TEMPLATES.some(t => t.id === template.id));
    
    return matchesSearch && matchesCategory;
  });

  const handleDeleteTemplate = useCallback((templateId: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      onDeleteTemplate?.(templateId);
    }
  }, [onDeleteTemplate]);

  const handleDuplicateTemplate = useCallback((template: ReportTemplate) => {
    const duplicatedTemplate: ReportTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
    };
    
    setTemplates(prev => [...prev, duplicatedTemplate]);
    onDuplicateTemplate?.(duplicatedTemplate);
  }, [onDuplicateTemplate]);

  return (
    <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700", className)}>
      {/* Header */}
      <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Report Templates
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              Manage and organize your report templates
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Template
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            >
              <option value="all">All Templates</option>
              <option value="system">System Templates</option>
              <option value="custom">Custom Templates</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            >
              <option value="name">Name</option>
              <option value="created">Created Date</option>
              <option value="modified">Modified Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-secondary-400 dark:text-secondary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              No templates found
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              {searchQuery ? "Try adjusting your search criteria" : "Get started by creating your first report template"}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateNew}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
              >
                Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate?.(template)}
                onEdit={() => onEditTemplate?.(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
                onDuplicate={() => handleDuplicateTemplate(template)}
                isSystemTemplate={MOCK_TEMPLATES.some(t => t.id === template.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: ReportTemplate;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isSystemTemplate: boolean;
}

function TemplateCard({
  template,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isSystemTemplate,
}: TemplateCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getTemplateIcon = () => {
    switch (template.layout) {
      case "grid":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        );
      case "flow":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        );
      case "free":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div
      className="relative bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onSelect}
    >
      {/* Template Icon and Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-primary-600 dark:text-primary-400">
          {getTemplateIcon()}
        </div>
        
        {isSystemTemplate && (
          <span className="px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            System
          </span>
        )}
      </div>

      {/* Template Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          {template.name}
        </h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2">
          {template.description}
        </p>
      </div>

      {/* Template Details */}
      <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400 mb-4">
        <span className="capitalize">{template.layout} layout</span>
        <span>{template.pageSize} • {template.orientation}</span>
      </div>

      {/* Elements Count */}
      <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>{template.elements.length} elements</span>
      </div>

      {/* Actions Menu */}
      {showActions && (
        <div className="absolute top-2 right-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 first:rounded-t-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate
          </button>

          {!isSystemTemplate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 last:rounded-b-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}