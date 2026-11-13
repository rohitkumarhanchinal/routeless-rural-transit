import React, { useState } from 'react';
import { useTransport } from '../context/TransportContext';
import {
  Bus,
  MapPin,
  AlertTriangle,
  BarChart3,
  Bot,
  User,
  RotateCcw,
  Wifi,
  WifiOff,
  Bell,
  Globe,
  CheckCircle2,
  X,
  Menu,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    activeRole,
    setActiveRole,
    isRuralLite,
    toggleRuralLite,
    resetDemoData,
    notifications,
    dismissNotification,
  } = useTransport();

  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'student', label: t.role_student, icon: User },
    { id: 'operator', label: t.role_operator, icon: Bus },
    { id: 'routes', label: t.role_routes, icon: MapPin },
    { id: 'simulator', label: t.role_simulator, icon: AlertTriangle, highlight: true },
    { id: 'analytics', label: t.role_analytics, icon: BarChart3 },
    { id: 'assistant', label: t.role_assistant, icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Network Status */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveRole('student')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                  {t.app_name}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  LIVE RURAL NETWORK
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Belagavi Rural Mobility Grid</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRole === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveRole(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : item.highlight
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 border border-amber-400/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Language, Lite Mode, Notifications, Reset */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              title="Toggle English / ಕನ್ನಡ"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'EN'}</span>
            </button>

            {/* Rural Lite Mode Toggle */}
            <button
              onClick={toggleRuralLite}
              title={isRuralLite ? 'Standard Graphics Mode' : 'Low-Bandwidth Rural Lite Mode'}
              className={`p-2 rounded-lg border text-xs font-medium transition flex items-center ${
                isRuralLite
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              {isRuralLite ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-slate-850">
                    <span className="text-sm font-bold text-white flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-cyan-400" />
                      Live Transit Alerts ({notifications.length})
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/60">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">No new alerts</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-750 transition text-xs">
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-slate-200">{n.title}</span>
                            <button
                              onClick={() => dismissNotification(n.id)}
                              className="text-slate-500 hover:text-slate-300 ml-2"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="mt-1 text-slate-300 leading-relaxed">{n.message}</p>
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reset Demo State Button (Required Section 5) */}
            <button
              onClick={() => {
                if (window.confirm('Reset all demo routes, buses, and student allocations to the initial benchmark scenario?')) {
                  resetDemoData();
                }
              }}
              title={t.reset_demo}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.reset_demo}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRole === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveRole(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                resetDemoData();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.reset_demo}</span>
            </button>
          </div>
        )}
      </div>

      {/* Low-Bandwidth Mode Warning Banner if active */}
      {isRuralLite && (
        <div className="bg-amber-500 text-slate-950 font-semibold text-xs px-4 py-1 flex items-center justify-between">
          <span>📡 Low-Bandwidth Rural Lite Mode Enabled: Map animations & heavy charts disabled for 2G network stability.</span>
          <button onClick={toggleRuralLite} className="underline text-slate-950 hover:text-black">Turn Off</button>
        </div>
      )}
    </header>
  );
};
