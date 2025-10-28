import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InventoryEntryForm } from '../InventoryEntryForm'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.confirm and window.alert
window.confirm = vi.fn()
window.alert = vi.fn()

describe('InventoryEntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    window.confirm.mockReturnValue(true)
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Form Rendering', () => {
    it('renders all form fields', () => {
      render(<InventoryEntryForm />)
      
      expect(screen.getByLabelText(/item name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/batch number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reject quantity/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/destination/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('renders keyboard shortcuts info on desktop', () => {
      render(<InventoryEntryForm />)
      expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument()
      expect(screen.getByText(/ctrl\+s/i)).toBeInTheDocument()
      expect(screen.getByText(/ctrl\+enter/i)).toBeInTheDocument()
    })

    it('renders form action buttons', () => {
      render(<InventoryEntryForm />)
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save entry/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/item name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/batch number is required/i)).toBeInTheDocument()
      expect(screen.getByText(/quantity is required/i)).toBeInTheDocument()
      expect(screen.getByText(/reject quantity is required/i)).toBeInTheDocument()
      expect(screen.getByText(/destination is required/i)).toBeInTheDocument()
    })

    it('validates item name length', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      await user.type(itemNameInput, 'A')
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/item name must be at least 2 characters/i)).toBeInTheDocument()
    })

    it('validates batch number format', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const batchInput = screen.getByLabelText(/batch number/i)
      await user.type(batchInput, 'invalid-batch')
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/batch number must contain only uppercase letters and numbers/i)).toBeInTheDocument()
    })

    it('validates quantity is positive integer', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const quantityInput = screen.getByLabelText(/quantity/i)
      await user.type(quantityInput, '-5')
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/quantity must be positive/i)).toBeInTheDocument()
    })

    it('validates reject quantity does not exceed total quantity', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const quantityInput = screen.getByLabelText(/quantity/i)
      const rejectInput = screen.getByLabelText(/reject quantity/i)
      
      await user.type(quantityInput, '10')
      await user.type(rejectInput, '15')
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/reject quantity cannot exceed total quantity/i)).toBeInTheDocument()
    })

    it('clears validation errors when field is corrected', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      
      // Trigger validation error
      await user.click(submitButton)
      expect(screen.getByText(/item name is required/i)).toBeInTheDocument()
      
      // Fix the error
      await user.type(itemNameInput, 'Valid Item Name')
      expect(screen.queryByText(/item name is required/i)).not.toBeInTheDocument()
    })
  })

  describe('Autocomplete Functionality', () => {
    it('shows item name suggestions when typing', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      await user.type(itemNameInput, 'surg')
      
      expect(screen.getByText('Surgical Mask')).toBeInTheDocument()
      expect(screen.getByText('Surgical Gloves')).toBeInTheDocument()
      expect(screen.getByText('Surgical Drape')).toBeInTheDocument()
    })

    it('selects suggestion when clicked', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      await user.type(itemNameInput, 'surg')
      
      const suggestion = screen.getByText('Surgical Mask')
      await user.click(suggestion)
      
      expect(itemNameInput).toHaveValue('Surgical Mask')
      expect(screen.queryByText('Surgical Gloves')).not.toBeInTheDocument()
    })

    it('shows category suggestions when typing', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const categoryInput = screen.getByLabelText(/category/i)
      await user.type(categoryInput, 'pp')
      
      expect(screen.getByText('PPE')).toBeInTheDocument()
    })

    it('selects category suggestion when clicked', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const categoryInput = screen.getByLabelText(/category/i)
      await user.type(categoryInput, 'pp')
      
      const suggestion = screen.getByText('PPE')
      await user.click(suggestion)
      
      expect(categoryInput).toHaveValue('PPE')
    })
  })

  describe('Reject Rate Calculation', () => {
    it('calculates and displays reject rate', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const quantityInput = screen.getByLabelText(/quantity/i)
      const rejectInput = screen.getByLabelText(/reject quantity/i)
      
      await user.type(quantityInput, '100')
      await user.type(rejectInput, '5')
      
      expect(screen.getByText(/reject rate: 5\.00%/i)).toBeInTheDocument()
    })

    it('applies correct color coding for reject rates', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const quantityInput = screen.getByLabelText(/quantity/i)
      const rejectInput = screen.getByLabelText(/reject quantity/i)
      
      // Test low reject rate (green)
      await user.clear(quantityInput)
      await user.clear(rejectInput)
      await user.type(quantityInput, '100')
      await user.type(rejectInput, '0')
      
      const rejectRateElement = screen.getByText(/reject rate: 0\.00%/i)
      expect(rejectRateElement).toHaveClass('text-success-600')
    })
  })

  describe('Auto-save Functionality', () => {
    it('saves draft to localStorage when form is dirty', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      await user.type(itemNameInput, 'Test Item')
      
      // Fast-forward time to trigger auto-save
      vi.advanceTimersByTime(2100)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'inventory-form-draft',
        expect.stringContaining('Test Item')
      )
      
      vi.useRealTimers()
    })

    it('shows draft saved indicator', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      await user.type(itemNameInput, 'Test Item')
      
      // Fast-forward time to trigger auto-save
      vi.advanceTimersByTime(2100)
      
      await waitFor(() => {
        expect(screen.getByText(/draft saved/i)).toBeInTheDocument()
      })
      
      vi.useRealTimers()
    })

    it('restores draft from localStorage on mount', () => {
      const draftData = {
        data: {
          itemName: 'Restored Item',
          batch: 'BATCH123',
          quantity: '100',
          reject: '5',
          destination: 'MAIS',
          category: 'PPE',
          notes: 'Test notes'
        },
        timestamp: new Date().toISOString()
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(draftData))
      window.confirm.mockReturnValue(true)
      
      render(<InventoryEntryForm />)
      
      expect(screen.getByDisplayValue('Restored Item')).toBeInTheDocument()
      expect(screen.getByDisplayValue('BATCH123')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('submits valid form data', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      // Fill out form with valid data
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      await user.type(screen.getByLabelText(/batch number/i), 'BATCH123')
      await user.type(screen.getByLabelText(/quantity/i), '100')
      await user.type(screen.getByLabelText(/reject quantity/i), '5')
      await user.selectOptions(screen.getByLabelText(/destination/i), 'MAIS')
      await user.type(screen.getByLabelText(/category/i), 'PPE')
      await user.type(screen.getByLabelText(/notes/i), 'Test notes')
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      expect(fetch).toHaveBeenCalledWith('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: 'Test Item',
          batch: 'BATCH123',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          category: 'PPE',
          notes: 'Test notes',
        }),
      })
    })

    it('shows loading state during submission', async () => {
      fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      // Fill out minimal valid form
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      await user.type(screen.getByLabelText(/batch number/i), 'BATCH123')
      await user.type(screen.getByLabelText(/quantity/i), '100')
      await user.type(screen.getByLabelText(/reject quantity/i), '0')
      await user.selectOptions(screen.getByLabelText(/destination/i), 'MAIS')
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('handles API errors gracefully', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Batch number already exists' }
        }),
      })
      
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      await user.type(screen.getByLabelText(/batch number/i), 'DUPLICATE')
      await user.type(screen.getByLabelText(/quantity/i), '100')
      await user.type(screen.getByLabelText(/reject quantity/i), '0')
      await user.selectOptions(screen.getByLabelText(/destination/i), 'MAIS')
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Batch number already exists')
      })
    })

    it('clears form after successful submission', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      await user.type(screen.getByLabelText(/batch number/i), 'BATCH123')
      await user.type(screen.getByLabelText(/quantity/i), '100')
      await user.type(screen.getByLabelText(/reject quantity/i), '0')
      await user.selectOptions(screen.getByLabelText(/destination/i), 'MAIS')
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Inventory item created successfully!')
      })
      
      // Form should be cleared
      expect(screen.getByLabelText(/item name/i)).toHaveValue('')
      expect(screen.getByLabelText(/batch number/i)).toHaveValue('')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('inventory-form-draft')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('saves draft on Ctrl+S', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      
      await user.keyboard('{Control>}s{/Control}')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'inventory-form-draft',
        expect.stringContaining('Test Item')
      )
    })

    it('submits form on Ctrl+Enter', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      // Fill out minimal valid form
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      await user.type(screen.getByLabelText(/batch number/i), 'BATCH123')
      await user.type(screen.getByLabelText(/quantity/i), '100')
      await user.type(screen.getByLabelText(/reject quantity/i), '0')
      await user.selectOptions(screen.getByLabelText(/destination/i), 'MAIS')
      
      await user.keyboard('{Control>}{Enter}{/Control}')
      
      expect(fetch).toHaveBeenCalled()
    })
  })

  describe('Form Reset', () => {
    it('resets form to initial state', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      await user.type(screen.getByLabelText(/batch number/i), 'BATCH123')
      
      const resetButton = screen.getByRole('button', { name: /reset/i })
      await user.click(resetButton)
      
      expect(screen.getByLabelText(/item name/i)).toHaveValue('')
      expect(screen.getByLabelText(/batch number/i)).toHaveValue('')
    })

    it('asks for confirmation when form is dirty', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      
      const resetButton = screen.getByRole('button', { name: /reset/i })
      await user.click(resetButton)
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to reset the form? All unsaved changes will be lost.'
      )
    })
  })

  describe('Accessibility', () => {
    it('has proper form labeling', () => {
      render(<InventoryEntryForm />)
      
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-label', 'Inventory entry form')
    })

    it('has proper ARIA live regions for status updates', () => {
      render(<InventoryEntryForm />)
      
      const statusRegions = screen.getAllByRole('status')
      expect(statusRegions.length).toBeGreaterThan(0)
    })

    it('has proper character count indicators', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      await user.type(screen.getByLabelText(/item name/i), 'Test')
      
      expect(screen.getByText('4/100 characters')).toBeInTheDocument()
    })

    it('announces reject rate changes', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const quantityInput = screen.getByLabelText(/quantity/i)
      const rejectInput = screen.getByLabelText(/reject quantity/i)
      
      await user.type(quantityInput, '100')
      await user.type(rejectInput, '5')
      
      const rejectRate = screen.getByRole('status', { name: /reject rate/i })
      expect(rejectRate).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on mobile layout', () => {
      render(<InventoryEntryForm />)
      
      // Check that form uses responsive grid
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      
      // Check that buttons stack on mobile
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      expect(submitButton).toHaveClass('w-full', 'sm:w-auto')
    })
  })

  describe('Character Limits and Validation', () => {
    it('enforces character limits', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      const longText = 'a'.repeat(101)
      
      await user.type(itemNameInput, longText)
      
      const submitButton = screen.getByRole('button', { name: /save entry/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/item name must not exceed 100 characters/i)).toBeInTheDocument()
    })

    it('shows character count updates', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      await user.type(itemNameInput, 'Test Item')
      
      expect(screen.getByText('9/100 characters')).toBeInTheDocument()
    })
  })
})