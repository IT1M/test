'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { HelpModal } from './HelpModal';

export function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 
                   rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
                   hover:scale-110 flex items-center justify-center group"
        aria-label="Open Help Guide"
      >
        <HelpCircle className="w-7 h-7 text-white" />
        
        {/* Tooltip */}
        <span className="absolute right-16 bg-gray-900 text-white px-3 py-1 rounded-md text-sm
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          دليل الإعداد والمساعدة
        </span>
        
        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></span>
      </button>
      
      {/* Help Modal */}
      {isOpen && <HelpModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
