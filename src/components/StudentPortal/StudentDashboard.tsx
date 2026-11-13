import React, { useState } from 'react';
import { useTransport } from '../../context/TransportContext';
import {
  User,
  Bus,
  MapPin,
  Clock,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Sparkles,
  Phone,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Send,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { StudentPriorityTier } from '../../types';

const toTimeInputValue = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '09:00';
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
};

const toDisplayTimeValue = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export const StudentDashboard: React.FC = () => {
  const {
    t,
    language,
    activeStudent,
    villages,
    institutions,
    buses,
    alternatives,
    roads,
    requests,
    disruptions,
    emergencyReport,
    submitRideRequest,
    setActiveRole,
  } = useTransport();

  // New Request Form State
  const [selectedVillageId, setSelectedVillageId] = useState<string>(activeStudent.villageId);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>(activeStudent.institutionId);
  const [departureTime, setDepartureTime] = useState<string>('07:30 AM');
  const [arrivalTime, setArrivalTime] = useState<string>('08:45 AM');
  const [travelDate, setTravelDate] = useState<string>(activeStudent.travelDate || '2026-11-13');
  const [hasExam, setHasExam] = useState<boolean>(activeStudent.hasBoardExamToday);
  const [priorityTier, setPriorityTier] = useState<StudentPriorityTier>(activeStudent.priorityTier);
  const [requestSubmittedSuccess, setRequestSubmittedSuccess] = useState<string | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [examStartTime, setExamStartTime] = useState(toTimeInputValue(activeStudent.examinationStartTime || '09:00 AM'));

  const studentVillage = villages.find((v) => v.id === activeStudent.villageId);
  const studentInstitution = institutions.find((i) => i.id === activeStudent.institutionId);
  const assignedBus = buses.find((b) => b.id === activeStudent.assignedBusId);
  const assignedAlt = alternatives.find((a) => a.id === activeStudent.assignedAlternativeId);
  const latestRequest = requests.find((r) => r.studentId === activeStudent.id);
  const emergencyOutcome = emergencyReport?.outcomes.find((outcome) => outcome.studentId === activeStudent.id);
  const emergencyRoute = emergencyReport?.routeRecommendations.find((route) => route.studentId === activeStudent.id);
  const emergencyRouteNames = emergencyRoute?.alternativePath.map((nodeId) => villages.find((v) => v.id === nodeId)?.name || institutions.find((i) => i.id === nodeId)?.name || nodeId).join(' → ');

  // Check if student route is disrupted
  const isStudentRouteDisrupted = Boolean(emergencyReport?.affectedStudentIds.includes(activeStudent.id)) || disruptions.some((d) =>
    d.affectedStudentIds.includes(activeStudent.id) || d.affectedBusId === activeStudent.assignedBusId
  );

  // Filter buses serving the student's village and college
  const relevantBuses = buses.filter(
    (b) => b.stops.includes(activeStudent.villageId) && b.stops.includes(activeStudent.institutionId)
  );

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const decision = submitRideRequest({
      studentId: activeStudent.id,
      villageId: selectedVillageId,
      institutionId: selectedInstitutionId,
      departureTime,
      arrivalTime,
      travelDate,
      priorityTier: hasExam ? 'high_exam' : priorityTier === 'high_exam' ? (activeStudent.gender === 'female' ? 'medical_girl_safety' : 'standard') : priorityTier,
      hasBoardExamToday: hasExam,
      examinationStartTime: hasExam ? toDisplayTimeValue(examStartTime) : undefined,
    });

    setRequestSubmittedSuccess(
      decision.status === 'confirmed'
        ? `Seat Confirmed! Assigned to ${decision.assignedBus?.busNumber || decision.assignedAlternative?.name}.`
        : `Request Waitlisted. ${decision.reason}`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Current signed-in student profile */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur">
        <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-slate-900 font-bold text-lg shadow-md">
              {activeStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {language === 'kn' ? activeStudent.kannadaName : activeStudent.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">
                  {activeStudent.rollNumber}
                </span>
                {activeStudent.hasBoardExamToday && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold animate-pulse">
                    🎓 Exam Day Priority
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeStudent.course} • {activeStudent.yearOfStudy} | From: <span className="text-slate-700">{studentVillage?.name}</span> ➔ To: <span className="text-slate-700">{studentInstitution?.name}</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Disruption Warning Banner if student is impacted */}
      {isStudentRouteDisrupted && (
        <div className="bg-rose-950/50 border border-rose-500/50 rounded-2xl p-4 text-rose-200 flex items-start space-x-3.5 shadow-xl">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 text-sm">
            <span className="font-bold text-rose-300">Route Disruption Alert: </span>
            Your primary scheduled transit service has reported a breakdown or route blockage. The Routeless AI system has initiated emergency reallocation protocols.
            <button
              onClick={() => setActiveRole('simulator')}
              className="ml-3 underline font-semibold text-rose-300 hover:text-slate-900"
            >
              View Disruption Impact Report ➔
            </button>
          </div>
        </div>
      )}

      {emergencyOutcome && (
        <section className={`student-emergency-update ${emergencyOutcome.status === 'at_risk' || emergencyOutcome.status === 'waitlisted' ? 'at-risk' : 'safe'}`} aria-labelledby="student-emergency-title">
          <div className="student-emergency-heading"><div><span className="eyebrow">EXAM DAY TRANSPORT UPDATE</span><h2 id="student-emergency-title">Your emergency travel plan</h2></div><span className={`crisis-status ${emergencyOutcome.status === 'at_risk' || emergencyOutcome.status === 'waitlisted' ? 'warn' : 'good'}`}>{emergencyOutcome.status === 'at_risk' ? 'At risk' : emergencyOutcome.status}</span></div>
          <p className="student-emergency-reason">{emergencyOutcome.explanation}</p>
          <div className="student-emergency-details">
            {emergencyOutcome.originalVehicle && <div><span>Previous bus</span><strong>{emergencyOutcome.originalVehicle} · unavailable</strong></div>}
            <div><span>New vehicle</span><strong>{emergencyOutcome.assignedVehicle || 'No seat confirmed'}</strong></div>
            <div><span>Pickup</span><strong>{activeStudent.pickupPoint || studentVillage?.landmark || 'Village main stop'}</strong></div>
            <div><span>Estimated arrival</span><strong>{emergencyOutcome.estimatedArrivalTime || 'Not available'}</strong></div>
            {emergencyOutcome.examinationStartTime && <div><span>Exam priority</span><strong>{emergencyOutcome.priority === 'critical' ? 'Priority 1 · Critical' : emergencyOutcome.priority === 'high' ? 'Priority 2 · High' : 'Priority 3 · Normal'} · Exam {emergencyOutcome.examinationStartTime}</strong></div>}
          </div>
          {emergencyRouteNames && <div className="student-route-note"><MapPin size={15}/><span><strong>Flood-safe route estimate:</strong> {emergencyRouteNames}</span></div>}
          <p className="student-demo-note">Estimated times use the local demonstration road data. Confirm final pickup instructions with your operator.</p>
        </section>
      )}

      {/* Main Grid: Digital Boarding Pass & New Request */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Digital Boarding Pass & Status (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-40 h-40 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  {t.student_dashboard}
                </h2>
              </div>
              <div>
                {activeStudent.status === 'confirmed' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> {t.status_confirmed}
                  </span>
                )}
                {activeStudent.status === 'reassigned' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center">
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t.status_reassigned}
                  </span>
                )}
                {activeStudent.status === 'waitlisted' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" /> {t.status_waitlisted} (Full Capacity)
                  </span>
                )}
                {activeStudent.status === 'pending' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-600 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" /> {t.status_pending}
                  </span>
                )}
              </div>
            </div>

            {/* Boarding Pass Core Details */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/60">
                <span className="text-[11px] text-slate-500 uppercase font-semibold flex items-center">
                  <Bus className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
                  {t.assigned_vehicle}
                </span>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {assignedBus
                    ? `${assignedBus.busNumber} (${assignedBus.operatorName})`
                    : assignedAlt
                    ? `${assignedAlt.vehicleNumber} (${assignedAlt.name})`
                    : 'Awaiting Vehicle Assignment'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {assignedBus
                    ? assignedBus.model
                    : assignedAlt
                    ? `Verified Alternative Feeder • ₹${assignedAlt.farePerStudent} fare`
                    : 'Waitlist active - No overbooking allowed'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/60">
                <span className="text-[11px] text-slate-500 uppercase font-semibold flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                  {t.pickup_point}
                </span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {activeStudent.pickupPoint || studentVillage?.landmark}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled Arrival: <span className="text-emerald-400 font-semibold">{activeStudent.requiredArrivalTime}</span>
                </p>
              </div>
            </div>

            {/* Driver & Contact info if assigned */}
            {assignedBus && (
              <div className="mt-4 p-3 rounded-xl bg-white/50 border border-slate-200/40 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Driver: <strong className="text-slate-900">{assignedBus.driverName}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5 text-brand-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{assignedBus.driverContact}</span>
                </div>
              </div>
            )}

            {/* Explainable AI Allocation Reason Box */}
            <div className="mt-5 p-4 rounded-xl bg-brand-950/30 border border-brand-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <h3 className="text-xs font-bold text-brand-300 uppercase tracking-wider">
                  {t.allocation_reason}
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {latestRequest?.allocationReason ||
                  (activeStudent.status === 'confirmed'
                    ? 'Allocated based on direct corridor compatibility, arrival time buffer, and available seating capacity.'
                    : 'Waitlisted due to strict 100% vehicle capacity limit on primary transit service. Standby auxiliary vehicle requested.')}
              </p>

              {/* Score Breakdown if present */}
              {latestRequest?.scoreBreakdown && (
                <div className="mt-3 pt-3 border-t border-brand-500/20 grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Route Match</span>
                    <strong className="text-xs text-brand-300">+{latestRequest.scoreBreakdown.routeMatch}</strong>
                  </div>
                  <div className="bg-white/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Timing Match</span>
                    <strong className="text-xs text-brand-300">+{latestRequest.scoreBreakdown.timeMatch}</strong>
                  </div>
                  <div className="bg-white/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Capacity Score</span>
                    <strong className="text-xs text-brand-300">+{latestRequest.scoreBreakdown.capacityScore}</strong>
                  </div>
                  <div className="bg-white/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Priority Tier</span>
                    <strong className="text-xs text-emerald-400">+{latestRequest.scoreBreakdown.priorityBonus}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-200/80">
              <button
                onClick={() => setActiveRole('routes')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center"
              >
                {t.view_route} <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
              <button
                onClick={() => setActiveRole('assistant')}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-700 font-medium flex items-center"
              >
                <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Ask Routeless AI
              </button>
            </div>
          </div>

          {/* Available Scheduled Buses Section */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>{t.available_buses} ({relevantBuses.length})</span>
              <span className="text-xs text-slate-500 font-normal">Real-Time Seat Inventory</span>
            </h3>

            <div className="space-y-3">
              {relevantBuses.length === 0 ? (
                <p className="text-xs text-slate-500 p-3 bg-white/50 rounded-xl">
                  No standard scheduled government buses directly serve this specific village-to-institution corridor. Check Verified Alternatives below.
                </p>
              ) : (
                relevantBuses.map((bus) => {
                  const freeSeats = Math.max(0, bus.totalCapacity - bus.occupiedSeats);
                  const occupancyPct = Math.round((bus.occupiedSeats / bus.totalCapacity) * 100);
                  const isFull = freeSeats === 0;

                  return (
                    <div
                      key={bus.id}
                      className={`p-3.5 rounded-xl border transition ${
                        bus.status === 'breakdown'
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                          : isFull
                          ? 'bg-white/70 border-slate-200/60'
                          : 'bg-white/90 border-slate-200 hover:border-brand-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{bus.busNumber}</span>
                            <span className="text-[11px] text-slate-500">({bus.operatorName})</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Departs: <strong className="text-slate-700">{bus.departureTime}</strong> | Est. Arrival: <strong className="text-slate-700">{bus.estimatedArrivalTime}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              bus.status === 'breakdown'
                                ? 'bg-rose-500/20 text-rose-300'
                                : isFull
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {bus.status === 'breakdown'
                              ? 'BREAKDOWN'
                              : isFull
                              ? 'FULL (0 SEATS)'
                              : `${freeSeats} SEATS LEFT`}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar of occupied seats */}
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Capacity: {bus.occupiedSeats}/{bus.totalCapacity} seats</span>
                          <span>{occupancyPct}% Booked</span>
                        </div>
                        <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              occupancyPct >= 100
                                ? 'bg-rose-500'
                                : occupancyPct > 80
                                ? 'bg-amber-500'
                                : 'bg-brand-500'
                            }`}
                            style={{ width: `${Math.min(100, occupancyPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Request New Ride Form & Verified Alternatives (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Request Form */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <Send className="w-4 h-4 mr-2 text-brand-400" />
              {t.request_new_ride}
            </h2>

            {requestSubmittedSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {requestSubmittedSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pickup Village</label>
                <select
                  value={selectedVillageId}
                  onChange={(e) => setSelectedVillageId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {language === 'kn' ? v.kannadaName : v.name} ({v.taluk} Taluk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Destination Institution</label>
                <select
                  value={selectedInstitutionId}
                  onChange={(e) => setSelectedInstitutionId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {language === 'kn' ? inst.kannadaName : inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Required Arrival</label>
                  <select
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="08:45 AM">08:45 AM (Polytechnic Standard)</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:15 AM">09:15 AM</option>
                    <option value="09:30 AM">09:30 AM (Degree College)</option>
                  </select>
                </div>
              </div>

              {/* Priority Boost Checkboxes */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
                <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasExam}
                    onChange={(e) => setHasExam(e.target.checked)}
                    className="w-4 h-4 rounded bg-white border-slate-200 text-brand-500 focus:ring-0"
                  />
                  <span className="font-medium text-amber-300">🎓 Board / Semester Exam Today (+40 Score)</span>
                </label>

                <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priorityTier === 'medical_girl_safety'}
                    onChange={(e) =>
                      setPriorityTier(e.target.checked ? 'medical_girl_safety' : 'standard')
                    }
                    className="w-4 h-4 rounded bg-white border-slate-200 text-brand-500 focus:ring-0"
                  />
                  <span className="font-medium text-cyan-300">🛡️ Female Student Last-Mile Priority (+25 Score)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/30 transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run AI Intelligent Allocation</span>
              </button>
            </form>
          </div>

          {/* Verified Alternative Providers Panel */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
                {t.verified_alternatives}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                RTO Verified
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              When regular state buses are full or delayed, Routeless partners with verified Panchayat feeders and student shuttles.
            </p>

            <div className="space-y-3">
              {alternatives.map((alt) => (
                <div key={alt.id} className="p-3 rounded-xl bg-white/80 border border-slate-200/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">{alt.name}</span>
                    <span className="text-emerald-400 font-semibold">{alt.availableSeats} Seats Open</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Plate: {alt.vehicleNumber}</span>
                    <span>Student Fare: {alt.farePerStudent === 0 ? 'FREE (Panchayat Subsidized)' : `₹${alt.farePerStudent}`}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setProfileEditorOpen((open) => !open)} aria-expanded={profileEditorOpen} aria-controls="student-profile-editor" className="inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Pencil className="h-4 w-4" aria-hidden="true" /> {profileEditorOpen ? 'Close edit' : 'Edit profile'}
        </button>
        </div>
        {profileEditorOpen && <form id="student-profile-editor" onSubmit={(event) => { handleSubmitRequest(event); setProfileEditorOpen(false); }} className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
          <div><label htmlFor="profile-village" className="mb-1 block text-sm font-semibold text-slate-700">Pickup village</label><select id="profile-village" value={selectedVillageId} onChange={(event) => setSelectedVillageId(event.target.value)} className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">{villages.map((village) => <option key={village.id} value={village.id}>{language === 'kn' ? village.kannadaName : village.name}</option>)}</select></div>
          <div><label htmlFor="profile-institution" className="mb-1 block text-sm font-semibold text-slate-700">Institution</label><select id="profile-institution" value={selectedInstitutionId} onChange={(event) => setSelectedInstitutionId(event.target.value)} className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">{institutions.map((institution) => <option key={institution.id} value={institution.id}>{language === 'kn' ? institution.kannadaName : institution.name}</option>)}</select></div>
          <label htmlFor="profile-exam" className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 sm:col-span-2"><input id="profile-exam" type="checkbox" checked={hasExam} onChange={(event) => setHasExam(event.target.checked)} className="h-5 w-5 accent-blue-600"/>I have an exam today</label>
          {hasExam && <div><label htmlFor="profile-exam-time" className="mb-1 block text-sm font-semibold text-slate-700">Exam start time</label><input id="profile-exam-time" type="time" value={examStartTime} onChange={(event) => setExamStartTime(event.target.value)} className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"/></div>}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => { setSelectedVillageId(activeStudent.villageId); setSelectedInstitutionId(activeStudent.institutionId); setHasExam(activeStudent.hasBoardExamToday); setExamStartTime(toTimeInputValue(activeStudent.examinationStartTime || '09:00 AM')); setProfileEditorOpen(false); }} className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"><X className="h-4 w-4"/>Cancel</button><button type="submit" className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"><Check className="h-4 w-4"/>Save profile and update transport</button></div>
        </form>}
      </div>
    </div>
  );
};
