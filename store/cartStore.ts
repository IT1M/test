// Cart Store - Order item management with localStorage persistence
// Requirements: 12.1

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderItem } from '@/types/database';

interface CartState {
  items: OrderItem[];
  customerId: string | null;
  discount: number;
  tax: number;
  notes: string;
  
  // Computed values
  subtotal: number;
  totalAmount: number;
  itemCount: number;
  
  // Actions
  addItem: (item: Omit<OrderItem, 'total'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  setCustomer: (customerId: string | null) => void;
  setDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getItem: (productId: string) => OrderItem | undefined;
  hasItem: (productId: string) => boolean;
  calculateTotals: () => void;
}

// Helper function to calculate item total
const calculateItemTotal = (quantity: number, unitPrice: number, discount: number = 0): number => {
  const subtotal = quantity * unitPrice;
  return subtotal - discount;
};

// Helper function to calculate cart subtotal
const calculateSubtotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.total, 0);
};

// Helper function to calculate total amount
const calculateTotal = (subtotal: number, discount: number, tax: number): number => {
  const afterDiscount = subtotal - discount;
  return afterDiscount + tax;
};

// Helper function to count total items
const countItems = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      discount: 0,
      tax: 0,
      notes: '',
      subtotal: 0,
      totalAmount: 0,
      itemCount: 0,

      addItem: (item) => {
        const state = get();
        const existingItem = state.items.find((i) => i.productId === item.productId);

        if (existingItem) {
          // Update quantity if item already exists
          const updatedItems = state.items.map((i) =>
            i.productId === item.productId
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  total: calculateItemTotal(
                    i.quantity + item.quantity,
                    i.unitPrice,
                    i.discount
                  ),
                }
              : i
          );

          const subtotal = calculateSubtotal(updatedItems);
          const totalAmount = calculateTotal(subtotal, state.discount, state.tax);
          const itemCount = countItems(updatedItems);

          set({
            items: updatedItems,
            subtotal,
            totalAmount,
            itemCount,
          });
        } else {
          // Add new item
          const newItem: OrderItem = {
            ...item,
            total: calculateItemTotal(item.quantity, item.unitPrice, item.discount || 0),
          };

          const updatedItems = [...state.items, newItem];
          const subtotal = calculateSubtotal(updatedItems);
          const totalAmount = calculateTotal(subtotal, state.discount, state.tax);
          const itemCount = countItems(updatedItems);

          set({
            items: updatedItems,
            subtotal,
            totalAmount,
            itemCount,
          });
        }
      },

      removeItem: (productId) => {
        const state = get();
        const updatedItems = state.items.filter((item) => item.productId !== productId);
        const subtotal = calculateSubtotal(updatedItems);
        const totalAmount = calculateTotal(subtotal, state.discount, state.tax);
        const itemCount = countItems(updatedItems);

        set({
          items: updatedItems,
          subtotal,
          totalAmount,
          itemCount,
        });
      },

      updateQuantity: (productId, quantity) => {
        const state = get();

        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          state.removeItem(productId);
          return;
        }

        const updatedItems = state.items.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity,
                total: calculateItemTotal(quantity, item.unitPrice, item.discount),
              }
            : item
        );

        const subtotal = calculateSubtotal(updatedItems);
        const totalAmount = calculateTotal(subtotal, state.discount, state.tax);
        const itemCount = countItems(updatedItems);

        set({
          items: updatedItems,
          subtotal,
          totalAmount,
          itemCount,
        });
      },

      updateItemDiscount: (productId, discount) => {
        const state = get();
        const updatedItems = state.items.map((item) =>
          item.productId === productId
            ? {
                ...item,
                discount,
                total: calculateItemTotal(item.quantity, item.unitPrice, discount),
              }
            : item
        );

        const subtotal = calculateSubtotal(updatedItems);
        const totalAmount = calculateTotal(subtotal, state.discount, state.tax);

        set({
          items: updatedItems,
          subtotal,
          totalAmount,
        });
      },

      setCustomer: (customerId) => {
        set({ customerId });
      },

      setDiscount: (discount) => {
        const state = get();
        const totalAmount = calculateTotal(state.subtotal, discount, state.tax);
        set({ discount, totalAmount });
      },

      setTax: (tax) => {
        const state = get();
        const totalAmount = calculateTotal(state.subtotal, state.discount, tax);
        set({ tax, totalAmount });
      },

      setNotes: (notes) => {
        set({ notes });
      },

      clearCart: () => {
        set({
          items: [],
          customerId: null,
          discount: 0,
          tax: 0,
          notes: '',
          subtotal: 0,
          totalAmount: 0,
          itemCount: 0,
        });
      },

      getItem: (productId) => {
        return get().items.find((item) => item.productId === productId);
      },

      hasItem: (productId) => {
        return get().items.some((item) => item.productId === productId);
      },

      calculateTotals: () => {
        const state = get();
        const subtotal = calculateSubtotal(state.items);
        const totalAmount = calculateTotal(subtotal, state.discount, state.tax);
        const itemCount = countItems(state.items);

        set({
          subtotal,
          totalAmount,
          itemCount,
        });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        customerId: state.customerId,
        discount: state.discount,
        tax: state.tax,
        notes: state.notes,
        subtotal: state.subtotal,
        totalAmount: state.totalAmount,
        itemCount: state.itemCount,
      }),
    }
  )
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Add a product to the cart
 */
