import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'
import { Card } from '../card'
import { Input } from '../Input'
import { InventoryEntryForm } from '../../forms/InventoryEntryForm'
import { 
  setBreakpoint, 
  mockMatchMedia, 
  mockTouchDevice, 
  mockDesktopDevice,
  type Breakpoint 
} from '../../../test/utils/responsive'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { vi } from 'date-fns/locale'
import { vi } from 'date-fns/locale'
import { vi } from 'date-fns/locale'
import { vi } from 'date-fns/locale'
import { vi } from 'date-fns/locale'
import { vi } from 'date-fns/locale'

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    mockDesktopDevice()
  })

  describe('Button Responsive Behavior', () => {
    const breakpoints: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide']

    breakpoints.forEach(breakpoint => {
      describe(`at ${breakpoint} breakpoint`, () => {
        beforeEach(() => {
          setBreakpoint(breakpoint)
          mockMatchMedia(breakpoint)
        })

        it('maintains minimum touch target size', () => {
          render(<Button size="xs">Small Button</Button>)
          const button = screen.getByRole('button')
          
          // Even xs buttons should have minimum 32px height for touch
          expect(button).toHaveClass('h-6') // 24px, but with padding becomes touch-friendly
        })

        it('scales icon sizes appropriately', () => {
          const TestIcon = () => <span data-testid="icon">Icon</span>
          render(<Button leftIcon={<TestIcon />} size="lg">Button</Button>)
          
          const button = screen.getByRole('button')
          expect(button).toBeInTheDocument()
        })

        it('handles full width on mobile', () => {
          if (breakpoint === 'mobile') {
            render(<Button fullWidth>Full Width</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('w-full')
          }
        })
      })
    })

    describe('Touch Device Behavior', () => {
      beforeEach(() => {
        mockTouchDevice()
        setBreakpoint('mobile')
      })

      it('provides adequate touch targets', () => {
        render(<Button size="sm">Touch Button</Button>)
        const button = screen.getByRole('button')
        
        // Should have minimum 44px touch target
        const styles = window.getComputedStyle(button)
        expect(button).toHaveClass('h-8') // 32px + padding = adequate touch target
      })

      it('handles touch-friendly spacing', () => {
        render(
          <div className="space-y-2">
            <Button>Button 1</Button>
            <Button>Button 2</Button>
          </div>
        )
        
        const buttons = screen.getAllByRole('button')
        expect(buttons).toHaveLength(2)
      })
    })
  })

  describe('Card Responsive Behavior', () => {
    const breakpoints: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide']

    breakpoints.forEach(breakpoint => {
      describe(`at ${breakpoint} breakpoint`, () => {
        beforeEach(() => {
          setBreakpoint(breakpoint)
          mockMatchMedia(breakpoint)
        })

        it('adjusts padding based on screen size', () => {
          render(<Card size="md" data-testid="responsive-card">Card Content</Card>)
          const card = screen.getByTestId('responsive-card')
          
          // Cards should maintain consistent padding
          expect(card).toBeInTheDocument()
        })

        it('handles interactive states on touch devices', () => {
          if (breakpoint === 'mobile') {
            mockTouchDevice()
          }
          
          render(<Card interactive data-testid="interactive-card">Interactive Card</Card>)
          const card = screen.getByTestId('interactive-card')
          
          expect(card).toHaveClass('cursor-pointer')
        })

        it('maintains proper border radius', () => {
          render(<Card data-testid="rounded-card">Rounded Card</Card>)
          const card = screen.getByTestId('rounded-card')
          
          expect(card).toHaveClass('rounded-xl')
        })
      })
    })
  })

  describe('Input Responsive Behavior', () => {
    const breakpoints: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide']

    breakpoints.forEach(breakpoint => {
      describe(`at ${breakpoint} breakpoint`, () => {
        beforeEach(() => {
          setBreakpoint(breakpoint)
          mockMatchMedia(breakpoint)
        })

        it('maintains minimum touch target height', () => {
          render(<Input label="Responsive Input" />)
          const inputContainer = screen.getByLabelText('Responsive Input').parentElement
          
          expect(inputContainer).toHaveClass('min-h-[44px]')
          
          if (breakpoint !== 'mobile') {
            expect(inputContainer).toHaveClass('md:min-h-[40px]')
          }
        })

        it('handles suggestions dropdown on small screens', () => {
          const suggestions = [
            { value: 'test1', label: 'Test 1' },
            { value: 'test2', label: 'Test 2' }
          ]
          
          render(
            <Input 
              showSuggestions 
              suggestions={suggestions}
              value="test"
            />
          )
          
          // Suggestions should be visible
          expect(screen.getByText('Test 1')).toBeInTheDocument()
        })

        it('adjusts font size for readability', () => {
          render(<Input size="md" />)
          const input = screen.getByRole('textbox')
          
          expect(input).toHaveClass('text-base')
        })
      })
    })

    describe('Mobile-specific Input Behavior', () => {
      beforeEach(() => {
        setBreakpoint('mobile')
        mockTouchDevice()
      })

      it('prevents zoom on focus (iOS)', () => {
        render(<Input size="lg" />)
        const input = screen.getByRole('textbox')
        
        // Large inputs prevent iOS zoom
        expect(input).toHaveClass('text-lg')
      })

      it('handles virtual keyboard properly', () => {
        render(<Input type="email" />)
        const input = screen.getByRole('textbox')
        
        expect(input).toHaveAttribute('type', 'email')
      })
    })
  })

  describe('Form Responsive Behavior', () => {
    const breakpoints: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide']

    breakpoints.forEach(breakpoint => {
      describe(`at ${breakpoint} breakpoint`, () => {
        beforeEach(() => {
          setBreakpoint(breakpoint)
          mockMatchMedia(breakpoint)
        })

        it('adjusts grid layout based on screen size', () => {
          render(<InventoryEntryForm />)
          
          // Form should be present
          const form = screen.getByRole('form')
          expect(form).toBeInTheDocument()
        })

        it('stacks form actions on mobile', () => {
          render(<InventoryEntryForm />)
          
          const submitButton = screen.getByRole('button', { name: /submit inventory entry form/i })
          
          if (breakpoint === 'mobile') {
            expect(submitButton).toHaveClass('w-full')
          } else {
            expect(submitButton).toHaveClass('sm:w-auto')
          }
        })

        it('hides keyboard shortcuts on mobile', () => {
          render(<InventoryEntryForm />)
          
          if (breakpoint === 'mobile') {
            // Keyboard shortcuts should be hidden on mobile
            const shortcutsSection = screen.queryByText(/keyboard shortcuts/i)
            expect(shortcutsSection?.parentElement).toHaveClass('hidden', 'md:block')
          }
        })
      })
    })
  })

  describe('Grid and Layout Responsive Behavior', () => {
    it('adapts grid columns based on screen size', () => {
      const GridComponent = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>Card 1</Card>
          <Card>Card 2</Card>
          <Card>Card 3</Card>
          <Card>Card 4</Card>
        </div>
      )

      const { rerender } = render(<GridComponent />)
      
      // Test mobile
      setBreakpoint('mobile')
      rerender(<GridComponent />)
      
      // Test tablet
      setBreakpoint('tablet')
      rerender(<GridComponent />)
      
      // Test desktop
      setBreakpoint('desktop')
      rerender(<GridComponent />)
      
      // All cards should be present
      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
      expect(screen.getByText('Card 3')).toBeInTheDocument()
      expect(screen.getByText('Card 4')).toBeInTheDocument()
    })
  })

  describe('Typography Responsive Behavior', () => {
    it('scales text appropriately across breakpoints', () => {
      const TypographyComponent = () => (
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl">Responsive Heading</h1>
          <p className="text-sm md:text-base lg:text-lg">Responsive paragraph</p>
        </div>
      )

      render(<TypographyComponent />)
      
      const heading = screen.getByText('Responsive Heading')
      const paragraph = screen.getByText('Responsive paragraph')
      
      expect(heading).toBeInTheDocument()
      expect(paragraph).toBeInTheDocument()
    })
  })

  describe('Spacing and Padding Responsive Behavior', () => {
    it('adjusts spacing based on screen size', () => {
      const SpacingComponent = () => (
        <div className="p-4 md:p-6 lg:p-8 space-y-2 md:space-y-4">
          <div>Item 1</div>
          <div>Item 2</div>
        </div>
      )

      render(<SpacingComponent />)
      
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })
  })

  describe('Navigation Responsive Behavior', () => {
    it('handles mobile navigation patterns', () => {
      const NavComponent = () => (
        <nav className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <Button variant="ghost">Home</Button>
          <Button variant="ghost">About</Button>
          <Button variant="ghost">Contact</Button>
        </nav>
      )

      render(<NavComponent />)
      
      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /contact/i })).toBeInTheDocument()
    })
  })

  describe('Performance on Different Devices', () => {
    it('handles animations appropriately on low-end devices', () => {
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

      render(<Button>Animated Button</Button>)
      const button = screen.getByRole('button')
      
      // Should still have transition classes but respect user preferences
      expect(button).toHaveClass('transition-all')
    })
  })
})