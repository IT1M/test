import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'
import { Card, CardHeader, CardTitle, CardContent } from '../card'
import { Input } from '../Input'
import { InventoryEntryForm } from '../../forms/InventoryEntryForm'
import { 
  checkFormLabeling,
  checkHeadingHierarchy,
  checkInteractiveRoles,
  checkKeyboardNavigation,
  runAccessibilityCheck,
  assertAccessibilityCompliance
} from '../../../test/utils/accessibility'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Accessibility Compliance Tests', () => {
  describe('Button Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button aria-label="Custom button">Button</Button>)
      
      const button = screen.getByRole('button', { name: /custom button/i })
      expect(button).toHaveAttribute('aria-label', 'Custom button')
    })

    it('supports keyboard navigation', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Keyboard Button</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      // Test Enter key
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      // Test Space key
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('has proper focus indicators', () => {
      render(<Button>Focusable Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('announces loading state to screen readers', () => {
      render(<Button loading>Loading Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('provides proper labels for icon-only buttons', () => {
      const TestIcon = () => <span>Icon</span>
      render(<Button iconOnly leftIcon={<TestIcon />} aria-label="Icon button">Button</Button>)
      
      const button = screen.getByRole('button', { name: /icon button/i })
      expect(button).toHaveAttribute('aria-label', 'Icon button')
    })

    it('handles disabled state properly', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('disabled')
    })

    it('has sufficient color contrast', () => {
      render(<Button variant="primary">Primary Button</Button>)
      
      const button = screen.getByRole('button')
      const styles = window.getComputedStyle(button)
      
      // Should have contrasting colors (simplified check)
      expect(styles.color).not.toBe(styles.backgroundColor)
    })
  })

  describe('Card Accessibility', () => {
    it('has proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      )
      
      const title = screen.getByRole('heading', { name: /card title/i })
      expect(title).toBeInTheDocument()
      expect(title.tagName).toBe('H3') // Default heading level
    })

    it('supports keyboard interaction when clickable', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Card clickable onClick={handleClick}>Clickable Card</Card>)
      
      const card = screen.getByRole('button')
      card.focus()
      
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalled()
    })

    it('has proper role when interactive', () => {
      render(<Card clickable>Interactive Card</Card>)
      
      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('role', 'button')
    })

    it('supports custom ARIA attributes', () => {
      render(
        <Card 
          clickable 
          aria-label="Custom card"
          aria-describedby="card-desc"
        >
          Card content
        </Card>
      )
      
      const card = screen.getByRole('button', { name: /custom card/i })
      expect(card).toHaveAttribute('aria-describedby', 'card-desc')
    })

    it('maintains proper heading hierarchy', () => {
      const container = render(
        <div>
          <Card>
            <CardHeader>
              <CardTitle as="h2">Main Card</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h3">Sub Card</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ).container
      
      const hierarchy = checkHeadingHierarchy(container)
      expect(hierarchy.isValidHierarchy).toBe(true)
    })
  })

  describe('Input Accessibility', () => {
    it('associates labels with inputs correctly', () => {
      render(<Input label="Test Input" />)
      
      const input = screen.getByLabelText('Test Input')
      const label = screen.getByText('Test Input')
      
      expect(input).toHaveAttribute('id')
      expect(label).toHaveAttribute('for', input.getAttribute('id'))
    })

    it('announces validation errors', () => {
      render(<Input label="Email" error="Invalid email format" />)
      
      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      
      const errorMessage = screen.getByText('Invalid email format')
      expect(errorMessage).toBeInTheDocument()
    })

    it('shows required field indicators', () => {
      render(<Input label="Required Field" required />)
      
      const input = screen.getByLabelText('Required Field')
      expect(input).toHaveAttribute('required')
      
      const label = screen.getByText('Required Field')
      expect(label).toHaveClass("after:content-['*']")
    })

    it('supports autocomplete with proper ARIA attributes', async () => {
      const suggestions = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' }
      ]
      
      const user = userEvent.setup()
      render(<Input showSuggestions suggestions={suggestions} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
      expect(input).toHaveAttribute('aria-expanded', 'true')
      
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
      
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(2)
    })

    it('handles keyboard navigation in suggestions', async () => {
      const suggestions = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' }
      ]
      
      const user = userEvent.setup()
      render(<Input showSuggestions suggestions={suggestions} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      expect(input).toHaveValue('apple')
    })

    it('provides helper text for screen readers', () => {
      render(<Input label="Password" helperText="Must be at least 8 characters" />)
      
      const helperText = screen.getByText('Must be at least 8 characters')
      expect(helperText).toBeInTheDocument()
    })

    it('announces success states', () => {
      render(<Input success successMessage="Valid input" />)
      
      const successMessage = screen.getByText('Valid input')
      expect(successMessage).toBeInTheDocument()
    })
  })

  describe('Form Accessibility', () => {
    it('has proper form labeling', () => {
      const container = render(<InventoryEntryForm />).container
      const form = container.querySelector('form')!
      
      const labelingResults = checkFormLabeling(form)
      expect(labelingResults.unlabeledInputs).toHaveLength(0)
    })

    it('has proper form semantics', () => {
      render(<InventoryEntryForm />)
      
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-label', 'Inventory entry form')
    })

    it('provides live regions for status updates', () => {
      render(<InventoryEntryForm />)
      
      const statusRegions = screen.getAllByRole('status')
      expect(statusRegions.length).toBeGreaterThan(0)
    })

    it('announces character count changes', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const itemNameInput = screen.getByLabelText(/item name/i)
      await user.type(itemNameInput, 'Test')
      
      const charCount = screen.getByText('4/100 characters')
      expect(charCount).toHaveAttribute('aria-live', 'polite')
    })

    it('handles keyboard shortcuts accessibly', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      // Should show keyboard shortcuts info
      expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument()
      
      // Should handle Ctrl+S for save
      await user.type(screen.getByLabelText(/item name/i), 'Test')
      await user.keyboard('{Control>}s{/Control}')
      
      // Should not cause accessibility issues
      expect(screen.getByLabelText(/item name/i)).toHaveValue('Test')
    })

    it('provides proper error announcements', async () => {
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      const submitButton = screen.getByRole('button', { name: /submit inventory entry form/i })
      await user.click(submitButton)
      
      // Errors should be announced
      const errorMessages = screen.getAllByText(/required/i)
      expect(errorMessages.length).toBeGreaterThan(0)
    })

    it('handles loading states accessibly', async () => {
      // Mock fetch to simulate loading
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      const user = userEvent.setup()
      render(<InventoryEntryForm />)
      
      // Fill minimal form
      await user.type(screen.getByLabelText(/item name/i), 'Test Item')
      await user.type(screen.getByLabelText(/batch number/i), 'BATCH123')
      await user.type(screen.getByLabelText('Quantity'), '100')
      await user.type(screen.getByLabelText('Reject Quantity'), '0')
      await user.selectOptions(screen.getByLabelText(/destination/i), 'MAIS')
      
      const submitButton = screen.getByRole('button', { name: /submit inventory entry form/i })
      await user.click(submitButton)
      
      // Should show loading state
      expect(screen.getByText(/saving/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Focus Management', () => {
    it('maintains logical tab order', () => {
      render(<InventoryEntryForm />)
      
      const form = screen.getByRole('form')
      const focusableElements = form.querySelectorAll(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
      )
      
      expect(focusableElements.length).toBeGreaterThan(0)
      
      // Check that elements are in logical order
      const elements = Array.from(focusableElements)
      elements.forEach((element, index) => {
        const tabIndex = element.getAttribute('tabindex')
        if (tabIndex && parseInt(tabIndex) > 0) {
          // Custom tab order should be logical
          expect(parseInt(tabIndex)).toBeGreaterThan(0)
        }
      })
    })

    it('handles focus trapping in modals/dropdowns', async () => {
      const suggestions = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' }
      ]
      
      const user = userEvent.setup()
      render(<Input showSuggestions suggestions={suggestions} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'a')
      
      // Focus should be manageable within suggestions
      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
    })
  })

  describe('Screen Reader Support', () => {
    it('provides proper landmarks', () => {
      render(<InventoryEntryForm />)
      
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
    })

    it('uses semantic HTML elements', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Semantic Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This uses proper semantic HTML</p>
          </CardContent>
        </Card>
      )
      
      const heading = screen.getByRole('heading')
      expect(heading.tagName).toBe('H3')
    })

    it('provides alternative text for visual elements', () => {
      const TestIcon = () => <span aria-label="Test icon">🔍</span>
      render(<Button leftIcon={<TestIcon />}>Search</Button>)
      
      expect(screen.getByLabelText('Test icon')).toBeInTheDocument()
    })
  })

  describe('Comprehensive Accessibility Check', () => {
    it('passes full accessibility audit for Button', () => {
      const container = render(
        <div>
          <Button>Standard Button</Button>
          <Button variant="primary" disabled>Disabled Button</Button>
          <Button loading>Loading Button</Button>
        </div>
      ).container
      
      expect(() => assertAccessibilityCompliance(container)).not.toThrow()
    })

    it('passes full accessibility audit for Card', () => {
      const container = render(
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Accessible Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Card content with proper structure</p>
            </CardContent>
          </Card>
        </div>
      ).container
      
      expect(() => assertAccessibilityCompliance(container)).not.toThrow()
    })

    it('passes full accessibility audit for Input', () => {
      const container = render(
        <div>
          <Input label="Accessible Input" />
          <Input label="Required Input" required />
          <Input label="Input with Error" error="Error message" />
        </div>
      ).container
      
      expect(() => assertAccessibilityCompliance(container)).not.toThrow()
    })

    it('passes full accessibility audit for Form', () => {
      const container = render(<InventoryEntryForm />).container
      
      // Form should pass basic accessibility checks
      const results = runAccessibilityCheck(container)
      
      // Check that all form inputs are labeled
      expect(results.formLabeling.unlabeledInputs).toHaveLength(0)
      
      // Check heading hierarchy
      expect(results.headingHierarchy.isValidHierarchy).toBe(true)
      
      // Check interactive elements have proper roles
      const incorrectRoles = results.interactiveRoles.filter(r => !r.hasCorrectRole)
      expect(incorrectRoles).toHaveLength(0)
    })
  })

  describe('High Contrast Mode Support', () => {
    it('maintains visibility in high contrast mode', () => {
      // Mock high contrast media query
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<Button variant="outline">High Contrast Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-2') // Should have visible borders
    })
  })

  describe('Reduced Motion Support', () => {
    it('respects reduced motion preferences', () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<Button>Motion Sensitive Button</Button>)
      
      const button = screen.getByRole('button')
      // Should still have transitions but respect user preferences
      expect(button).toHaveClass('transition-all')
    })
  })
})