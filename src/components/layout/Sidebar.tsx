import React, { useState } from 'react';
import { useTransport } from '../../context/TransportContext';
import {
  Bus,
  LayoutDashboard,
  GraduationCap,
  Settings2,
  MapPin,
  ClipboardList,
  Route,
  BarChart3,
  Bot,
  Zap,
  RotateCcw,
  Globe,
  WifiOff,
  Wifi,
  Bell,
  X,
  Menu,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'student', label: 'Student Portal', icon: GraduationCap },
  { id: 'operator', label: 'Operator Dashboard', icon: Settings2 },
  { id: 'routes', label: 'Bus Routes', icon: MapPin },
  { id: 'requests', label: 'Transport Requests', icon: ClipboardList },
  { id: 'simulator', label: 'Breakdown Simulator', icon: Zap, alert: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const {
    activeRole,
    setActiveRole,
    t,
    language,
    setLanguage,
    isRuralLite,
    toggleRuralLite,
    resetDemoData,
    notifications,
    dismissNotification,
    buses,
    students,
  } = useTransport();

  const [showNotif, setShowNotif] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const activeBuses = buses.filter((b) => b.status === 'active').length;
  const allocatedStudents = students.filter((s) => s.status === 'confirmed' || s.status === 'reassigned').length;

  const handleNav = (id: string) => {
    setActiveRole(id);
    onMobileClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#142B4F] text-slate-900 w-64 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center flex-shrink-0">
          <Bus className="w-5 h-5 text-slate-900" />
        </div>
        <div className="min-w-0">
          <div className="font-black text-lg tracking-tight leading-none">Ruralride</div>
          <div className="text-[10px] text-slate-900/50 font-medium mt-0.5">The Last Mile</div>
        </div>
      </div>

      {/* Live Stats Strip */}
      <div className="flex gap-2 px-4 py-3 border-b border-white/10">
        <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-slate-900">{activeBuses}</div>
          <div className="text-[10px] text-slate-900/50">Buses</div>
        </div>
        <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-slate-900">{allocatedStudents}</div>
          <div className="text-[10px] text-slate-900/50">Allocated</div>
        </div>
        <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-center">
          <div className="text-lg font-bold text-[#2563EB]">{unread}</div>
          <div className="text-[10px] text-slate-900/50">Alerts</div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRole === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-[#2563EB] text-slate-900 shadow-lg shadow-blue-900/40'
                  : item.alert
                  ? 'text-amber-300 hover:bg-amber-500/10'
                  : 'text-slate-900/70 hover:bg-white/8 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-900' : item.alert ? 'text-amber-400' : 'text-slate-900/50 group-hover:text-slate-900'}`} />
              <span className="truncate">{item.label}</span>
              {item.alert && !isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
              {isActive && <ChevronRight className="ml-auto w-3 h-3 text-slate-900/60" />}
            </button>
          );
        })}
      </nav>

      {/* Notifications panel */}
      {showNotif && (
        <div className="mx-3 mb-2 bg-[#1a3561] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-xs font-semibold text-slate-900">Alerts ({notifications.length})</span>
            <button onClick={() => setShowNotif(false)} className="text-slate-900/50 hover:text-slate-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-3 text-xs text-slate-900/40 text-center">No alerts</p>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="px-3 py-2 border-b border-white/5 hover:bg-white/5 transition">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-900/90 leading-tight">{n.title}</span>
                    <button onClick={() => dismissNotification(n.id)} className="text-slate-900/30 hover:text-slate-900 mt-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-900/50 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1.5">
        {/* Notifications toggle */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-900/70 hover:bg-white/8 hover:text-slate-900 transition relative"
        >
          <Bell className="w-4 h-4 flex-shrink-0 text-slate-900/50" />
          <span>Notifications</span>
          {unread > 0 && (
            <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-900/70 hover:bg-white/8 hover:text-slate-900 transition"
        >
          <Globe className="w-4 h-4 flex-shrink-0 text-slate-900/50" />
          <span>{language === 'en' ? 'Switch to ಕನ್ನಡ' : 'Switch to English'}</span>
        </button>

        {/* Rural Lite Toggle */}
        <button
          onClick={toggleRuralLite}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
            isRuralLite ? 'text-amber-300 bg-amber-500/10' : 'text-white/70 hover:bg-white/8 hover:text-white'
          }`}
        >
          {isRuralLite ? <WifiOff className="w-4 h-4 flex-shrink-0 text-amber-400" /> : <Wifi className="w-4 h-4 flex-shrink-0 text-slate-900/50" />}
          <span>{isRuralLite ? 'Rural Lite ON' : 'Rural Lite Mode'}</span>
        </button>

        {/* Reset Demo */}
        <button
          onClick={() => {
            if (window.confirm('Reset all demo data to benchmark scenario?')) resetDemoData();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-300/80 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          <RotateCcw className="w-4 h-4 flex-shrink-0" />
          <span>Reset Demo</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={onMobileClose} />
          <div className="relative flex-shrink-0">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

/* Mobile Top Bar */
export const MobileTopBar: React.FC<{ onMenuOpen: () => void }> = ({ onMenuOpen }) => {
  const { activeRole, notifications } = useTransport();
  const unread = notifications.filter((n) => !n.read).length;

  const currentItem = navItems.find((i) => i.id === activeRole);

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14 shadow-sm">
      <button
        onClick={onMenuOpen}
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-[#142B4F] rounded-lg flex items-center justify-center">
          <Bus className="w-4 h-4 text-slate-900" />
        </div>
        <span className="font-bold text-[#142B4F] text-sm">
          {currentItem?.label || 'Ruralride'}
        </span>
      </div>
      <div className="relative">
        {unread > 0 && (
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </div>
    </div>
  );
};
