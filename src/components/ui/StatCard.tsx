import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'navy' | 'blue' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

const colorMap = {
  navy: { bg: 'bg-[#142B4F]', icon: 'text-slate-900', iconBg: 'bg-white/20', text: 'text-slate-900', sub: 'text-slate-900/70' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', iconBg: 'bg-blue-100', text: 'text-blue-700', sub: 'text-blue-500' },
  success: { bg: 'bg-green-50', icon: 'text-green-600', iconBg: 'bg-green-100', text: 'text-green-700', sub: 'text-green-500' },
  warning: { bg: 'bg-amber-50', icon: 'text-amber-600', iconBg: 'bg-amber-100', text: 'text-amber-700', sub: 'text-amber-500' },
  danger: { bg: 'bg-red-50', icon: 'text-red-600', iconBg: 'bg-red-100', text: 'text-red-700', sub: 'text-red-500' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color = 'blue', subtitle }) => {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-xl p-5 flex items-center gap-4 shadow-sm`}>
      <div className={`${c.iconBg} rounded-lg p-3 flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium uppercase tracking-wide ${c.sub || 'text-slate-500'}`}>{label}</p>
        <p className={`text-2xl font-bold leading-tight ${c.text}`}>{value}</p>
        {subtitle && <p className={`text-xs mt-0.5 ${c.sub || 'text-slate-500'}`}>{subtitle}</p>}
      </div>
    </div>
  );
};
