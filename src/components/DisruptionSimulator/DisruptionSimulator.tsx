import React, { useState, useEffect } from 'react';
import { useTransport } from '../../context/TransportContext';
import {
  AlertTriangle,
  Zap,
  TrendingUp,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Users,
  Bus,
  RefreshCw,
  Clock,
  Sparkles,
  Play,
  Pause,
  Layers,
  ChevronRight,
  ArrowDownRight,
  ShieldCheck,
  Check,
  X,
  Flame,
} from 'lucide-react';

export const DisruptionSimulator: React.FC = () => {
  const {
    t,
    buses,
    roads,
    students,
    requests,
    alternatives,
    disruptions,
    simulateBusBreakdown,
    simulateRoadClosure,
    simulateDemandSurge,
    resetDemoData,
    latestImpactReport,
    clearImpactReport,
    setActiveRole,
  } = useTransport();

  const [selectedBusId, setSelectedBusId] = useState<string>(
    buses.find((b) => b.status === 'active')?.id || buses[0].id
  );
  const [selectedRoadId, setSelectedRoadId] = useState<string>(roads[0].id);
  const [roadClosureReason, setRoadClosureReason] = useState<string>(
    'Canal Inundation & Culvert Scour - Heavy Transit Restricted'
  );

  // Animation Stage Management for Live Breakdown Simulation
  // 'idle' -> 'siren' (0-800ms) -> 'ejection' (800-1800ms) -> 'reallocating' (1800-2800ms) -> 'complete'
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'siren' | 'ejection' | 'reallocating' | 'complete'>('idle');
  const [animatedStudentIndex, setAnimatedStudentIndex] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'reassigned' | 'waitlisted'>('all');

  const targetBus = buses.find((b) => b.id === selectedBusId) || buses[0];
  const affectedStudents = students.filter((s) => s.assignedBusId === selectedBusId);

  const handleStartAnimatedBreakdown = () => {
    // Phase 1: Alarm & Hazard Flash
    setAnimationPhase('siren');
    setAnimatedStudentIndex(0);

    setTimeout(() => {
      // Phase 2: Manifest Ejection
      setAnimationPhase('ejection');

      setTimeout(() => {
        // Phase 3: AI Reallocation Cascade & Audio-Visual Handshake
        setAnimationPhase('reallocating');

        // Actually execute real mutation in application state!
        simulateBusBreakdown(selectedBusId);

        setTimeout(() => {
          // Phase 4: Final Stabilized Manifest
          setAnimationPhase('complete');
        }, 1200);
      }, 1000);
    }, 800);
  };

  // Re-play animation if report exists
  const handleReplayAnimation = () => {
    setAnimationPhase('reallocating');
    setTimeout(() => {
      setAnimationPhase('complete');
    }, 1000);
  };

  // Filter reassigned details
  const filteredReassignedDetails = (latestImpactReport?.reassignedDetails || []).filter((item) => {
    if (activeFilter === 'reassigned') return item.status.includes('Reassigned') || item.status.includes('Alternative');
    if (activeFilter === 'waitlisted') return item.status.includes('Waitlist');
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner: Enterprise Disruption Operations Console */}
      <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/40 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-2" />
                SIGNATURE DEMONSTRATION FEATURE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-mono">
                MIL-SPEC TRANSIT RESILIENCE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center">
              <ShieldAlert className="w-8 h-8 mr-3 text-rose-400" />
              {t.disruption_lab}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Stress-test the rural grid with real-world failure modes. Inject mechanical breakdowns, flooded bridge washouts, and examination surges.
              Observe the AI Reallocation Engine orchestrate instant zero-abandonment student recovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={resetDemoData}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-50/90 hover:bg-slate-700 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-md"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>{t.reset_demo}</span>
            </button>
            <button
              onClick={() => setActiveRole('routes')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition"
            >
              <Layers className="w-4 h-4" />
              <span>Inspect Dijkstra Detour</span>
            </button>
          </div>
        </div>
      </div>

      {/* Disruption Control Center Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scenario 1: Bus Breakdown */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-rose-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                <Bus className="w-5 h-5 text-rose-400" />
                <span>1. Bus Breakdown Simulation</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-bold border border-rose-500/20">
                ACTIVE FAILOVER
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Forces targeted mechanical failure on a scheduled transit vehicle. Displaces all assigned passengers and activates the 6-pillar multi-tier cascading reallocation.
            </p>

            <div className="space-y-2 mb-5">
              <label className="block text-[11px] font-semibold text-slate-600">Target Public Bus:</label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500 font-medium"
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber} • {b.occupiedSeats}/{b.totalCapacity} Booked ({b.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleStartAnimatedBreakdown}
            disabled={animationPhase === 'siren' || animationPhase === 'ejection' || animationPhase === 'reallocating'}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-slate-900 rounded-xl font-black text-xs shadow-xl shadow-rose-600/30 transition flex items-center justify-center space-x-2 uppercase tracking-wider"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{animationPhase === 'idle' || animationPhase === 'complete' ? 'SIMULATE BUS BREAKDOWN' : 'EXECUTING FAILOVER...'}</span>
          </button>
        </div>

        {/* Scenario 2: Road Closure */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>2. Road Closure Simulation</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                GRAPH RE-ROUTE
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Simulates washed-out culverts or bridge scour. Triggers Dijkstra shortest-path calculations to discover alternate bypass corridors and notify student stops.
            </p>

            <div className="space-y-2 mb-5">
              <label className="block text-[11px] font-semibold text-slate-600">Target Road Corridor:</label>
              <select
                value={selectedRoadId}
                onChange={(e) => setSelectedRoadId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 font-medium"
              >
                {roads.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.distanceKm} km - {r.isDisrupted ? 'CLOSED' : 'OPEN'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => simulateRoadClosure(selectedRoadId, roadClosureReason)}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 rounded-xl font-black text-xs shadow-xl shadow-amber-600/30 transition flex items-center justify-center space-x-2 uppercase tracking-wider"
          >
            <Zap className="w-4 h-4" />
            <span>SIMULATE ROAD CLOSURE</span>
          </button>
        </div>

        {/* Scenario 3: Sudden Demand Surge */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-cyan-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>3. Morning Exam Demand Surge</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                CAPACITY STRESS
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Injects sudden +8 to +10 student commuters taking morning examinations from isolated rural areas. Tests fleet headroom, anti-overbooking gates, and waitlist prioritization.
            </p>

            <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-600 mb-5 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Active Fleet Capacity:</span>
                <strong className="text-slate-900">
                  {buses.reduce((acc, b) => acc + (b.status === 'active' ? b.totalCapacity : 0), 0)} Seats
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available Headroom:</span>
                <strong className="text-emerald-400">
                  {buses.reduce((acc, b) => acc + (b.status === 'active' ? b.totalCapacity - b.occupiedSeats : 0), 0)} Seats Free
                </strong>
              </div>
            </div>
          </div>

          <button
            onClick={simulateDemandSurge}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-900 rounded-xl font-black text-xs shadow-xl shadow-cyan-600/30 transition flex items-center justify-center space-x-2 uppercase tracking-wider"
          >
            <TrendingUp className="w-4 h-4" />
            <span>TRIGGER DEMAND SURGE (+8)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ANIMATED TRANSITION VISUALIZER (When Breakdown is Activated)              */}
      {/* ========================================================================= */}
      {(animationPhase !== 'idle' || latestImpactReport) && (
        <div className="bg-white border-2 border-brand-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-slate-900 shadow-lg shadow-brand-500/30">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Dynamic Reallocation & Failover Transition
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    REAL-TIME REBALANCING
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual trace of the 6-pillar allocation engine redistributing displaced rural students.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleReplayAnimation}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-700 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 border border-slate-200 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Replay Animation</span>
              </button>
              <button
                onClick={clearImpactReport}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-700 text-slate-500 hover:text-slate-900 border border-slate-200"
                title="Dismiss Report"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Animated 3-Stage Progress HUD */}
          <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stage 1: Incident Trigger */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-500 ${
                animationPhase === 'siren'
                  ? 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-500/30 scale-102'
                  : 'bg-slate-50/80 border-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-rose-400 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5 animate-bounce" />
                  Stage 1: Vehicle Incident
                </span>
                <span className="text-[10px] font-mono text-slate-500">t + 0.0s</span>
              </div>
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{targetBus.busNumber} Failure Reported</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Status shifted to BREAKDOWN. Capacity zeroed.</p>
            </div>

            {/* Stage 2: Manifest Priority Ejection */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-500 ${
                animationPhase === 'ejection' || animationPhase === 'reallocating'
                  ? 'bg-amber-950/70 border-amber-500 shadow-lg shadow-amber-500/30 scale-102'
                  : 'bg-slate-50/80 border-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-amber-400 flex items-center">
                  <Users className="w-4 h-4 mr-1.5" />
                  Stage 2: Priority Arbitration
                </span>
                <span className="text-[10px] font-mono text-slate-500">t + 0.8s</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Displaced Passengers Extracted</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Exam (+35) & Safety (+20) quotas prioritized.</p>
            </div>

            {/* Stage 3: Failover Complete */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-500 ${
                animationPhase === 'complete' || latestImpactReport
                  ? 'bg-emerald-950/70 border-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-50/80 border-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-emerald-400 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Stage 3: Multi-Tier Reassignment
                </span>
                <span className="text-[10px] font-mono text-slate-500">t + 1.8s</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Grid Re-Stabilized</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Buses & Alternative Feeders Absorbed Commuters.</p>
            </div>
          </div>

          {/* Live Dynamic Reallocation Impact Cards */}
          {latestImpactReport && (
            <div className="space-y-6">
              {/* High-Level Recovery Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block">Total Displaced</span>
                  <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
                    {latestImpactReport.affectedStudentCount}
                  </p>
                  <span className="text-[10px] text-slate-500">From {targetBus.busNumber}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block">Safely Reassigned</span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                    {latestImpactReport.successfullyReassignedCount}
                  </p>
                  <span className="text-[10px] text-emerald-500 font-semibold">100% On-Time Target</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block">Capacity Waitlisted</span>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                    {latestImpactReport.waitlistedCount}
                  </p>
                  <span className="text-[10px] text-amber-500 font-semibold">Zero Overbooking Rule</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block">Alternative Feeders</span>
                  <p className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
                    {latestImpactReport.reassignedDetails.filter((d) => d.status.includes('Alternative')).length}
                  </p>
                  <span className="text-[10px] text-cyan-400 font-semibold">Panchayat & MaxiCab Fleet</span>
                </div>
              </div>

              {/* System Impact Summary Banner */}
              <div className="p-4 rounded-2xl bg-brand-950/40 border border-brand-500/40 text-xs text-brand-200 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-brand-300">Automated Self-Healing Guarantee: </strong>
                  {latestImpactReport.capacityDeltaSummary} All displaced rural students received emergency priority boosts, routing to passing KSRTC mini-buses and verified Gram Panchayat feeders.
                </div>
              </div>

              {/* Side-by-Side Visual Before & After Allocation Tracing */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2 text-cyan-400" />
                      Before & After Reallocation Manifest Trace
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Step-by-step passenger routing comparing original vehicle against AI failover assignment.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        activeFilter === 'all' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({latestImpactReport.reassignedDetails.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('reassigned')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        activeFilter === 'reassigned' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Reassigned ({latestImpactReport.successfullyReassignedCount})
                    </button>
                    <button
                      onClick={() => setActiveFilter('waitlisted')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        activeFilter === 'waitlisted' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Waitlist ({latestImpactReport.waitlistedCount})
                    </button>
                  </div>
                </div>

                {/* Animated Reallocation Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredReassignedDetails.map((item, idx) => {
                    const isReassigned = item.status.includes('Reassigned') || item.status.includes('Alternative');
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                          isReassigned
                            ? 'bg-slate-50/90 border-slate-200/80 hover:border-emerald-500/50'
                            : 'bg-slate-50/90 border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">
                              {item.studentName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                                item.status.includes('Alternative')
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : isReassigned
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 border border-slate-200">
                            {idx + 1}
                          </div>
                        </div>

                        {/* Visual Transfer Pipeline */}
                        <div className="mt-3 p-3 rounded-xl bg-white/90 border border-slate-200/60 text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span>Previous Booking:</span>
                            <span className="text-rose-400 font-mono line-through font-semibold">
                              {item.fromVehicle}
                            </span>
                          </div>

                          <div className="flex items-center justify-center my-1 text-slate-500">
                            <ArrowDownRight className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span className="text-[10px] text-cyan-400 font-mono ml-1">AI Reallocation Bridge</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600 text-[11px]">
                            <span>New Assignment:</span>
                            <span className="text-emerald-400 font-bold font-mono">
                              {item.toVehicle}
                            </span>
                          </div>
                        </div>

                        {/* Rationale String */}
                        <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed">
                          {item.reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Persistent Incident History Stream */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-slate-500" />
            Network Disruption & Incident Stream ({disruptions.length})
          </h2>
          <span className="text-xs text-slate-500">Auto-archived audit log</span>
        </div>

        <div className="space-y-3">
          {disruptions.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl bg-white/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">{d.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                      d.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {d.severity}
                  </span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">{d.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>Logged: {new Date(d.timestamp).toLocaleTimeString()}</span>
                  <span>Impacted: <strong className="text-slate-600">{d.affectedStudentIds.length} Students</strong></span>
                  <span>Recovered: <strong className="text-emerald-400">{d.reassignedStudentIds.length} Reassigned</strong></span>
                </div>
              </div>

              <button
                onClick={() => setActiveRole('operator')}
                className="self-start sm:self-center px-3.5 py-2 bg-slate-50 hover:bg-slate-700 text-slate-700 rounded-xl text-xs font-semibold whitespace-nowrap transition border border-slate-200"
              >
                Inspect Telemetry ➔
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
