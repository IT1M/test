"use client";

import { useState, useCallback, useRef } from "react";
import { InteractiveChart, ChartData } from "../charts/InteractiveChart";
import { cn } from "@/utils/cn";

export interface ReportElement {
  id: string;
  type: "chart" | "table" | "text" | "kpi" | "image";
  title: string;
  config: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  elements: ReportElement[];
  layout: "grid" | "free" | "flow";
  pageSize: "A4" | "A3" | "Letter" | "Custom";
  orientation: "portrait" | "landscape";
}

export interface ReportBuilderProps {
  className?: string;
  onSave?: (template: ReportTemplate) => void;
  onPreview?: (template: ReportTemplate) => void;
  onExport?: (template: ReportTemplate, format: "pdf" | "excel" | "csv") => void;
  initialTemplate?: ReportTemplate;
}

const ELEMENT_TYPES = [
  {
    type: "chart",
    label: "Chart",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    type: "table",
    label: "Table",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
      </svg>
    ),
  },
  {
    type: "text",
    label: "Text Block",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    type: "kpi",
    label: "KPI Card",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
];

const DEFAULT_TEMPLATE: ReportTemplate = {
  id: "new-report",
  name: "New Report",
  description: "Custom report template",
  elements: [],
  layout: "grid",
  pageSize: "A4",
  orientation: "portrait",
};

