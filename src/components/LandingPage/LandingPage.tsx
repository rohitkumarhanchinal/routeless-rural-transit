import React from 'react';
import { useTransport } from '../../context/TransportContext';
import {
  Bus,
  ShieldCheck,
  Zap,
  MapPin,
  Users,
  AlertTriangle,
  BarChart3,
  Bot,
  ArrowRight,
  Sparkles,
  Globe,
  Wifi,
  CheckCircle,
} from 'lucide-react';

export const LandingPage: React.FC<{ onExplore: (role: string) => void }> = ({ onExplore }) => {
  const { t, language } = useTransport();

  return (
    <div className="space-y-16 py-8 px-4 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-6 sm:pt-12 relative">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>AI-POWERED INTELLIGENT RURAL TRANSPORTATION NETWORK</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          When a Bus Fails, <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-cyan-300 to-indigo-300">
            No Rural Student is Left Stranded.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t.app_name} connects rural students, state government bus operators, educational institutions,
          and verified local feeders into a resilient, self-healing transit grid.
        </p>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onExplore('student')}
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-2"
          >
            <span>Launch Student Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onExplore('simulator')}
            className="px-6 py-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center space-x-2 border border-rose-400/30"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Bus Breakdown (Live)</span>
          </button>
          <button
            onClick={() => onExplore('operator')}
            className="px-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-700 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center space-x-2"
          >
            <Bus className="w-4 h-4 text-cyan-400" />
            <span>Transit Operator Dashboard</span>
          </button>
        </div>
      </div>

      {/* Key Innovation Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-brand-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4 border border-brand-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">1. Intelligent Seat Allocation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-factor scoring algorithm factors in origin village, destination college, arrival buffer, and student priority tiers (final exam & female safety quotas). Strictly eliminates overbooking.
          </p>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-rose-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">2. Self-Healing Reallocation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Instantaneous failover when buses break down or roads flood. Orphaned students are dynamically cascaded into neighboring passing government buses and verified Panchayat feeders.
          </p>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">3. Dijkstra Route Optimizer</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Weighted graph routing accounts for flooded culverts, road degradation, and bypass detours. Calculates exact travel overheads and nearby pickup waypoints.
          </p>
        </div>
      </div>

      {/* Product Modules Showcase Cards */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">Full-Spectrum Mobility Modules</h2>
          <p className="text-xs text-slate-500 mt-1">Integrated platform for all rural transportation stakeholders</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => onExplore('student')}
            className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-brand-500 cursor-pointer transition shadow group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Module A: Student Portal</span>
              <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Digital transit passes, live seat checks, waitlist transparent tracking, and instant ride requests.
            </p>
          </div>

          <div
            onClick={() => onExplore('operator')}
            className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-brand-500 cursor-pointer transition shadow group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Module B: Operator Dashboard</span>
              <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Fleet management, capacity adjustments, driver dispatch, and auxiliary bus deployment.
            </p>
          </div>

          <div
            onClick={() => onExplore('routes')}
            className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-brand-500 cursor-pointer transition shadow group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Module D: Route Optimizer</span>
              <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Interactive weighted graph visualization, obstacle bypass computing, and detour statistics.
            </p>
          </div>

          <div
            onClick={() => onExplore('simulator')}
            className="p-5 rounded-2xl bg-slate-50/90 border border-rose-500/30 hover:border-rose-400 cursor-pointer transition shadow group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-300 text-sm">Module E: Disruption Simulator</span>
              <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Signature demo: Trigger bus breakdowns, road closures, and surges to see instant AI re-allocations.
            </p>
          </div>

          <div
            onClick={() => onExplore('analytics')}
            className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-brand-500 cursor-pointer transition shadow group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Module F: Demand Analytics</span>
              <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Transparent ridership forecasting using weighted historical moving averages and stress indices.
            </p>
          </div>

          <div
            onClick={() => onExplore('assistant')}
            className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-brand-500 cursor-pointer transition shadow group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Module G: AI Mobility Assistant</span>
              <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Context-aware decision support answering student queries and recommending operator actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
