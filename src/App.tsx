import React from 'react';
import { TransportProvider, useTransport } from './context/TransportContext';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { OperatorDashboard } from './components/OperatorDashboard/OperatorDashboard';
import { RouteVisualizer } from './components/RouteVisualizer/RouteVisualizer';
import { DisruptionSimulator } from './components/DisruptionSimulator/DisruptionSimulator';
import { DemandAnalytics } from './components/Analytics/DemandAnalytics';
import { MobilityAssistant } from './components/AIAssistant/MobilityAssistant';
import { LandingPage } from './components/LandingPage/LandingPage';
import { Bus, ShieldCheck, Heart, Sparkles, Globe } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeRole, setActiveRole, t } = useTransport();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Sticky Header */}
      <Navbar />

      {/* Main Dynamic View */}
      <main className="flex-1 pb-16">
        {activeRole === 'landing' && <LandingPage onExplore={(role) => setActiveRole(role)} />}
        {activeRole === 'student' && <StudentDashboard />}
        {activeRole === 'operator' && <OperatorDashboard />}
        {activeRole === 'routes' && <RouteVisualizer />}
        {activeRole === 'simulator' && <DisruptionSimulator />}
        {activeRole === 'analytics' && <DemandAnalytics />}
        {activeRole === 'assistant' && <MobilityAssistant />}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/80 text-xs text-slate-400 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start space-x-2 font-bold text-slate-200">
              <Bus className="w-4 h-4 text-brand-400" />
              <span>{t.app_name} – The Last Mile</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              AI-Powered Intelligent Rural Transportation Network • Raybag / Chikkodi / Hukkeri Taluk Grid
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <button onClick={() => setActiveRole('student')} className="hover:text-white transition">
              Student Portal
            </button>
            <button onClick={() => setActiveRole('operator')} className="hover:text-white transition">
              Operator Hub
            </button>
            <button onClick={() => setActiveRole('routes')} className="hover:text-white transition">
              Dijkstra Router
            </button>
            <button onClick={() => setActiveRole('simulator')} className="hover:text-rose-400 font-bold transition text-rose-300">
              Disruption Lab
            </button>
            <button onClick={() => setActiveRole('analytics')} className="hover:text-white transition">
              Demand Forecasting
            </button>
            <button onClick={() => setActiveRole('assistant')} className="hover:text-white transition">
              AI Assistant
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TransportProvider>
      <AppContent />
    </TransportProvider>
  );
};

export default App;
