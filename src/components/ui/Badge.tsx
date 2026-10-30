import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'bestseller' | 'popular' | 'trending' | 'purple' | 'green' | 'amber' | 'coral' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'purple',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full border transition-colors';

  const variants = {
    bestseller: 'bg-[#FFB547] text-slate-900 border-[#F59E0B] font-bold shadow-xs',
    popular: 'bg-[#F4F0FF] text-[#6C3CE1] border-[#E2D8FD]',
    trending: 'bg-[#FFF0F2] text-[#FF5B79] border-[#FED7DE]',
    purple: 'bg-[#F4F0FF] text-[#6C3CE1] border-[#E4D8FD]',
    green: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
    amber: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
    coral: 'bg-[#FFF0F2] text-[#E11D48] border-[#FECDD3]',
    outline: 'bg-white text-slate-700 border-slate-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 tracking-wide',
    md: 'text-xs px-3 py-1 tracking-wide',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
