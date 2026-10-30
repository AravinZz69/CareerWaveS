import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  bordered?: boolean;
  surface?: 'white' | 'lavender' | 'glass';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, bordered = true, surface = 'white', children, ...props }, ref) => {
    const surfaceStyles = {
      white: 'bg-white',
      lavender: 'bg-[#F8F6FE]',
      glass: 'glass-card',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300',
          surfaceStyles[surface],
          bordered && 'border border-purple-100/70',
          hover ? 'shadow-soft shadow-card-hover' : 'shadow-soft',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
