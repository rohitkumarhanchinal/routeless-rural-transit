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
} from 'lucide-react';
import { BusStatus } from '../../types';

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

  const [activeTab, setActiveTab] = useState<'fleet' | 'requests' | 'roads' | 'add_bus'>('fleet');

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

    setAddBusSuccess(`Auxiliary Bus ${newBusNumber} successfully deployed into live service!`);
    setTimeout(() => {
      setAddBusSuccess(null);
      setActiveTab('fleet');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Header & Operational Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center">
            <Bus className="w-6 h-6 mr-2.5 text-brand-400" />
            {t.operator_command}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fleet monitoring, student passenger manifest, and rapid disruption mitigation.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'fleet' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Fleet Manager ({buses.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'requests' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Student Queue ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('roads')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'roads' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Road Network ({roads.length})
          </button>
          <button
            onClick={() => setActiveTab('add_bus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
              activeTab === 'add_bus' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deploy Bus</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Bus Fleet</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {buses.filter((b) => b.status === 'active').length} / {buses.length}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium">100% Verified Routes</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Seat Utilization</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{overallUtilization}%</p>
          <span className="text-[11px] text-slate-400">
            {totalOccupied} / {totalCapacity} Seats Booked
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Allocated Students</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {students.filter((s) => s.status === 'confirmed' || s.status === 'reassigned').length}
          </p>
          <span className="text-[11px] text-amber-400">
            {students.filter((s) => s.status === 'waitlisted').length} Waitlisted (Cap enforced)
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Auxiliary Feeder Fleet</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {alternatives.reduce((acc, a) => acc + a.availableSeats, 0)} Seats
          </p>
          <span className="text-[11px] text-purple-400 font-medium">Panchayat & MaxiCab Reserve</span>
        </div>
      </div>

      {/* TAB 1: Fleet Manager */}
      {activeTab === 'fleet' && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">{t.fleet_management}</h2>
              <p className="text-xs text-slate-400">
                Change vehicle operational status, simulate breakdowns, and monitor route load factors.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('add_bus')}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map((bus) => {
              const freeSeats = Math.max(0, bus.totalCapacity - bus.occupiedSeats);
              const occupancy = Math.round((bus.occupiedSeats / bus.totalCapacity) * 100);

              return (
                <div
                  key={bus.id}
                  className={`p-4 rounded-xl border transition-all ${
                    bus.status === 'breakdown'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : bus.status === 'maintenance'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-white text-sm">{bus.busNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {bus.fuelType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{bus.operatorName}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bus.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : bus.status === 'breakdown'
                          ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {bus.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Route & Timings */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-800/60 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Departure:</span>
                      <strong className="text-white">{bus.departureTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est. Arrival:</span>
                      <strong className="text-white">{bus.estimatedArrivalTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Driver:</span>
                      <span>{bus.driverName} ({bus.driverContact})</span>
                    </div>
                  </div>

                  {/* Seat Capacity Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">
                        Occupancy: <strong className="text-white">{bus.occupiedSeats}</strong> / {bus.totalCapacity}
                      </span>
                      <span className={occupancy >= 100 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {freeSeats} Free ({occupancy}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
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
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    {bus.status === 'active' ? (
                      <button
                        onClick={() => {
                          if (window.confirm(`Simulate mechanical breakdown for Bus ${bus.busNumber}? AI will automatically reassign all students.`)) {
                            simulateBusBreakdown(bus.id);
                          }
                        }}
                        className="flex-1 py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Report Breakdown</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateBusStatus(bus.id, 'active')}
                        className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition"
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
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
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
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">{t.live_requests}</h2>
              <p className="text-xs text-slate-400">
                Transparent AI scoring, priority weighting, and real-time student allocations.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Origin ➔ Destination</th>
                  <th className="p-3">Timing</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Vehicle</th>
                  <th className="p-3">Allocation Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-750 transition">
                    <td className="p-3 font-semibold text-white whitespace-nowrap">
                      {req.studentName}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-slate-200">{req.villageName}</span>
                      <ArrowRight className="w-3 h-3 inline mx-1.5 text-slate-500" />
                      <span className="text-slate-200">{req.institutionName}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {req.requestedDepartureTime} ➔ <strong className="text-emerald-400">{req.requiredArrivalTime}</strong>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {req.priorityTier === 'high_exam' && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                          EXAM DAY (+40)
                        </span>
                      )}
                      {req.priorityTier === 'medical_girl_safety' && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                          GIRL SAFETY (+25)
                        </span>
                      )}
                      {req.priorityTier === 'standard' && (
                        <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">
                          STANDARD
                        </span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {req.status === 'confirmed' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                          CONFIRMED
                        </span>
                      )}
                      {req.status === 'reassigned' && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-[10px] border border-cyan-500/20">
                          REASSIGNED
                        </span>
                      )}
                      {req.status === 'waitlisted' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px] border border-amber-500/20">
                          WAITLISTED
                        </span>
                      )}
                      {req.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px]">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-200 whitespace-nowrap">
                      {req.assignedVehicleNumber || '—'}
                    </td>
                    <td className="p-3 text-[11px] text-slate-400 max-w-xs">
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
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Rural Road Corridors & Disruption Controls</h2>
              <p className="text-xs text-slate-400">
                Click any road segment to toggle closure/repair. The Dijkstra engine will recalculate live detours.
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
                  className={`p-4 rounded-xl border transition ${
                    road.isDisrupted
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      : 'bg-slate-900/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-sm block">
                        {fromName} ➔ {toName}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {road.distanceKm} km • ~{road.typicalMinutes} mins • Condition: <span className="uppercase font-semibold">{road.condition}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        road.isDisrupted ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {road.isDisrupted ? 'DISRUPTED' : 'CLEAR'}
                    </span>
                  </div>

                  {road.isDisrupted && (
                    <div className="mt-2 text-xs text-rose-300 bg-rose-900/30 p-2 rounded-lg">
                      ⚠️ Reason: {road.disruptionReason || 'Road under repair / flooded'}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-end">
                    <button
                      onClick={() => toggleRoadStatus(road.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        road.isDisrupted
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600/80 hover:bg-rose-600 text-white'
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
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto">
          <h2 className="text-base font-bold text-white mb-2 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-emerald-400" />
            Deploy Auxiliary Rural Transit Vehicle
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Deploying an auxiliary vehicle immediately absorbs waiting students in priority order.
          </p>

          {addBusSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              {addBusSuccess}
            </div>
          )}

          <form onSubmit={handleAddBus} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Plate Number</label>
                <input
                  type="text"
                  value={newBusNumber}
                  onChange={(e) => setNewBusNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Total Seat Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  min={10}
                  max={60}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Operator Organization</label>
                <input
                  type="text"
                  value={newOperatorName}
                  onChange={(e) => setNewOperatorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Model</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Departure Time</label>
                <input
                  type="text"
                  value={newDepartureTime}
                  onChange={(e) => setNewDepartureTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Arrival</label>
                <input
                  type="text"
                  value={newArrivalTime}
                  onChange={(e) => setNewArrivalTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Powertrain / Fuel</label>
                <select
                  value={newFuelType}
                  onChange={(e) => setNewFuelType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="electric">Electric (EV)</option>
                  <option value="cng">CNG</option>
                  <option value="diesel">Diesel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Driver Phone Number</label>
                <input
                  type="text"
                  value={newDriverContact}
                  onChange={(e) => setNewDriverContact(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy Auxiliary Bus & Reallocate Waitlist</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
