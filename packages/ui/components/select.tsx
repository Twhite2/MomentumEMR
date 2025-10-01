import * as React from 'react';
import { cn } from '../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-foreground">
            {label}
            {props.required && <span className="text-red-ribbon ml-1">*</span>}
          </label>
        )}
        <select
          className={cn(
            'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-tory-blue focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-ribbon focus:ring-red-ribbon',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-ribbon mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
