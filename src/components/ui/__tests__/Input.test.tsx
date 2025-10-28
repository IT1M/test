import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Input Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders with label', () => {
      render(<Input label="Test Input" />)
      expect(screen.getByLabelText('Test Input')).toBeInTheDocument()
    })

    it('handles value changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test value')
      
      expect(handleChange).toHaveBeenCalled()
      expect(input).toHaveValue('test value')
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<Input ref={ref} />)
      expect(ref).toHaveBeenCalled()
    })

    it('generates unique ID when not provided', () => {
      const { rerender } = render(<Input label="First Input" />)
      const firstInput = screen.getByRole('textbox')
      const firstId = firstInput.getAttribute('id')
      
      rerender(<Input label="Second Input" />)
      const secondInput = screen.getByRole('textbox')
      const secondId = secondInput.getAttribute('id')
      
      expect(firstId).not.toBe(secondId)
      expect(firstId).toMatch(/^input-/)
      expect(secondId).toMatch(/^input-/)
    })
  })

  describe('Variants and Sizes', () => {
    const variants = ['default', 'filled', 'underlined'] as const
    const sizes = ['sm', 'md', 'lg'] as const

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Input variant={variant} data-testid="input-container" />)
        const container = screen.getByTestId('input-container').parentElement
        expect(container).toBeInTheDocument()
      })
    })

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Input size={size} data-testid="input-container" />)
        const container = screen.getByTestId('input-container').parentElement
        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('Validation and Error States', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('displays success state', () => {
      render(<Input success successMessage="Valid input" />)
      expect(screen.getByText('Valid input')).toBeInTheDocument()
      
      const successIcon = screen.getByRole('textbox').parentElement?.querySelector('svg')
      expect(successIcon).toBeInTheDocument()
    })

    it('displays helper text', () => {
      render(<Input helperText="Enter your email address" />)
      expect(screen.getByText('Enter your email address')).toBeInTheDocument()
    })

    it('shows required indicator', () => {
      render(<Input label="Required Field" required />)
      const label = screen.getByText('Required Field')
      expect(label).toHaveClass("after:content-['*']")
    })

    it('performs real-time validation', async () => {
      const validator = vi.fn().mockReturnValue('Invalid input')
      const user = userEvent.setup()
      
      render(
        <Input 
          realTimeValidation 
          onValidate={validator}
          debounceMs={100}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      await waitFor(() => {
        expect(validator).toHaveBeenCalledWith('test')
      }, { timeout: 200 })
      
      await waitFor(() => {
        expect(screen.getByText('Invalid input')).toBeInTheDocument()
      })
    })
  })

  describe('Icons and Loading', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>

    it('renders left icon', () => {
      render(<Input leftIcon={<TestIcon />} />)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders right icon', () => {
      render(<Input rightIcon={<TestIcon />} />)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('shows loading spinner', () => {
      render(<Input loading />)
      const spinner = screen.getByRole('textbox').parentElement?.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('prioritizes loading over success icon', () => {
      render(<Input loading success />)
      const spinner = screen.getByRole('textbox').parentElement?.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Suggestions and Autocomplete', () => {
    const suggestions = [
      { value: 'apple', label: 'Apple', description: 'A red fruit' },
      { value: 'banana', label: 'Banana', description: 'A yellow fruit' },
      { value: 'cherry', label: 'Cherry', description: 'A small red fruit' }
    ]

    it('shows suggestions when typing', async () => {
      const user = userEvent.setup()
      
      render(
        <Input 
          showSuggestions 
          suggestions={suggestions}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Banana')).toBeInTheDocument()
      expect(screen.getByText('A red fruit')).toBeInTheDocument()
    })

    it('filters suggestions based on input', async () => {
      const user = userEvent.setup()
      
      render(
        <Input 
          showSuggestions 
          suggestions={suggestions}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'app')
      
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.queryByText('Banana')).not.toBeInTheDocument()
    })

    it('handles suggestion selection', async () => {
      const handleSuggestionSelect = vi.fn()
      const user = userEvent.setup()
      
      render(
        <Input 
          showSuggestions 
          suggestions={suggestions}
          onSuggestionSelect={handleSuggestionSelect}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      const appleSuggestion = screen.getByText('Apple')
      await user.click(appleSuggestion)
      
      expect(handleSuggestionSelect).toHaveBeenCalledWith(suggestions[0])
      expect(input).toHaveValue('apple')
    })

    it('supports keyboard navigation in suggestions', async () => {
      const user = userEvent.setup()
      
      render(
        <Input 
          showSuggestions 
          suggestions={suggestions}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      // Navigate down
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      
      // Select with Enter
      await user.keyboard('{Enter}')
      
      expect(input).toHaveValue('banana')
    })

    it('closes suggestions on Escape', async () => {
      const user = userEvent.setup()
      
      render(
        <Input 
          showSuggestions 
          suggestions={suggestions}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      expect(screen.getByText('Apple')).toBeInTheDocument()
      
      await user.keyboard('{Escape}')
      
      expect(screen.queryByText('Apple')).not.toBeInTheDocument()
    })

    it('limits suggestions to maxSuggestions', async () => {
      const user = userEvent.setup()
      
      render(
        <Input 
          showSuggestions 
          suggestions={suggestions}
          maxSuggestions={2}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Banana')).toBeInTheDocument()
      expect(screen.queryByText('Cherry')).not.toBeInTheDocument()
    })
  })

  describe('Focus and Blur Handling', () => {
    it('handles focus events', async () => {
      const handleFocus = vi.fn()
      const user = userEvent.setup()
      
      render(<Input onFocus={handleFocus} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      expect(handleFocus).toHaveBeenCalled()
    })

    it('handles blur events', async () => {
      const handleBlur = vi.fn()
      const user = userEvent.setup()
      
      render(<Input onBlur={handleBlur} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.tab()
      
      expect(handleBlur).toHaveBeenCalled()
    })

    it('shows suggestions on focus if input has value', async () => {
      const testSuggestions = [
        { value: 'apple', label: 'Apple', description: 'A red fruit' },
        { value: 'banana', label: 'Banana', description: 'A yellow fruit' }
      ]
      
      const user = userEvent.setup()
      
      render(
        <Input 
          showSuggestions 
          suggestions={testSuggestions}
          value="app"
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      expect(screen.getByText('Apple')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Input 
          label="Accessible Input"
          error="Error message"
          helperText="Helper text"
          required
        />
      )
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('required')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('associates label with input', () => {
      render(<Input label="Test Label" />)
      
      const input = screen.getByRole('textbox')
      const label = screen.getByText('Test Label')
      
      expect(input).toHaveAttribute('id')
      expect(label).toHaveAttribute('for', input.getAttribute('id'))
    })

    it('has proper ARIA attributes for suggestions', async () => {
      const testSuggestions = [
        { value: 'apple', label: 'Apple', description: 'A red fruit' },
        { value: 'banana', label: 'Banana', description: 'A yellow fruit' }
      ]
      
      const user = userEvent.setup()
      
      render(
        <Input 
          showSuggestions 
          suggestions={testSuggestions}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
      expect(input).toHaveAttribute('aria-expanded', 'true')
      expect(input).toHaveAttribute('aria-controls')
      
      const suggestionsContainer = screen.getByRole('listbox')
      expect(suggestionsContainer).toBeInTheDocument()
    })

    it('supports screen reader announcements', () => {
      render(<Input error="Error message" />)
      
      const errorMessage = screen.getByText('Error message')
      expect(errorMessage).toHaveClass('text-danger-600')
    })
  })

  describe('Touch-Friendly Design', () => {
    it('has minimum touch target size', () => {
      render(<Input data-testid="input-container" />)
      const container = screen.getByTestId('input-container').parentElement
      expect(container).toHaveClass('min-h-[44px]')
    })

    it('adjusts size for desktop', () => {
      render(<Input data-testid="input-container" />)
      const container = screen.getByTestId('input-container').parentElement
      expect(container).toHaveClass('md:min-h-[40px]')
    })
  })

  describe('RTL Support', () => {
    it('has RTL-aware spacing classes', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>
      
      render(<Input leftIcon={<TestIcon />} />)
      
      // Check that the input container has proper RTL classes
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })
  })

  describe('Form Integration', () => {
    it('works with controlled components', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        return (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            data-testid="controlled-input"
          />
        )
      }
      
      const user = userEvent.setup()
      render(<TestComponent />)
      
      const input = screen.getByTestId('controlled-input')
      await user.type(input, 'controlled')
      
      expect(input).toHaveValue('controlled')
    })

    it('syncs with external value changes', () => {
      const { rerender } = render(<Input value="initial" />)
      let input = screen.getByRole('textbox')
      expect(input).toHaveValue('initial')
      
      rerender(<Input value="updated" />)
      input = screen.getByRole('textbox')
      expect(input).toHaveValue('updated')
    })
  })

  describe('Performance', () => {
    it('debounces validation calls', async () => {
      const validator = vi.fn().mockReturnValue(null)
      const user = userEvent.setup()
      
      render(
        <Input 
          realTimeValidation 
          onValidate={validator}
          debounceMs={100}
        />
      )
      
      const input = screen.getByRole('textbox')
      
      // Type multiple characters quickly
      await user.type(input, 'test', { delay: 10 })
      
      // Validator should not be called immediately
      expect(validator).not.toHaveBeenCalled()
      
      // Wait for debounce
      await waitFor(() => {
        expect(validator).toHaveBeenCalledWith('test')
      }, { timeout: 200 })
      
      // Should only be called once due to debouncing
      expect(validator).toHaveBeenCalledTimes(1)
    })
  })
})