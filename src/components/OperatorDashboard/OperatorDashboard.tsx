import React, { useState } from 'react';
import { useTransport } from '../../context/TransportContext';
import {
  Bus,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Shield,
  Activity,
  Wrench,
  Fuel,
  ArrowRight,
  TrendingUp,
  Filter,
  Check,
  Search,
} from 'lucide-react';
import { BusStatus } from '../../types';
import { EmergencyCommandCenter } from './EmergencyCommandCenter';

export const OperatorDashboard: React.FC = () => {
  const {
    t,
    language,
    buses,
    alternatives,
    students,
    requests,
    roads,
    villages,
    institutions,
    updateBusStatus,
    simulateBusBreakdown,
    simulateRoadClosure,
    addAuxiliaryBus,
    toggleRoadStatus,
  } = useTransport();

  const [activeTab, setActiveTab] = useState<'emergency' | 'fleet' | 'requests' | 'roads' | 'add_bus'>('emergency');
  const [fleetFilter, setFleetFilter] = useState<'all' | 'active' | 'breakdown' | 'maintenance'>('all');
  const [requestSearch, setRequestSearch] = useState('');

  // Form for deploying auxiliary bus
  const [newBusNumber, setNewBusNumber] = useState('KA-28-EX-9901');
  const [newOperatorName, setNewOperatorName] = useState('NWKRTC Auxiliary Express');
  const [newModel, setNewModel] = useState('Tata Starbus 32-Seater');
  const [newCapacity, setNewCapacity] = useState(32);
  const [newDepartureTime, setNewDepartureTime] = useState('07:45 AM');
  const [newArrivalTime, setNewArrivalTime] = useState('08:50 AM');
  const [newDriverName, setNewDriverName] = useState('Kallappa G');
  const [newDriverContact, setNewDriverContact] = useState('+91 94812 55901');
  const [newFuelType, setNewFuelType] = useState<'diesel' | 'electric' | 'cng'>('electric');
  const [addBusSuccess, setAddBusSuccess] = useState<string | null>(null);

  const totalCapacity = buses.reduce((acc, b) => acc + (b.status === 'active' ? b.totalCapacity : 0), 0);
  const totalOccupied = buses.reduce((acc, b) => acc + (b.status === 'active' ? b.occupiedSeats : 0), 0);
  const overallUtilization = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const handleAddBus = (e: React.FormEvent) => {
    e.preventDefault();
    addAuxiliaryBus({
      busNumber: newBusNumber,
      operatorName: newOperatorName,
      operatorType: 'ksrtc_sarige',
      model: newModel,
      totalCapacity: Number(newCapacity),
      routeId: 'route_auxiliary_express',
      stops: ['v_harugeri', 'v_mugalkhod', 'inst_govt_polytechnic'],
      currentStopId: 'v_harugeri',
      departureTime: newDepartureTime,
      estimatedArrivalTime: newArrivalTime,
      driverName: newDriverName,
      driverContact: newDriverContact,
      rating: 4.9,
      fuelType: newFuelType,
    });

    setAddBusSuccess(`Auxiliary Bus ${newBusNumber} successfully deployed into live service! Absorbing waitlisted commuters.`);
    setTimeout(() => {
      setAddBusSuccess(null);
      setActiveTab('fleet');
    }, 1500);
  };

  const filteredBuses = buses.filter((b) => {
    if (fleetFilter === 'all') return true;
    return b.status === fleetFilter;
  });

  const filteredRequests = requests.filter((r) => {
    if (!requestSearch) return true;
    const s = requestSearch.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(s) ||
      r.villageName.toLowerCase().includes(s) ||
      r.institutionName.toLowerCase().includes(s) ||
      r.status.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Header & Operational Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
              NWKRTC / REGIONAL TRANSIT AUTHORITY
            </span>
            <span className="text-[11px] text-slate-500 font-mono">BELAGAVI SECTOR</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center">
            <Bus className="w-6 h-6 mr-2.5 text-brand-400" />
            {t.operator_command}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fleet telemetry, seat headroom monitoring, driver manifests, and instant relief dispatch.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50/90 p-1.5 rounded-2xl border border-slate-200 shadow-lg">
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'emergency' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-700 hover:bg-rose-50'}`}
          >
            <span className="inline-flex items-center gap-1.5"><AlertTriangle size={14}/> Exam Day Crisis</span>
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'fleet' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fleet Manager ({buses.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'requests' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Queue ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('roads')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'roads' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Roads ({roads.length})
          </button>
          <button
            onClick={() => setActiveTab('add_bus')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              activeTab === 'add_bus' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Bus</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Bus Fleet</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {buses.filter((b) => b.status === 'active').length} / {buses.length}
          </p>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Live Route Monitored</span>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Seat Utilization</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{overallUtilization}%</p>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">
            {totalOccupied}/{totalCapacity} Seats Booked
          </span>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Allocated Commuters</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {students.filter((s) => s.status === 'confirmed' || s.status === 'reassigned').length}
          </p>
          <span className="text-[11px] text-amber-400 font-semibold mt-1 block">
            {students.filter((s) => s.status === 'waitlisted').length} Waitlisted (Strict Cap)
          </span>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Auxiliary Feeder Headroom</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-300 mt-2">
            {alternatives.reduce((acc, a) => acc + a.availableSeats, 0)} Seats
          </p>
          <span className="text-[11px] text-purple-400 font-semibold mt-1 block">Panchayat & MaxiCab Reserve</span>
        </div>
      </div>

      {activeTab === 'emergency' && <EmergencyCommandCenter />}

      {/* TAB 1: Fleet Manager */}
      {activeTab === 'fleet' && (
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200/80 gap-4 mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900">{t.fleet_management}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle operational statuses, simulate emergency breakdowns, and monitor seat occupancy headroom.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFleetFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  fleetFilter === 'all' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({buses.length})
              </button>
              <button
                onClick={() => setFleetFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  fleetFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Active ({buses.filter((b) => b.status === 'active').length})
              </button>
              <button
                onClick={() => setFleetFilter('breakdown')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  fleetFilter === 'breakdown' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Breakdown ({buses.filter((b) => b.status === 'breakdown').length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBuses.map((bus) => {
              const freeSeats = Math.max(0, bus.totalCapacity - bus.occupiedSeats);
              const occupancy = Math.round((bus.occupiedSeats / bus.totalCapacity) * 100);

              return (
                <div
                  key={bus.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    bus.status === 'breakdown'
                      ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/50'
                      : bus.status === 'maintenance'
                      ? 'bg-amber-950/20 border-amber-500/50'
                      : 'bg-white/90 border-slate-200 hover:border-brand-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-base font-mono">{bus.busNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 font-bold border border-slate-200">
                          {bus.fuelType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{bus.operatorName}</p>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        bus.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : bus.status === 'breakdown'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {bus.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Route & Timings */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50/70 border border-slate-200/50 text-xs text-slate-600 space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Departure:</span>
                      <strong className="text-slate-900 font-mono">{bus.departureTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Arrival:</span>
                      <strong className="text-slate-900 font-mono">{bus.estimatedArrivalTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver Pilot:</span>
                      <span className="text-slate-700">{bus.driverName}</span>
                    </div>
                  </div>

                  {/* Seat Capacity Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">
                        Occupancy: <strong className="text-slate-900">{bus.occupiedSeats}</strong> / {bus.totalCapacity} Seats
                      </span>
                      <span className={occupancy >= 100 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {freeSeats} Free ({occupancy}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          occupancy >= 100
                            ? 'bg-rose-500'
                            : occupancy > 80
                            ? 'bg-amber-500'
                            : 'bg-brand-500'
                        }`}
                        style={{ width: `${Math.min(100, occupancy)}%` }}
                      />
                    </div>
                  </div>

                  {/* Operator Action Buttons */}
                  <div className="mt-5 pt-3.5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    {bus.status === 'active' ? (
                      <button
                        onClick={() => {
                          if (window.confirm(`Simulate mechanical breakdown for Bus ${bus.busNumber}? AI will automatically reassign all students.`)) {
                            simulateBusBreakdown(bus.id);
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Report Breakdown</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateBusStatus(bus.id, 'active')}
                        className="flex-1 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Restore to Active</span>
                      </button>
                    )}

                    <button
                      onClick={() =>
                        updateBusStatus(bus.id, bus.status === 'maintenance' ? 'active' : 'maintenance')
                      }
                      title="Toggle Scheduled Maintenance"
                      className="p-2 bg-slate-50 hover:bg-slate-700 text-slate-600 rounded-xl border border-slate-200 transition"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Student Requests Queue */}
      {activeTab === 'requests' && (
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200/80 gap-4 mb-5">
            <div>
              <h2 className="text-base font-black text-slate-900">{t.live_requests}</h2>
              <p className="text-xs text-slate-500">
                Transparent 6-pillar scoring, priority weighting, and real-time student allocations.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search student or route..."
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-white/90 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="p-3.5">Student Passenger</th>
                  <th className="p-3.5">Corridor Route</th>
                  <th className="p-3.5">Timings</th>
                  <th className="p-3.5">Priority Tier</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assigned Vehicle</th>
                  <th className="p-3.5">Decision Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-750 transition">
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {req.studentName}
                      {req.demandSource === 'simulated' && <span className="simulated-source">Simulated</span>}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-slate-700">{req.villageName}</span>
                      <ArrowRight className="w-3 h-3 inline mx-1.5 text-slate-500" />
                      <span className="text-slate-700">{req.institutionName}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono text-[11px]">
                      {req.requestedDepartureTime} ➔ <strong className="text-emerald-400">{req.requiredArrivalTime}</strong>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {req.priorityTier === 'high_exam' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                          EXAM DAY (+35)
                        </span>
                      )}
                      {req.priorityTier === 'medical_girl_safety' && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                          GIRL SAFETY (+20)
                        </span>
                      )}
                      {req.priorityTier === 'standard' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-600 text-[10px]">
                          STANDARD
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {req.status === 'confirmed' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                          CONFIRMED
                        </span>
                      )}
                      {req.status === 'reassigned' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                          REASSIGNED
                        </span>
                      )}
                      {req.status === 'waitlisted' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                          WAITLISTED
                        </span>
                      )}
                      {req.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-600 text-[10px]">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {req.assignedVehicleNumber || '—'}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-500 max-w-xs leading-relaxed">
                      {req.allocationReason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Road Network Segments */}
      {activeTab === 'roads' && (
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
          <div className="flex items-center justify-between pb-5 border-b border-slate-200/80 mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900">Rural Road Corridors & Disruption Controls</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle closures on any road corridor. The Dijkstra routing engine will immediately compute alternative paths.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roads.map((road) => {
              const fromName = villages.find((v) => v.id === road.fromNodeId)?.name || institutions.find((i) => i.id === road.fromNodeId)?.name || road.fromNodeId;
              const toName = villages.find((v) => v.id === road.toNodeId)?.name || institutions.find((i) => i.id === road.toNodeId)?.name || road.toNodeId;

              return (
                <div
                  key={road.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    road.isDisrupted
                      ? 'bg-rose-950/20 border-rose-500/50 text-rose-200'
                      : 'bg-white/80 border-slate-200 text-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-extrabold text-sm block">
                        {fromName} ➔ {toName}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {road.distanceKm} km • ~{road.typicalMinutes} mins • Condition: <span className="uppercase font-bold">{road.condition}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        road.isDisrupted ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {road.isDisrupted ? 'CLOSED' : 'OPEN'}
                    </span>
                  </div>

                  {road.isDisrupted && (
                    <div className="mt-3 text-xs text-rose-300 bg-rose-900/40 p-2.5 rounded-xl border border-rose-500/30">
                      ⚠️ Active Blockage: {road.disruptionReason || 'Road under repair / flooded'}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-end">
                    <button
                      onClick={() => toggleRoadStatus(road.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        road.isDisrupted
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-rose-600/80 hover:bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      }`}
                    >
                      {road.isDisrupted ? 'Clear Disruption & Reopen Road' : 'Mark Road Disrupted'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Deploy Auxiliary Bus Form */}
      {activeTab === 'add_bus' && (
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto">
          <h2 className="text-base font-black text-slate-900 mb-1.5 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-emerald-400" />
            Deploy Auxiliary Rural Transit Vehicle
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Deploying an auxiliary vehicle immediately absorbs waiting students in priority order.
          </p>

          {addBusSuccess && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              {addBusSuccess}
            </div>
          )}

          <form onSubmit={handleAddBus} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Plate Number</label>
                <input
                  type="text"
                  value={newBusNumber}
                  onChange={(e) => setNewBusNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Total Seat Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  min={10}
                  max={60}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Operator Organization</label>
                <input
                  type="text"
                  value={newOperatorName}
                  onChange={(e) => setNewOperatorName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Model</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Departure Time</label>
                <input
                  type="text"
                  value={newDepartureTime}
                  onChange={(e) => setNewDepartureTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Estimated Arrival</label>
                <input
                  type="text"
                  value={newArrivalTime}
                  onChange={(e) => setNewArrivalTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Powertrain / Fuel</label>
                <select
                  value={newFuelType}
                  onChange={(e) => setNewFuelType(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="electric">Electric (EV)</option>
                  <option value="cng">CNG</option>
                  <option value="diesel">Diesel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Pilot Name</label>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Phone</label>
                <input
                  type="text"
                  value={newDriverContact}
                  onChange={(e) => setNewDriverContact(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-xl shadow-emerald-600/30 transition flex items-center justify-center space-x-2 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy Auxiliary Bus & Clear Waitlist</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
