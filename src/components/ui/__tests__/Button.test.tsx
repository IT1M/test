import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'
import { describe, it, expect, vi } from 'vitest'

describe('Button Component', () => {
  describe('Basic Functionality', () => {
    it('renders with children', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('handles click events', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      
      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Button</Button>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('Variants', () => {
    const variants = [
      'primary', 'secondary', 'outline', 'ghost', 'danger', 
      'success', 'warning', 'info', 'saudi-green', 'saudi-gold'
    ] as const

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button variant={variant}>Button</Button>)
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
      })
    })
  })

  describe('Sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Button size={size}>Button</Button>)
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toBeDisabled()
      
      // Check for loading spinner
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('shows loading text for screen readers', () => {
      render(<Button loading>Loading Button</Button>)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('prevents clicks when loading', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button loading onClick={handleClick}>Loading Button</Button>)
      
      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('prevents clicks when disabled', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button disabled onClick={handleClick}>Disabled Button</Button>)
      
      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Icons', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>

    it('renders left icon', () => {
      render(<Button leftIcon={<TestIcon />}>Button with left icon</Button>)
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByText('Button with left icon')).toBeInTheDocument()
    })

    it('renders right icon', () => {
      render(<Button rightIcon={<TestIcon />}>Button with right icon</Button>)
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByText('Button with right icon')).toBeInTheDocument()
    })

    it('renders icon-only button', () => {
      render(<Button iconOnly leftIcon={<TestIcon />} aria-label="Icon button">Button</Button>)
      
      const button = screen.getByRole('button', { name: /icon button/i })
      expect(button).toBeInTheDocument()
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('has proper aria-label for icon-only buttons', () => {
      render(<Button iconOnly leftIcon={<TestIcon />} aria-label="Custom label">Button</Button>)
      
      const button = screen.getByRole('button', { name: /custom label/i })
      expect(button).toHaveAttribute('aria-label', 'Custom label')
    })
  })

  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })
  })

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<Button>Focusable Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-offset-2')
    })

    it('supports keyboard navigation', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Keyboard Button</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('has proper ARIA attributes', () => {
      render(<Button aria-label="Custom ARIA label">Button</Button>)
      
      const button = screen.getByRole('button', { name: /custom aria label/i })
      expect(button).toHaveAttribute('aria-label', 'Custom ARIA label')
    })
  })

  describe('Custom Props', () => {
    it('forwards additional props', () => {
      render(<Button data-testid="custom-button" title="Custom title">Button</Button>)
      
      const button = screen.getByTestId('custom-button')
      expect(button).toHaveAttribute('title', 'Custom title')
    })

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Responsive Behavior', () => {
    it('maintains touch-friendly size on mobile', () => {
      render(<Button size="sm">Small Button</Button>)
      
      const button = screen.getByRole('button')
      // Check that button has minimum touch target size
      expect(button).toHaveClass('h-8') // 32px minimum for touch
    })

    it('scales properly with different sizes', () => {
      const { rerender } = render(<Button size="xs">Button</Button>)
      let button = screen.getByRole('button')
      expect(button).toHaveClass('h-6')
      
      rerender(<Button size="xl">Button</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-14')
    })
  })

  describe('RTL Support', () => {
    it('applies RTL classes for icon spacing', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>
      
      render(<Button leftIcon={<TestIcon />}>Button with icon</Button>)
      
      const iconSpan = screen.getByTestId('test-icon').parentElement
      expect(iconSpan).toHaveClass('rtl:mr-0', 'rtl:ml-2')
    })
  })

  describe('Animation and Interaction', () => {
    it('has hover and active states', () => {
      render(<Button>Interactive Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('active:scale-[0.98]')
      // Note: hover:shadow-sm is overridden by variant-specific hover:shadow-md
    })

    it('has transition classes', () => {
      render(<Button>Animated Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('transition-all', 'duration-200')
    })
  })
})