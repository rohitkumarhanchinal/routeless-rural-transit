import React, { useState } from 'react';
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
    'Heavy Monsoon Canal Inundation & Culvert Scour'
  );

  const activeBuses = buses.filter((b) => b.status === 'active');
  const brokenBuses = buses.filter((b) => b.status === 'breakdown');

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Title & Badge */}
      <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-extrabold uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-1.5" />
                SIGNATURE DEMONSTRATION FEATURE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-2 flex items-center">
              <ShieldAlert className="w-7 h-7 mr-2.5 text-rose-400" />
              {t.disruption_lab}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Test resilience under extreme rural transport bottlenecks. Inject bus breakdowns, road severed bridges, and exam surges.
              The AI Reallocation Engine responds dynamically to keep rural students moving.
            </p>
          </div>

          <button
            onClick={resetDemoData}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Restore Benchmark Scenario</span>
          </button>
        </div>
      </div>

      {/* Disruption Control Center Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scenario 1: Bus Breakdown */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm mb-2">
              <Bus className="w-5 h-5" />
              <span>1. Bus Breakdown Simulation</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Marks selected government bus unavailable, extracts passenger manifest, evaluates other fleet headroom, and reassigns or waitlists students by exam priority.
            </p>

            <div className="space-y-2 mb-4">
              <label className="block text-[11px] font-semibold text-slate-300">Target Government Bus:</label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber} ({b.operatorName}) - {b.occupiedSeats}/{b.totalCapacity} Booked ({b.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => simulateBusBreakdown(selectedBusId)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>SIMULATE BUS BREAKDOWN</span>
          </button>
        </div>

        {/* Scenario 2: Road Closure Simulation */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm mb-2">
              <Zap className="w-5 h-5" />
              <span>2. Road Closure Simulation</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Simulates washed out culverts or landslides. Dijkstra shortest path algorithm instantly computes graph detour times and shifts bus schedules.
            </p>

            <div className="space-y-2 mb-4">
              <label className="block text-[11px] font-semibold text-slate-300">Target Road Segment:</label>
              <select
                value={selectedRoadId}
                onChange={(e) => setSelectedRoadId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                {roads.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.distanceKm} km, {r.isDisrupted ? 'CURRENTLY BLOCKED' : 'CLEAR'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => simulateRoadClosure(selectedRoadId, roadClosureReason)}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-amber-600/30 transition flex items-center justify-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>SIMULATE ROAD CLOSURE</span>
          </button>
        </div>

        {/* Scenario 3: Sudden Student Demand Surge */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm mb-2">
              <TrendingUp className="w-5 h-5" />
              <span>3. Student Demand Surge (+8)</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Generates a sudden rush of rural student commuters traveling for exam sessions. Tests how seat reservation headroom handles peak stress.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300 mb-4 space-y-1">
              <div className="flex justify-between">
                <span>Total Active Seats:</span>
                <strong className="text-white">
                  {buses.reduce((acc, b) => acc + (b.status === 'active' ? b.totalCapacity : 0), 0)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Free Open Seats:</span>
                <strong className="text-emerald-400">
                  {buses.reduce((acc, b) => acc + (b.status === 'active' ? b.totalCapacity - b.occupiedSeats : 0), 0)}
                </strong>
              </div>
            </div>
          </div>

          <button
            onClick={simulateDemandSurge}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center justify-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>TRIGGER EXAM DEMAND SURGE</span>
          </button>
        </div>
      </div>

      {/* Disruption Impact & Reallocation Report (Side-by-Side Before & After) */}
      {latestImpactReport && (
        <div className="bg-slate-800/95 border-2 border-brand-500/50 rounded-2xl p-6 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-6 h-6 text-brand-400 animate-spin" style={{ animationDuration: '6s' }} />
              <div>
                <h2 className="text-base font-extrabold text-white">
                  Disruption Impact & AI Reallocation Report
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated rebalancing results comparing passenger manifest before and after disruption.
                </p>
              </div>
            </div>
            <button
              onClick={clearImpactReport}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Dismiss Report
            </button>
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Displaced</span>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {latestImpactReport.affectedStudentCount} Students
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Safely Reassigned</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {latestImpactReport.successfullyReassignedCount} Students
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Waitlisted (Capacity Limit)</span>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {latestImpactReport.waitlistedCount} Students
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 text-xs text-brand-200">
            <strong>System Impact Summary: </strong> {latestImpactReport.capacityDeltaSummary}
          </div>

          {/* Student-By-Student Reallocation Audit Table */}
          <div className="mt-5 overflow-x-auto">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Passenger Manifest Reallocation Trace
            </h3>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5">Student</th>
                  <th className="p-2.5">Previous Vehicle</th>
                  <th className="p-2.5">Reassigned Vehicle</th>
                  <th className="p-2.5">Action Status</th>
                  <th className="p-2.5">Reason & Priority Scoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {latestImpactReport.reassignedDetails.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-750 transition">
                    <td className="p-2.5 font-bold text-white whitespace-nowrap">{item.studentName}</td>
                    <td className="p-2.5 text-rose-300 line-through text-[11px] whitespace-nowrap">
                      {item.fromVehicle}
                    </td>
                    <td className="p-2.5 font-semibold text-emerald-300 whitespace-nowrap">
                      {item.toVehicle}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status.includes('Reassigned')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : item.status.includes('Alternative')
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-[11px] text-slate-400 max-w-sm">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active System Disruptions Log */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
          <span>Active Incident Event Log ({disruptions.length})</span>
          <span className="text-xs text-slate-400 font-normal">Real-Time Event Stream</span>
        </h2>

        <div className="space-y-3">
          {disruptions.map((d) => (
            <div
              key={d.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">{d.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                      d.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {d.severity}
                  </span>
                </div>
                <p className="text-slate-400 mt-1 leading-relaxed">{d.description}</p>
                <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-500">
                  <span>Logged: {new Date(d.timestamp).toLocaleTimeString()}</span>
                  <span>Affected: {d.affectedStudentIds.length} Students</span>
                  <span>Reassigned: {d.reassignedStudentIds.length} Students</span>
                </div>
              </div>

              <button
                onClick={() => setActiveRole('operator')}
                className="self-start sm:self-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold whitespace-nowrap transition"
              >
                Inspect in Command Center ➔
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
