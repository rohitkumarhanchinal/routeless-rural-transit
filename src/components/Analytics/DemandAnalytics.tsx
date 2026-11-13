import React from 'react';
import { useTransport } from '../../context/TransportContext';
import { DemandForecaster } from '../../algorithms/demandForecaster';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Users,
  Bus,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const DemandAnalytics: React.FC = () => {
  const { requests, buses, students, villages, institutions, t } = useTransport();

  const metrics = DemandForecaster.calculateSystemMetrics(requests, buses, students);
  const routeDemand = DemandForecaster.analyzeRouteDemand(requests, buses, villages, institutions);
  const hourlySlots = DemandForecaster.getHourlyDemandSlots(requests, buses);

  // Top 5 most crowded routes for visualization
  const topRoutesData = routeDemand.slice(0, 5).map((r) => ({
    name: r.fromVillage.split(' ')[0] + ' ➔ ' + (r.toInstitution.includes('Polytechnic') ? 'Poly' : 'Degree'),
    actual: r.currentActualDemand,
    projected: r.projectedTomorrowDemand,
    capacity: r.availableCapacity + r.currentActualDemand,
    utilization: r.utilizationRate,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2.5 text-brand-400" />
            {t.analytics_title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time student ridership demand, seat inventory utilization, and algorithmic demand forecasting.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-brand-400" />
          <span>Active Window: Morning College Commute (07:00 - 09:30 AM)</span>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Logged Requests</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalRequests}</p>
          <div className="mt-1 flex items-center text-[11px] text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>{metrics.allocationRatePct}% Allocation Rate</span>
          </div>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Allocated Students</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{metrics.allocated}</p>
          <span className="text-[11px] text-slate-500">Confirmed seats in buses & feeders</span>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Unallocated (Waitlist)</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{metrics.waitlisted}</p>
          <span className="text-[11px] text-amber-400/80">Pending auxiliary vehicle dispatch</span>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Fleet Seat Utilization</span>
            <Bus className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.fleetUtilizationPct}%</p>
          <span className="text-[11px] text-slate-500">
            {metrics.totalOccupiedSeats} / {metrics.totalFleetCapacity} active seats booked
          </span>
        </div>
      </div>

      {/* Explanatory Methodology Box (Strictly honest, non-fabricated ML) */}
      <div className="bg-brand-950/40 border border-brand-500/40 rounded-2xl p-4 shadow-md text-xs text-brand-200">
        <div className="flex items-center space-x-2 font-bold text-brand-300 mb-1">
          <HelpCircle className="w-4 h-4" />
          <span>{t.methodology_title}</span>
        </div>
        <p className="leading-relaxed text-slate-600">
          {DemandForecaster.METHODOLOGY_EXPLANATION}
        </p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Actual vs Algorithmic Projected Demand by Route */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Corridor Demand: Actual vs Projected
              </h2>
              <p className="text-xs text-slate-500">Comparing live student requests against tomorrow's projection</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRoutesData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="actual" name="Actual Demand (Observed)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="projected" name="Projected Demand (Algorithmic)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly Demand vs Available Capacity Timeline */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Time-Slot Load: Ridership vs Total Capacity
              </h2>
              <p className="text-xs text-slate-500">Identifying morning peak commuter congestion windows</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlySlots} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timeSlot" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="capacity" name="Available Fleet Capacity" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="actualDemand" name="Actual Logged Demand" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                <Area type="monotone" dataKey="projectedDemand" name="Projected Demand" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Corridor Congestion Stress Index Table */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 shadow-xl">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Rural Corridor Congestion & Stress Index
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-white text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Corridor</th>
                <th className="p-3">Observed Demand</th>
                <th className="p-3">Projected Demand</th>
                <th className="p-3">Open Fleet Seats</th>
                <th className="p-3">Utilization Rate</th>
                <th className="p-3">Corridor Stress Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {routeDemand.map((item) => (
                <tr key={item.routeId} className="hover:bg-slate-750 transition">
                  <td className="p-3 font-semibold text-slate-900">{item.routeName}</td>
                  <td className="p-3">{item.currentActualDemand} students</td>
                  <td className="p-3 font-medium text-purple-300">{item.projectedTomorrowDemand} students</td>
                  <td className="p-3 font-medium text-emerald-400">{item.availableCapacity} seats</td>
                  <td className="p-3 font-bold text-slate-700">{item.utilizationRate}%</td>
                  <td className="p-3">
                    {item.stressLevel === 'critical_overload' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                        CRITICAL OVERLOAD
                      </span>
                    )}
                    {item.stressLevel === 'high' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        HIGH DEMAND
                      </span>
                    )}
                    {item.stressLevel === 'optimal' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                        OPTIMAL (70-90%)
                      </span>
                    )}
                    {item.stressLevel === 'low' && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-700 text-slate-600 font-bold text-[10px]">
                        LOW DEMAND (&lt;50%)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
