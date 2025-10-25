"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface InventoryItem {
  id: string;
  itemName: string;
  batch: string;
  quantity: number;
  reject: number;
  destination: "MAIS" | "FOZAN";
  category: string | null;
  notes: string | null;
}

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

export function EditInventoryModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: EditInventoryModalProps) {
  const [formData, setFormData] = useState({
    itemName: "",
    batch: "",
    quantity: 0,
    reject: 0,
    destination: "MAIS" as "MAIS" | "FOZAN",
    category: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        itemName: item.itemName,
        batch: item.batch,
        quantity: item.quantity,
        reject: item.reject,
        destination: item.destination,
        category: item.category || "",
        notes: item.notes || "",
      });
      setErrors({});
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemName: formData.itemName,
          batch: formData.batch,
          quantity: formData.quantity,
          reject: formData.reject,
          destination: formData.destination,
          category: formData.category || null,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.details) {
          const fieldErrors: Record<string, string> = {};
          result.error.details.forEach((err: any) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: result.error?.message || "Failed to update item" });
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating inventory item:", error);
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rejectPercentage = formData.quantity > 0
    ? ((formData.reject / formData.quantity) * 100).toFixed(2)
    : "0.00";

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
        {errors.general && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg text-danger-700 dark:text-danger-400 text-sm">
            {errors.general}
          </div>
        )}

        <Input
          label="Item Name"
          value={formData.itemName}
          onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          error={errors.itemName}
          required
        />

        <Input
          label="Batch Number"
          value={formData.batch}
          onChange={(e) =>
            setFormData({ ...formData, batch: e.target.value.toUpperCase() })
          }
          error={errors.batch}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
            }
            error={errors.quantity}
            required
          />

          <Input
            label="Reject Quantity"
            type="number"
            value={formData.reject}
            onChange={(e) =>
              setFormData({ ...formData, reject: parseInt(e.target.value) || 0 })
            }
            error={errors.reject}
            helperText={`Reject Rate: ${rejectPercentage}%`}
            required
          />
        </div>

        <Select
          label="Destination"
          value={formData.destination}
          onChange={(e) =>
            setFormData({
              ...formData,
              destination: e.target.value as "MAIS" | "FOZAN",
            })
          }
          error={errors.destination}
          required
        >
          <option value="MAIS">MAIS</option>
          <option value="FOZAN">FOZAN</option>
        </Select>

        <Input
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          error={errors.category}
        />

        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          error={errors.notes}
          rows={3}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white dark:bg-secondary-900 pb-4 -mb-4">
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-1">
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-initial">
            Cancel
          </Button>
        </div>
      </form>
  );

  // Use BottomSheet on mobile, Modal on desktop
  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Edit Inventory Item">
        {FormContent}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Inventory Item">
      {FormContent}
    </Modal>
  );
}
