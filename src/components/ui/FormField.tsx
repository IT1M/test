import React from 'react';
import { cn } from '@/utils/cn';
import { Input, InputProps } from './Input';
import { Label } from './label';

export interface FormFieldProps extends Omit<InputProps, 'label'> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  optional?: boolean;
  layout?: 'vertical' | 'horizontal';
  labelWidth?: string;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    name,
    label,
    description,
    required = false,
    optional = false,
    layout = 'vertical',
    labelWidth = 'w-32',
    containerClassName,
    error,
    success,
    className,
    ...inputProps
  }, ref) => {
    const fieldId = `field-${name}`;
    const descriptionId = description ? `${fieldId}-description` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    const labelVariant = error ? 'danger' : success ? 'success' : 'default';

    if (layout === 'horizontal') {
      return (
        <div className={cn('flex items-start space-x-4 rtl:space-x-reverse', containerClassName)}>
          {label && (
            <div className={cn('flex-shrink-0 pt-2', labelWidth)}>
              <Label
                htmlFor={fieldId}
                variant={labelVariant}
                required={required}
                optional={optional}
              >
                {label}
              </Label>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Input
              ref={ref}
              id={fieldId}
              name={name}
              error={error}
              success={success}
              className={className}
              aria-describedby={cn(
                descriptionId && descriptionId,
                errorId && errorId
              )}
              {...inputProps}
            />
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-secondary-500 dark:text-secondary-400"
              >
                {description}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label
            htmlFor={fieldId}
            variant={labelVariant}
            required={required}
            optional={optional}
          >
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          id={fieldId}
          name={name}
          error={error}
          success={success}
          className={className}
          aria-describedby={cn(
            descriptionId && descriptionId,
            errorId && errorId
          )}
          {...inputProps}
        />
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-secondary-500 dark:text-secondary-400"
          >
            {description}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// Form Group Component for organizing multiple fields
export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({
    title,
    description,
    layout = 'vertical',
    columns = 1,
    gap = 'md',
    className,
    children,
    ...props
  }, ref) => {
    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    };

    const layoutClasses = {
      vertical: 'flex flex-col',
      horizontal: 'flex flex-wrap',
      grid: cn(
        'grid',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      ),
    };

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {description}
              </p>
            )}
          </div>
        )}
        <div className={cn(layoutClasses[layout], gapClasses[gap])}>
          {children}
        </div>
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

// Form Container Component
export interface FormContainerProps extends React.FormHTMLAttributes<HTMLFormElement> {
  loading?: boolean;
  disabled?: boolean;
}

export const FormContainer = React.forwardRef<HTMLFormElement, FormContainerProps>(
  ({ loading = false, disabled = false, className, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(
          'space-y-6',
          (loading || disabled) && 'pointer-events-none opacity-60',
          className
        )}
        {...props}
      >
        {children}
      </form>
    );
  }
);

FormContainer.displayName = 'FormContainer';