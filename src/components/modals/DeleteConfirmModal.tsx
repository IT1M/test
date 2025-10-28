"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemName: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const Content = (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-danger-600 dark:text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
      
      <p className="text-center text-secondary-700 dark:text-secondary-300">
        Are you sure you want to delete <strong className="text-secondary-900 dark:text-secondary-100">{itemName}</strong>?
      </p>
      
      <p className="text-center text-sm text-secondary-600 dark:text-secondary-400">
        This action cannot be undone.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="danger"
          onClick={handleConfirm}
          isLoading={isDeleting}
          className="flex-1"
        >
          Delete
        </Button>
        <Button variant="outline" onClick={onClose} disabled={isDeleting} className="flex-1 sm:flex-initial">
          Cancel
        </Button>
      </div>
    </div>
  );

  // Use BottomSheet on mobile, Modal on desktop
  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Delete Inventory Item">
        {Content}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Inventory Item">
      {Content}
    </Modal>
  );
}