export const addToCart = (
  productId: string,
  productName: string,
  sku: string,
  quantity: number,
  unitPrice: number,
  discount: number = 0
) => {
  useCartStore.getState().addItem({
    productId,
    productName,
    sku,
    quantity,
    unitPrice,
    discount,
  });
};

/**
 * Remove a product from the cart
 */
export const removeFromCart = (productId: string) => {
  useCartStore.getState().removeItem(productId);
};

/**
 * Update product quantity in cart
 */
export const updateCartQuantity = (productId: string, quantity: number) => {
  useCartStore.getState().updateQuantity(productId, quantity);
};

/**
 * Update product discount in cart
 */
export const updateCartItemDiscount = (productId: string, discount: number) => {
  useCartStore.getState().updateItemDiscount(productId, discount);
};

/**
 * Set the customer for the order
 */
export const setCartCustomer = (customerId: string | null) => {
  useCartStore.getState().setCustomer(customerId);
};

/**
 * Set the order-level discount
 */
export const setCartDiscount = (discount: number) => {
  useCartStore.getState().setDiscount(discount);
};

/**
 * Set the order tax
 */
export const setCartTax = (tax: number) => {
  useCartStore.getState().setTax(tax);
};

/**
 * Set order notes
 */
export const setCartNotes = (notes: string) => {
  useCartStore.getState().setNotes(notes);
};

/**
 * Clear the entire cart
 */
export const clearCart = () => {
  useCartStore.getState().clearCart();
};

/**
 * Get cart summary
 */
export const getCartSummary = () => {
  const state = useCartStore.getState();
  return {
    itemCount: state.itemCount,
    subtotal: state.subtotal,
    discount: state.discount,
    tax: state.tax,
    totalAmount: state.totalAmount,
    customerId: state.customerId,
  };
};

/**
 * Check if cart is empty
 */
export const isCartEmpty = (): boolean => {
  return useCartStore.getState().items.length === 0;
};

/**
 * Check if cart has a specific product
 */
export const hasProductInCart = (productId: string): boolean => {
  return useCartStore.getState().hasItem(productId);
};

/**
 * Get product quantity in cart
 */
export const getProductQuantityInCart = (productId: string): number => {
  const item = useCartStore.getState().getItem(productId);
  return item?.quantity || 0;
};

/**
 * Get all cart items
 */
export const getCartItems = (): OrderItem[] => {
  return useCartStore.getState().items;
};

/**
 * Validate cart before checkout
 */
