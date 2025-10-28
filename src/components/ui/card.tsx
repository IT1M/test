import * as React from "react"
import { cn } from "@/utils/cn"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | 'default' 
    | 'elevated' 
    | 'interactive' 
    | 'success' 
    | 'warning' 
    | 'danger' 
    | 'info'
    | 'saudi-green'
    | 'saudi-gold';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    hoverable = false,
    clickable = false,
    loading = false,
    disabled = false,
    onClick,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'rounded-xl border transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      loading && 'animate-pulse',
      disabled && 'opacity-50 pointer-events-none'
    );

    const variants = {
      default: cn(
        'bg-white border-secondary-200 text-secondary-900 shadow-sm',
        'dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-100'
      ),
      elevated: cn(
        'bg-white border-0 text-secondary-900 shadow-medium',
        'dark:bg-secondary-900 dark:text-secondary-100'
      ),
      interactive: cn(
        'bg-white border-secondary-200 text-secondary-900 shadow-sm cursor-pointer',
        'hover:shadow-medium hover:border-primary-300 hover:-translate-y-1',
        'active:translate-y-0 active:shadow-sm',
        'focus-visible:ring-primary-500',
        'dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-100',
        'dark:hover:border-primary-600'
      ),
      success: cn(
        'bg-success-50 border-success-200 text-success-900',
        'dark:bg-success-900/20 dark:border-success-800 dark:text-success-100'
      ),
      warning: cn(
        'bg-warning-50 border-warning-200 text-warning-900',
        'dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-100'
      ),
      danger: cn(
        'bg-danger-50 border-danger-200 text-danger-900',
        'dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-100'
      ),
      info: cn(
        'bg-info-50 border-info-200 text-info-900',
        'dark:bg-info-900/20 dark:border-info-800 dark:text-info-100'
      ),
      'saudi-green': cn(
        'bg-saudi-green-50 border-saudi-green-200 text-saudi-green-900',
        'dark:bg-saudi-green-900/20 dark:border-saudi-green-800 dark:text-saudi-green-100'
      ),
      'saudi-gold': cn(
        'bg-saudi-gold-50 border-saudi-gold-200 text-saudi-gold-900',
        'dark:bg-saudi-gold-900/20 dark:border-saudi-gold-800 dark:text-saudi-gold-100'
      ),
    };

    const sizes = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const interactiveClasses = cn(
      (hoverable || clickable || onClick) && !disabled && [
        'cursor-pointer transition-transform duration-200',
        'hover:shadow-medium hover:-translate-y-0.5',
        'active:translate-y-0 active:shadow-sm',
      ]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((clickable || onClick) && !disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onClick?.(e as any)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          interactiveClasses,
          className
        )}
        onClick={!disabled ? onClick : undefined}
        onKeyDown={handleKeyDown}
        role={clickable || onClick ? 'button' : undefined}
        tabIndex={clickable || onClick ? 0 : undefined}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'p-4 pb-2',
      md: 'p-6 pb-3',
      lg: 'p-8 pb-4',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, size = 'md', as: Component = 'h3', ...props }, ref) => {
    const sizes = {
      sm: 'text-lg font-semibold',
      md: 'text-xl font-semibold',
      lg: 'text-2xl font-semibold',
      xl: 'text-3xl font-bold',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          'leading-none tracking-tight',
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'md' | 'lg';
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    return (
      <p
        ref={ref}
        className={cn(
          'text-secondary-600 dark:text-secondary-400',
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
CardDescription.displayName = "CardDescription"

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'p-4 pt-0',
      md: 'p-6 pt-0',
      lg: 'p-8 pt-0',
    };

    return (
      <div 
        ref={ref} 
        className={cn(sizes[size], className)} 
        {...props} 
      />
    )
  }
)
CardContent.displayName = "CardContent"

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'p-4 pt-0',
      md: 'p-6 pt-0',
      lg: 'p-8 pt-0',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
CardFooter.displayName = "CardFooter"

// Loading Card Component
interface LoadingCardProps {
  variant?: CardProps['variant'];
  size?: CardProps['size'];
  className?: string;
}

const LoadingCard = React.forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ variant = 'default', size = 'md', className }, ref) => (
    <Card 
      ref={ref}
      variant={variant} 
      size={size} 
      loading 
      className={className}
    >
      <CardHeader size={size}>
        <div className="h-6 bg-secondary-200 rounded animate-pulse dark:bg-secondary-700" />
        <div className="h-4 bg-secondary-200 rounded w-3/4 animate-pulse dark:bg-secondary-700" />
      </CardHeader>
      <CardContent size={size}>
        <div className="space-y-3">
          <div className="h-4 bg-secondary-200 rounded animate-pulse dark:bg-secondary-700" />
          <div className="h-4 bg-secondary-200 rounded w-5/6 animate-pulse dark:bg-secondary-700" />
          <div className="h-4 bg-secondary-200 rounded w-4/6 animate-pulse dark:bg-secondary-700" />
        </div>
      </CardContent>
    </Card>
  )
)
LoadingCard.displayName = "LoadingCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  LoadingCard
}