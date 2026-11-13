import React from 'react';

type BadgeVariant = 'confirmed' | 'waitlisted' | 'pending' | 'reassigned' | 'active' | 'breakdown' | 'disrupted' | 'available' | 'full';

const variantMap: Record<BadgeVariant, string> = {
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  waitlisted: 'bg-amber-100 text-amber-700 border-amber-200',
  pending: 'bg-blue-100 text-blue-700 border-blue-200',
  reassigned: 'bg-purple-100 text-purple-700 border-purple-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  breakdown: 'bg-red-100 text-red-700 border-red-200',
  disrupted: 'bg-red-100 text-red-700 border-red-200',
  available: 'bg-green-100 text-green-700 border-green-200',
  full: 'bg-slate-100 text-slate-600 border-slate-200',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, dot = false }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantMap[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'confirmed' || variant === 'active' || variant === 'available' ? 'bg-green-500' : variant === 'breakdown' || variant === 'disrupted' ? 'bg-red-500' : variant === 'waitlisted' ? 'bg-amber-500' : 'bg-blue-500'}`} />}
      {children}
    </span>
  );
};