export function ReportBuilder({
  className,
  onSave,
  onPreview,
  onExport,
  initialTemplate = DEFAULT_TEMPLATE,
}: ReportBuilderProps) {
  const [template, setTemplate] = useState<ReportTemplate>(initialTemplate);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<ReportElement | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((elementType: string) => {
    const newElement: ReportElement = {
      id: `${elementType}-${Date.now()}`,
      type: elementType as any,
      title: `New ${elementType}`,
      config: getDefaultConfig(elementType),
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 },
    };
    setDraggedElement(newElement);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement = {
      ...draggedElement,
      position: { x, y },
    };

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));

    setDraggedElement(null);
  }, [draggedElement]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<ReportElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  const handleElementDelete = useCallback((elementId: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
    }));
    setSelectedElement(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(template);
  }, [template, onSave]);

  const handlePreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
    onPreview?.(template);
  }, [template, onPreview, isPreviewMode]);

  const handleExport = useCallback((format: "pdf" | "excel" | "csv") => {
    onExport?.(template, format);
  }, [template, onExport]);

  if (isPreviewMode) {
    return (
      <div className={cn("bg-white dark:bg-secondary-900 min-h-screen", className)}>
        <ReportPreview
          template={template}
          onBack={() => setIsPreviewMode(false)}
          onExport={handleExport}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen bg-secondary-50 dark:bg-secondary-900", className)}>
      {/* Sidebar - Element Palette */}
      <div className="w-64 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
            Report Elements
          </h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Drag elements to the canvas to build your report
          </p>
        </div>

        <div className="space-y-2">
          {ELEMENT_TYPES.map(elementType => (
            <div
              key={elementType.type}
              draggable
              onDragStart={() => handleDragStart(elementType.type)}
              className="flex items-center gap-3 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg cursor-move hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-colors"
            >
              <div className="text-primary-600 dark:text-primary-400">
                {elementType.icon}
              </div>
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {elementType.label}
              </span>
            </div>
          ))}
        </div>

        {/* Template Settings */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
            Template Settings
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Page Size
              </label>
              <select
                value={template.pageSize}
                onChange={(e) => setTemplate(prev => ({ ...prev, pageSize: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Orientation
              </label>
              <select
                value={template.orientation}
                onChange={(e) => setTemplate(prev => ({ ...prev, orientation: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                {template.name}
              </h2>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                {template.elements.length} elements
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePreview}
                className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-300 dark:border-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                Preview
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "relative bg-white dark:bg-secondary-800 border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg min-h-[800px]",
              template.orientation === "landscape" ? "aspect-[1.414/1]" : "aspect-[1/1.414]"
            )}
            style={{ maxWidth: template.orientation === "landscape" ? "1000px" : "707px" }}
          >
            {template.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-secondary-500 dark:text-secondary-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-lg font-medium">Drop elements here to start building your report</p>
                  <p className="text-sm mt-1">Drag chart, table, or text elements from the sidebar</p>
                </div>
              </div>
            )}

            {template.elements.map(element => (
              <ReportElementRenderer
                key={element.id}
                element={element}
                isSelected={selectedElement === element.id}
                onSelect={() => setSelectedElement(element.id)}
                onUpdate={(updates) => handleElementUpdate(element.id, updates)}
                onDelete={() => handleElementDelete(element.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedElement && (
        <div className="w-80 bg-white dark:bg-secondary-800 border-l border-secondary-200 dark:border-secondary-700 p-4">
          <ElementPropertiesPanel
            element={template.elements.find(el => el.id === selectedElement)!}
            onUpdate={(updates) => handleElementUpdate(selectedElement, updates)}
          />
        </div>
      )}
    </div>
  );
}

interface ReportElementRendererProps {
  element: ReportElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ReportElement>) => void;
  onDelete: () => void;
}

function ReportElementRenderer({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: ReportElementRendererProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      onSelect();
    }
  }, [onSelect]);

  const renderElementContent = () => {
    switch (element.type) {
      case "chart":
        return (
          <div className="w-full h-full p-2">
            <InteractiveChart
              data={element.config.data || []}
              type={element.config.chartType || "bar"}
              dataKeys={element.config.dataKeys || ["value"]}
              title={element.title}
              height={element.size.height - 40}
              interactive={false}
              exportable={false}
            />
          </div>
        );

      case "table":
        return (
          <div className="w-full h-full p-4 overflow-auto">
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              {element.title}
            </h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left py-2">Column 1</th>
                  <th className="text-left py-2">Column 2</th>
                  <th className="text-left py-2">Column 3</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(row => (
                  <tr key={row} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className="py-2">Data {row}.1</td>
                    <td className="py-2">Data {row}.2</td>
                    <td className="py-2">Data {row}.3</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "text":
        return (
          <div className="w-full h-full p-4">
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              {element.title}
            </h4>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {element.config.content || "This is a text block. Click to edit the content."}
            </p>
          </div>
        );

      case "kpi":
        return (
          <div className="w-full h-full p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {element.config.value || "123"}
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                {element.title}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-secondary-500 dark:text-secondary-400">
            {element.type}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "absolute border-2 bg-white dark:bg-secondary-800 rounded-lg overflow-hidden cursor-move",
        isSelected
          ? "border-primary-500 dark:border-primary-400"
          : "border-transparent hover:border-secondary-300 dark:hover:border-secondary-600"
      )}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      {renderElementContent()}

      {isSelected && (
        <>
          {/* Selection handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary-500 border border-white rounded-full cursor-nw-resize"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 border border-white rounded-full cursor-ne-resize"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary-500 border border-white rounded-full cursor-sw-resize"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 border border-white rounded-full cursor-se-resize"></div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center hover:bg-danger-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

interface ElementPropertiesPanelProps {
  element: ReportElement;
  onUpdate: (updates: Partial<ReportElement>) => void;
}

function ElementPropertiesPanel({ element, onUpdate }: ElementPropertiesPanelProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
        Element Properties
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={element.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Width
            </label>
            <input
              type="number"
              value={element.size.width}
              onChange={(e) => onUpdate({
                size: { ...element.size, width: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Height
            </label>
            <input
              type="number"
              value={element.size.height}
              onChange={(e) => onUpdate({
                size: { ...element.size, height: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            />
          </div>
        </div>

        {element.type === "chart" && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Chart Type
            </label>
            <select
              value={element.config.chartType || "bar"}
              onChange={(e) => onUpdate({
                config: { ...element.config, chartType: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>
        )}

        {element.type === "text" && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Content
            </label>
            <textarea
              value={element.config.content || ""}
              onChange={(e) => onUpdate({
                config: { ...element.config, content: e.target.value }
              })}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            />
          </div>
        )}

        {element.type === "kpi" && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Value
            </label>
            <input
              type="text"
              value={element.config.value || ""}
              onChange={(e) => onUpdate({
                config: { ...element.config, value: e.target.value }
              })}
              className="w-full px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ReportPreviewProps {
  template: ReportTemplate;
  onBack: () => void;
  onExport: (format: "pdf" | "excel" | "csv") => void;
}

function ReportPreview({ template, onBack, onExport }: ReportPreviewProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {template.name} - Preview
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport("pdf")}
            className="px-4 py-2 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-md"
          >
            Export PDF
          </button>
          <button
            onClick={() => onExport("excel")}
            className="px-4 py-2 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-md"
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-8 shadow-lg">
        <div
          className="relative bg-white"
          style={{
            width: template.orientation === "landscape" ? "1000px" : "707px",
            minHeight: template.orientation === "landscape" ? "707px" : "1000px",
          }}
        >
          {template.elements.map(element => (
            <div
              key={element.id}
              className="absolute bg-white border border-secondary-200 rounded-lg overflow-hidden"
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.size.width,
                height: element.size.height,
              }}
            >
              <ReportElementRenderer
                element={element}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDefaultConfig(elementType: string) {
  switch (elementType) {
    case "chart":
      return {
        chartType: "bar",
        data: [
          { name: "Jan", value: 400 },
          { name: "Feb", value: 300 },
          { name: "Mar", value: 500 },
        ],
        dataKeys: ["value"],
      };
    case "table":
      return {
        columns: ["Column 1", "Column 2", "Column 3"],
        data: [],
      };
    case "text":
      return {
        content: "This is a text block. Edit this content in the properties panel.",
      };
    case "kpi":
      return {
        value: "123",
        format: "number",
      };
    default:
      return {};
  }
}