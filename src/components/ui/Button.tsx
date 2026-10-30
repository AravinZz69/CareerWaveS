import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'coral' | 'soft-purple';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#6C3CE1]/30';

    const variants = {
      primary: 'bg-[#6C3CE1] hover:bg-[#5B2FD1] text-white shadow-sm hover:shadow-md hover:shadow-[#6C3CE1]/25',
      secondary: 'bg-[#F4F0FF] hover:bg-[#EAE2FD] text-[#6C3CE1] font-semibold border border-[#E2D8FD]',
      outline: 'bg-white hover:bg-[#F4F0FF] text-[#6C3CE1] border border-[#6C3CE1] hover:border-[#5B2FD1]',
      ghost: 'bg-transparent hover:bg-[#F4F0FF] text-slate-700 hover:text-[#6C3CE1]',
      coral: 'bg-[#FF5B79] hover:bg-[#E84A68] text-white shadow-sm hover:shadow-md hover:shadow-[#FF5B79]/25',
      'soft-purple': 'bg-[#F8F6FE] text-[#6C3CE1] hover:bg-[#F1ECFE]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2.5 gap-2 h-10',
      lg: 'text-base px-6 py-3.5 gap-2.5 h-12 rounded-2xl',
      icon: 'h-10 w-10 p-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
