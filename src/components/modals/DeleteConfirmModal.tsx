"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Inventory Item">
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>

        <div className="flex gap-3 pt-4">
          <Button
            variant="danger"
            onClick={handleConfirm}
            isLoading={isDeleting}
            className="flex-1"
          >
            Delete
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
