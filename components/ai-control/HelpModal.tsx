'use client';

import { useState, useEffect } from 'react';
import { X, Book, Settings, Shield, Zap, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  GettingStartedContent, 
  ConfigurationContent, 
  SecurityContent, 
  AutomationContent, 
  TroubleshootingContent, 
  APIReferenceContent 
} from './HelpModalContent';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'البدء السريع',
      icon: <Zap className="w-5 h-5" />,
      content: <GettingStartedContent />
    },
    {
      id: 'configuration',
      title: 'إعداد النماذج',
      icon: <Settings className="w-5 h-5" />,
      content: <ConfigurationContent />
    },
    {
      id: 'security',
      title: 'الأمان والخصوصية',
      icon: <Shield className="w-5 h-5" />,
      content: <SecurityContent />
    },
    {
      id: 'automation',
      title: 'قواعد الأتمتة',
      icon: <Zap className="w-5 h-5" />,
      content: <AutomationContent />
    },
    {
      id: 'troubleshooting',
      title: 'حل المشكلات',
      icon: <AlertTriangle className="w-5 h-5" />,
      content: <TroubleshootingContent />
    },
    {
      id: 'api-reference',
      title: 'مرجع API',
      icon: <Book className="w-5 h-5" />,
      content: <APIReferenceContent />
    }
  ];

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    alert('PDF download functionality will be implemented');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] 
                      flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg 
                            flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                دليل مركز التحكم بالذكاء الاصطناعي
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI Mais Co. - Administrator Guide
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close help modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
            <nav className="p-4 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right
                    ${activeSection === section.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
            {sections.find(s => s.id === activeSection)?.content}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            آخر تحديث: {new Date().toLocaleDateString('ar-SA', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <Button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            تحميل الدليل الكامل PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