export const validateCart = (): { valid: boolean; errors: string[] } => {
  const state = useCartStore.getState();
  const errors: string[] = [];

  if (state.items.length === 0) {
    errors.push('Cart is empty');
  }

  if (!state.customerId) {
    errors.push('Customer is not selected');
  }

  // Check for invalid quantities
  const invalidItems = state.items.filter((item) => item.quantity <= 0);
  if (invalidItems.length > 0) {
    errors.push('Some items have invalid quantities');
  }

  // Check for invalid prices
  const invalidPrices = state.items.filter((item) => item.unitPrice <= 0);
  if (invalidPrices.length > 0) {
    errors.push('Some items have invalid prices');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Prepare cart data for order creation
 */
export const prepareOrderData = () => {
  const state = useCartStore.getState();
  const validation = validateCart();

  if (!validation.valid) {
    throw new Error(`Cart validation failed: ${validation.errors.join(', ')}`);
  }

  return {
    customerId: state.customerId!,
    items: state.items,
    subtotal: state.subtotal,
    discount: state.discount,
    tax: state.tax,
    totalAmount: state.totalAmount,
    notes: state.notes,
  };
};

/**
 * Calculate tax based on subtotal and tax rate
 */
export const calculateTaxAmount = (taxRate: number): number => {
  const state = useCartStore.getState();
  const afterDiscount = state.subtotal - state.discount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  return Math.round(taxAmount * 100) / 100; // Round to 2 decimal places
};

/**
 * Apply tax rate to cart
 */
export const applyTaxRate = (taxRate: number) => {
  const taxAmount = calculateTaxAmount(taxRate);
  setCartTax(taxAmount);
};

/**
 * Apply percentage discount to cart
 */
export const applyPercentageDiscount = (percentage: number) => {
  const state = useCartStore.getState();
  const discountAmount = (state.subtotal * percentage) / 100;
  setCartDiscount(Math.round(discountAmount * 100) / 100);
};

/**
 * Get cart item by product ID
 */
export const getCartItem = (productId: string): OrderItem | undefined => {
  return useCartStore.getState().getItem(productId);
};

/**
 * Increment product quantity in cart
 */
export const incrementCartItem = (productId: string) => {
  const item = getCartItem(productId);
  if (item) {
    updateCartQuantity(productId, item.quantity + 1);
  }
};

/**
 * Decrement product quantity in cart
 */
export const decrementCartItem = (productId: string) => {
  const item = getCartItem(productId);
  if (item) {
    const newQuantity = item.quantity - 1;
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  }
};

/**
 * Load cart from order (for editing existing orders)
 */
export const loadCartFromOrder = (order: {
  customerId: string;
  items: OrderItem[];
  discount: number;
  tax: number;
  notes?: string;
}) => {
  const store = useCartStore.getState();
  
  // Clear existing cart
  store.clearCart();
  
  // Set customer
  store.setCustomer(order.customerId);
  
  // Add items
  order.items.forEach((item) => {
    store.addItem(item);
  });
  
  // Set discount and tax
  store.setDiscount(order.discount);
  store.setTax(order.tax);
  
  // Set notes
  if (order.notes) {
    store.setNotes(order.notes);
  }
};

/**
 * Get cart statistics
 */
export const getCartStatistics = () => {
  const state = useCartStore.getState();
  
  return {
    totalItems: state.items.length,
    totalQuantity: state.itemCount,
    subtotal: state.subtotal,
    discount: state.discount,
    discountPercentage: state.subtotal > 0 ? (state.discount / state.subtotal) * 100 : 0,
    tax: state.tax,
    taxPercentage: state.subtotal > 0 ? (state.tax / (state.subtotal - state.discount)) * 100 : 0,
    totalAmount: state.totalAmount,
    averageItemPrice: state.items.length > 0 ? state.subtotal / state.itemCount : 0,
    hasCustomer: !!state.customerId,
    hasNotes: !!state.notes,
  };
};
