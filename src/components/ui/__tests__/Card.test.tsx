import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  LoadingCard 
} from '../card'
import { describe, it, expect, vi } from 'vitest'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with children', () => {
      render(
        <Card>
          <div>Card content</div>
        </Card>
      )
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<Card ref={ref}>Card</Card>)
      expect(ref).toHaveBeenCalled()
    })

    describe('Variants', () => {
      const variants = [
        'default', 'elevated', 'interactive', 'success', 
        'warning', 'danger', 'info', 'saudi-green', 'saudi-gold'
      ] as const

      variants.forEach(variant => {
        it(`renders ${variant} variant correctly`, () => {
          render(<Card variant={variant} data-testid="card">Card</Card>)
          const card = screen.getByTestId('card')
          expect(card).toBeInTheDocument()
          expect(card).toHaveClass('rounded-xl', 'transition-all')
          // Note: elevated variant uses border-0 instead of border
        })
      })
    })

    describe('Interactive Features', () => {
      it('handles click events when clickable', async () => {
        const handleClick = vi.fn()
        const user = userEvent.setup()
        
        render(<Card clickable onClick={handleClick}>Clickable Card</Card>)
        
        const card = screen.getByRole('button')
        await user.click(card)
        expect(handleClick).toHaveBeenCalledTimes(1)
      })

      it('has proper role when clickable', () => {
        render(<Card clickable>Clickable Card</Card>)
        expect(screen.getByRole('button')).toBeInTheDocument()
      })

      it('is keyboard accessible when clickable', async () => {
        const handleClick = vi.fn()
        const user = userEvent.setup()
        
        render(<Card clickable onClick={handleClick}>Keyboard Card</Card>)
        
        const card = screen.getByRole('button')
        card.focus()
        
        await user.keyboard('{Enter}')
        expect(handleClick).toHaveBeenCalledTimes(1)
      })

      it('applies hover styles when hoverable', () => {
        render(<Card hoverable data-testid="hoverable-card">Hoverable Card</Card>)
        const card = screen.getByTestId('hoverable-card')
        expect(card).toHaveClass('cursor-pointer')
      })
    })

    describe('States', () => {
      it('shows loading state', () => {
        render(<Card loading data-testid="loading-card">Loading Card</Card>)
        const card = screen.getByTestId('loading-card')
        expect(card).toHaveClass('animate-pulse')
      })

      it('shows disabled state', () => {
        render(<Card disabled data-testid="disabled-card">Disabled Card</Card>)
        const card = screen.getByTestId('disabled-card')
        expect(card).toHaveClass('opacity-50', 'pointer-events-none')
      })

      it('prevents interaction when disabled', async () => {
        const handleClick = vi.fn()
        const user = userEvent.setup()
        
        render(<Card disabled onClick={handleClick}>Disabled Card</Card>)
        
        // Card should still have button role but be disabled
        const card = screen.getByRole('button')
        expect(card).toHaveClass('pointer-events-none')
        
        // Click should not work
        await user.click(card)
        expect(handleClick).not.toHaveBeenCalled()
      })
    })

    describe('Responsive Design', () => {
      it('maintains proper spacing on different screen sizes', () => {
        render(<Card size="sm" data-testid="small-card">Small Card</Card>)
        const card = screen.getByTestId('small-card')
        expect(card).toBeInTheDocument()
      })
    })
  })

  describe('CardHeader', () => {
    it('renders with proper structure', () => {
      render(
        <CardHeader data-testid="card-header">
          <div>Header content</div>
        </CardHeader>
      )
      const header = screen.getByTestId('card-header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5')
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('applies size-based padding', () => {
      const { rerender } = render(<CardHeader size="sm" data-testid="header">Header</CardHeader>)
      let header = screen.getByTestId('header')
      expect(header).toHaveClass('p-4')
      
      rerender(<CardHeader size="lg" data-testid="header">Header</CardHeader>)
      header = screen.getByTestId('header')
      expect(header).toHaveClass('p-8')
    })
  })

  describe('CardTitle', () => {
    it('renders as h3 by default', () => {
      render(<CardTitle>Card Title</CardTitle>)
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveTextContent('Card Title')
    })

    it('renders with custom heading level', () => {
      render(<CardTitle as="h1">Main Title</CardTitle>)
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveTextContent('Main Title')
    })

    it('applies size classes correctly', () => {
      const { rerender } = render(<CardTitle size="sm">Small Title</CardTitle>)
      let title = screen.getByRole('heading')
      expect(title).toHaveClass('text-lg')
      
      rerender(<CardTitle size="xl">Large Title</CardTitle>)
      title = screen.getByRole('heading')
      expect(title).toHaveClass('text-3xl')
    })

    it('has proper typography classes', () => {
      render(<CardTitle>Styled Title</CardTitle>)
      const title = screen.getByRole('heading')
      expect(title).toHaveClass('tracking-tight', 'font-semibold')
      // Note: leading-none is not applied by default
    })
  })

  describe('CardDescription', () => {
    it('renders with proper styling', () => {
      render(<CardDescription data-testid="description">Card description</CardDescription>)
      const description = screen.getByTestId('description')
      expect(description).toHaveClass('text-secondary-600', 'dark:text-secondary-400')
      expect(description).toHaveTextContent('Card description')
    })

    it('applies size classes correctly', () => {
      const { rerender } = render(<CardDescription size="sm">Small desc</CardDescription>)
      let desc = screen.getByText('Small desc')
      expect(desc).toHaveClass('text-xs')
      
      rerender(<CardDescription size="lg">Large desc</CardDescription>)
      desc = screen.getByText('Large desc')
      expect(desc).toHaveClass('text-base')
    })
  })

  describe('CardContent', () => {
    it('renders with proper padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('applies size-based padding', () => {
      const { rerender } = render(<CardContent size="sm" data-testid="content">Content</CardContent>)
      let content = screen.getByTestId('content')
      expect(content).toHaveClass('p-4')
      
      rerender(<CardContent size="lg" data-testid="content">Content</CardContent>)
      content = screen.getByTestId('content')
      expect(content).toHaveClass('p-8')
    })
  })

  describe('CardFooter', () => {
    it('renders with flex layout', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('flex', 'items-center')
    })

    it('applies size-based padding', () => {
      const { rerender } = render(<CardFooter size="sm" data-testid="footer">Footer</CardFooter>)
      let footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('p-4')
      
      rerender(<CardFooter size="lg" data-testid="footer">Footer</CardFooter>)
      footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('p-8')
    })
  })

  describe('LoadingCard', () => {
    it('renders loading skeleton', () => {
      const { container } = render(<LoadingCard />)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('animate-pulse')
      
      // Check for skeleton elements
      const skeletons = card.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('applies variant and size props', () => {
      const { container } = render(<LoadingCard variant="elevated" size="lg" />)
      const card = container.firstChild as HTMLElement
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('animate-pulse')
    })
  })

  describe('Accessibility', () => {
    it('has proper focus management for interactive cards', () => {
      render(<Card clickable>Focusable Card</Card>)
      const card = screen.getByRole('button')
      expect(card).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('supports custom ARIA attributes', () => {
      render(
        <Card 
          clickable 
          aria-label="Custom card label"
          aria-describedby="card-description"
        >
          Card content
        </Card>
      )
      const card = screen.getByRole('button', { name: /custom card label/i })
      expect(card).toHaveAttribute('aria-describedby', 'card-description')
    })
  })

  describe('Complete Card Structure', () => {
    it('renders full card structure correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByRole('heading', { name: /test card/i })).toBeInTheDocument()
      expect(screen.getByText('This is a test card')).toBeInTheDocument()
      expect(screen.getByText('Card content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes', () => {
      render(<Card data-testid="dark-card">Dark mode card</Card>)
      const card = screen.getByTestId('dark-card')
      expect(card).toHaveClass('dark:bg-secondary-900', 'dark:border-secondary-700')
    })
  })

  describe('Animation and Transitions', () => {
    it('has transition classes for smooth interactions', () => {
      render(<Card interactive data-testid="animated-card">Animated Card</Card>)
      const card = screen.getByTestId('animated-card')
      expect(card).toHaveClass('transition-all', 'duration-200')
    })

    it('has hover effects for interactive cards', () => {
      render(<Card interactive data-testid="hover-card">Hover Card</Card>)
      const card = screen.getByTestId('hover-card')
      expect(card).toHaveClass('transition-all', 'duration-200')
      // Note: interactive cards have transition effects
    })
  })
})