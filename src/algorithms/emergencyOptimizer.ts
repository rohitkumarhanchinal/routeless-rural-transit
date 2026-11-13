import { AllocationEngine } from './allocationEngine';
import { GraphRouter } from './graphRouter';
import { AlternativeProvider, Bus, DisruptionEvent, EmergencyPriorityCategory, EmergencyRunReport, EmergencyStudentOutcome, Institution, RoadSegment, Student, SystemNotification, TransportationRequest, Village } from '../types';
import { INITIAL_STUDENTS } from '../data/demoData';

export interface EmergencyOptimizationResult {
  buses: Bus[];
  alternatives: AlternativeProvider[];
  roads: RoadSegment[];
  students: Student[];
  requests: TransportationRequest[];
  report: EmergencyRunReport;
  event: DisruptionEvent;
  notifications: SystemNotification[];
}

const SIMULATION_START = '07:30 AM';
const FLOOD_ROAD_ID = 'road_haru_mugalkhod';
const SURGE_STUDENTS = [
  { villageId: 'v_harugeri', institutionId: 'inst_govt_polytechnic', exam: '08:40 AM' },
  { villageId: 'v_mugalkhod', institutionId: 'inst_govt_polytechnic', exam: '09:10 AM' },
  { villageId: 'v_raybag_west', institutionId: 'inst_govt_polytechnic', exam: '' },
  { villageId: 'v_borgaon', institutionId: 'inst_govt_polytechnic', exam: '08:55 AM' },
  { villageId: 'v_hukkeri_cross', institutionId: 'inst_rural_degree', exam: '09:20 AM' },
  { villageId: 'v_ghataprabha', institutionId: 'inst_rural_degree', exam: '' },
  { villageId: 'v_harugeri', institutionId: 'inst_rural_degree', exam: '' },
];

const addMinutes = (time: string, minutes: number) => {
  const value = (AllocationEngine.parseTimeToMinutes(time) + minutes + 1440) % 1440;
  const h24 = Math.floor(value / 60);
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(value % 60).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
};

const isExamStudent = (student: Student) => student.examinationStatus === 'scheduled' || student.hasBoardExamToday;

const getExamTime = (student: Student, baseline: Student[]) => {
  if (student.examinationStartTime) return student.examinationStartTime;
  return baseline.find((item) => item.id === student.id)?.examinationStartTime || INITIAL_STUDENTS.find((item) => item.id === student.id)?.examinationStartTime;
};

const routeUsesBlockedRoad = (bus: Bus, roads: RoadSegment[]) => bus.stops.some((stop, i) => {
  if (i === bus.stops.length - 1) return false;
  return roads.some((road) => road.isDisrupted && ((road.fromNodeId === stop && road.toNodeId === bus.stops[i + 1]) || (road.toNodeId === stop && road.fromNodeId === bus.stops[i + 1])));
});

type Candidate = { vehicleId: string; vehicleLabel: string; kind: 'bus' | 'alternative'; arrival: string; path: string[]; distance: number; minutes: number; seatCount: number };

export class EmergencyOptimizer {
  static activate(input: {
    buses: Bus[]; alternatives: AlternativeProvider[]; roads: RoadSegment[]; students: Student[]; requests: TransportationRequest[];
    villages: Village[]; institutions: Institution[]; activatedAt?: string;
  }): EmergencyOptimizationResult {
    const { villages, institutions } = input;
    if (input.students.some((student) => student.id.startsWith('exam_surge_'))) {
      throw new Error('Exam Day Crisis demand has already been applied. Reset the simulation before activating it again.');
    }
    const affectedBusIds = input.buses.filter((bus) => ['ksrtc_sarige', 'mini_bus'].includes(bus.operatorType) && bus.status === 'active').slice(0, 2).map((bus) => bus.id);
    if (affectedBusIds.length < 2) throw new Error('Two active government buses are required to run the exam day simulation.');
    const buses = input.buses.map((bus) => affectedBusIds.includes(bus.id) ? { ...bus, status: 'breakdown' as const } : { ...bus });
    const alternatives = input.alternatives.map((alt) => ({ ...alt, status: alt.isVerified && alt.status === 'standby' ? 'active' as const : alt.status }));
    const roads = input.roads.map((road) => road.id === FLOOD_ROAD_ID ? { ...road, isDisrupted: true, condition: 'flooded' as const, disruptionReason: 'Simulated flood closure for Exam Day Crisis' } : { ...road });
    if (!roads.some((road) => road.id === FLOOD_ROAD_ID)) throw new Error('Flood demonstration road is missing from the road network.');
    const router = new GraphRouter(villages, institutions, roads);
    const demandBefore = input.students.length;
    const demandAfter = Math.ceil(demandBefore * 1.4);
    const surgeCount = Math.max(0, demandAfter - demandBefore);
    const baselineStudents = input.students;
    const addedStudents: Student[] = SURGE_STUDENTS.slice(0, surgeCount).map((source, index) => {
      const exam = source.exam;
      const village = villages.find((item) => item.id === source.villageId);
      return {
        id: `exam_surge_${String(index + 1).padStart(2, '0')}`, name: `Simulated request ${String(index + 1).padStart(2, '0')}`, kannadaName: `ಸಿಮ್ಯುಲೇಟೆಡ್ ವಿನಂತಿ ${index + 1}`,
        rollNumber: `CRISIS-${String(index + 1).padStart(2, '0')}`, villageId: source.villageId, institutionId: source.institutionId,
        course: 'Simulated demand increase', yearOfStudy: 'Demo data', gender: 'other', requiredArrivalTime: exam || '09:15 AM',
        priorityTier: exam ? 'high_exam' : 'standard', hasBoardExamToday: Boolean(exam), examinationStatus: exam ? 'scheduled' : 'none', examinationStartTime: exam || undefined,
        demandSource: 'simulated', status: 'pending', pickupPoint: village?.landmark || 'Village main stop', contactNumber: 'Demo record', travelDate: '2026-11-13',
      };
    });
    const allStudents = [...input.students.map((student) => {
      const legacy = getExamTime(student, baselineStudents);
      return legacy && !student.examinationStartTime ? { ...student, examinationStartTime: legacy, examinationStatus: 'scheduled' as const } : student;
    }), ...addedStudents];

    const affectedRoadIds = [FLOOD_ROAD_ID];
    const affectedBusSet = new Set(affectedBusIds);
    const affectedByBusOrFlood = allStudents.filter((student) => {
      const assignedBus = input.buses.find((bus) => bus.id === student.assignedBusId);
      return Boolean(student.assignedBusId && affectedBusSet.has(student.assignedBusId)) || Boolean(assignedBus && routeUsesBlockedRoad(assignedBus, roads));
    });
    const queuedStudents = allStudents.filter((student) => !student.assignedBusId && !student.assignedAlternativeId && ['waitlisted', 'pending'].includes(student.status));
    const planStudents = [...new Map([...affectedByBusOrFlood, ...queuedStudents, ...addedStudents].map((student) => [student.id, student])).values()];
    const startMinutes = AllocationEngine.parseTimeToMinutes(SIMULATION_START);

    const getCandidates = (student: Student): Candidate[] => {
      const route = router.findShortestPath(student.villageId, student.institutionId);
      if (!route) return [];
      const compatibleBuses = buses.filter((bus) => bus.status === 'active' && bus.occupiedSeats < bus.totalCapacity && AllocationEngine.isBusRouteCompatible(bus, student.villageId, student.institutionId) && !routeUsesBlockedRoad(bus, roads));
      const candidates: Candidate[] = compatibleBuses.map((bus) => {
        const leave = Math.max(startMinutes, AllocationEngine.parseTimeToMinutes(bus.departureTime));
        const eta = addMinutes(SIMULATION_START, Math.max(0, leave - startMinutes) + route.totalMinutes);
        const statedEta = AllocationEngine.parseTimeToMinutes(bus.estimatedArrivalTime);
        const estimated = AllocationEngine.parseTimeToMinutes(eta) < statedEta ? bus.estimatedArrivalTime : eta;
        return { vehicleId: bus.id, vehicleLabel: bus.busNumber, kind: 'bus', arrival: estimated, path: route.path, distance: route.totalDistance, minutes: AllocationEngine.parseTimeToMinutes(estimated) - startMinutes, seatCount: bus.totalCapacity - bus.occupiedSeats };
      });
      alternatives.filter((alt) => alt.status === 'active' && alt.isVerified && alt.availableSeats > 0 && alt.operatingVillages.includes(student.villageId) && alt.destinationInstitutions.includes(student.institutionId)).forEach((alt) => {
        const estimated = addMinutes(SIMULATION_START, route.totalMinutes + 10);
        candidates.push({ vehicleId: alt.id, vehicleLabel: `${alt.name} · ${alt.vehicleNumber}`, kind: 'alternative', arrival: estimated, path: route.path, distance: route.totalDistance, minutes: route.totalMinutes + 10, seatCount: alt.availableSeats });
      });
      return candidates;
    };

    const earliest = new Map<string, Candidate | undefined>();
    planStudents.forEach((student) => earliest.set(student.id, getCandidates(student).sort((a, b) => AllocationEngine.parseTimeToMinutes(a.arrival) - AllocationEngine.parseTimeToMinutes(b.arrival))[0]));
    const priorities = new Map<string, { category: EmergencyPriorityCategory; reason: string; onTime: boolean }>();
    planStudents.forEach((student) => {
      const exam = isExamStudent(student) ? student.examinationStartTime : undefined;
      const candidate = earliest.get(student.id);
      if (!exam) { priorities.set(student.id, { category: 'normal', reason: 'No examination is scheduled in this simulation.', onTime: true }); return; }
      const untilExam = AllocationEngine.parseTimeToMinutes(exam) - startMinutes;
      const arrival = candidate ? AllocationEngine.parseTimeToMinutes(candidate.arrival) : Infinity;
      const slack = AllocationEngine.parseTimeToMinutes(exam) - arrival;
      const onTime = slack >= 0;
      const category: EmergencyPriorityCategory = untilExam <= 60 || (candidate !== undefined && slack <= 30) ? 'critical' : untilExam <= 120 ? 'high' : 'normal';
      const reason = !candidate ? `Exam at ${exam}; no open compatible vehicle or flood-safe route is available.` : !onTime ? `Exam at ${exam}; earliest demo arrival is ${candidate.arrival}, after the exam begins.` : category === 'critical' ? `Critical: exam at ${exam}; only ${slack} min of estimated arrival buffer remains.` : category === 'high' ? `High: exam at ${exam} is within the two-hour response window; estimated arrival ${candidate.arrival}.` : `Normal: exam at ${exam} is outside the two-hour response window.`;
      priorities.set(student.id, { category, reason, onTime });
    });
    const rank = { critical: 0, high: 1, normal: 2 };
    planStudents.sort((a, b) => {
      const pa = priorities.get(a.id)!; const pb = priorities.get(b.id)!;
      if (pa.onTime !== pb.onTime && isExamStudent(a) && isExamStudent(b)) return pa.onTime ? -1 : 1;
      if (rank[pa.category] !== rank[pb.category]) return rank[pa.category] - rank[pb.category];
      const examA = a.examinationStartTime ? AllocationEngine.parseTimeToMinutes(a.examinationStartTime) : Infinity;
      const examB = b.examinationStartTime ? AllocationEngine.parseTimeToMinutes(b.examinationStartTime) : Infinity;
      return examA - examB || a.id.localeCompare(b.id);
    });

    const studentById = new Map(allStudents.map((student) => [student.id, { ...student }]));
    const requestByStudent = new Map(input.requests.map((request) => [request.studentId, { ...request }]));
    const outcomes: EmergencyStudentOutcome[] = [];
    const routes = new Map<string, EmergencyRunReport['routeRecommendations'][number]>();
    for (const student of planStudents) {
      const current = studentById.get(student.id)!;
      const originalBus = input.buses.find((bus) => bus.id === student.assignedBusId);
      const originalAlt = input.alternatives.find((alt) => alt.id === student.assignedAlternativeId);
      const originalVehicle = originalBus?.busNumber || originalAlt?.vehicleNumber;
      current.assignedBusId = undefined; current.assignedAlternativeId = undefined;
      const candidates = getCandidates(current).sort((a, b) => {
        const pa = priorities.get(student.id)!;
        const target = current.examinationStartTime ? Math.min(AllocationEngine.parseTimeToMinutes(current.requiredArrivalTime), AllocationEngine.parseTimeToMinutes(current.examinationStartTime)) : AllocationEngine.parseTimeToMinutes(current.requiredArrivalTime);
        const aOnTime = AllocationEngine.parseTimeToMinutes(a.arrival) <= target;
        const bOnTime = AllocationEngine.parseTimeToMinutes(b.arrival) <= target;
        return Number(bOnTime) - Number(aOnTime) || Math.abs(target - AllocationEngine.parseTimeToMinutes(a.arrival)) - Math.abs(target - AllocationEngine.parseTimeToMinutes(b.arrival)) || a.distance - b.distance || a.vehicleId.localeCompare(b.vehicleId);
      });
      const deadline = current.examinationStartTime ? Math.min(AllocationEngine.parseTimeToMinutes(current.requiredArrivalTime), AllocationEngine.parseTimeToMinutes(current.examinationStartTime)) : AllocationEngine.parseTimeToMinutes(current.requiredArrivalTime);
      const candidate = candidates.find((item) => item.seatCount > 0 && AllocationEngine.parseTimeToMinutes(item.arrival) <= deadline);
      const estimate = candidates[0];
      const onTimeForExam = !current.examinationStartTime || Boolean(candidate && AllocationEngine.parseTimeToMinutes(candidate.arrival) <= AllocationEngine.parseTimeToMinutes(current.examinationStartTime));
      let status: EmergencyStudentOutcome['status']; let explanation: string; let assignedVehicle: string | undefined;
      if (candidate) {
        if (candidate.kind === 'bus') {
          const bus = buses.find((item) => item.id === candidate.vehicleId)!; bus.occupiedSeats += 1; current.assignedBusId = bus.id;
        } else {
          const alt = alternatives.find((item) => item.id === candidate.vehicleId)!; alt.availableSeats = Math.max(0, alt.availableSeats - 1); current.assignedAlternativeId = alt.id;
        }
        status = originalVehicle ? 'reassigned' : 'confirmed'; current.status = status === 'reassigned' ? 'reassigned' : 'confirmed'; assignedVehicle = candidate.vehicleLabel;
        explanation = `Assigned to ${candidate.vehicleLabel}; compatible route, open seat, and demo arrival ${candidate.arrival} meet the required arrival${current.examinationStartTime ? ` and exam at ${current.examinationStartTime}` : ''}.`;
      } else {
        status = current.examinationStartTime && !onTimeForExam ? 'at_risk' : 'waitlisted'; current.status = 'waitlisted';
        explanation = estimate ? `No open compatible seat can meet the deadline. Earliest available demo estimate is ${estimate.arrival}.` : 'No flood-safe route and open compatible vehicle are available in the demo network.';
      }
      studentById.set(current.id, current);
      const examTime = current.examinationStartTime;
      const priority = priorities.get(current.id)!;
      outcomes.push({ studentId: current.id, studentName: current.name, examinationStartTime: examTime, priority: priority.category, priorityReason: priority.reason, status, originalVehicle, assignedVehicle, estimatedArrivalTime: candidate?.arrival || estimate?.arrival, routePath: candidate?.path || estimate?.path, explanation });
      if (candidate || estimate) routes.set(current.id, { studentId: current.id, fromNodeId: current.villageId, toNodeId: current.institutionId, originalPath: router.findShortestPath(current.villageId, current.institutionId, true)?.path || [], alternativePath: (candidate || estimate)!.path, distanceKm: (candidate || estimate)!.distance, travelMinutes: (candidate || estimate)!.minutes, estimatedArrivalTime: (candidate || estimate)!.arrival, feasible: Boolean(candidate), explanation: candidate ? 'Flood-safe Dijkstra path; vehicle and seat checks passed.' : 'A route exists, but available seat or exam-time constraints prevent confirmation.' });
      const request: TransportationRequest = requestByStudent.get(current.id) || {
        id: `req_${current.id}`, studentId: current.id, studentName: current.name, villageId: current.villageId,
        villageName: villages.find((v) => v.id === current.villageId)?.name || current.villageId, institutionId: current.institutionId,
        institutionName: institutions.find((i) => i.id === current.institutionId)?.name || current.institutionId,
        requestedDepartureTime: SIMULATION_START, requiredArrivalTime: current.requiredArrivalTime, travelDate: current.travelDate,
        priorityScore: priority.category === 'critical' ? 100 : priority.category === 'high' ? 70 : 40, priorityTier: current.priorityTier,
        status: 'pending', pickupLocation: current.pickupPoint, allocationReason: '', createdAt: input.activatedAt || new Date().toISOString(),
      };
      request.status = current.status; request.assignedVehicleId = candidate?.vehicleId; request.assignedVehicleNumber = candidate?.vehicleLabel;
      request.assignedVehicleType = candidate?.kind === 'bus' ? 'Bus' : candidate ? 'Verified alternative' : undefined;
      request.allocationReason = `${priority.reason} ${explanation}`; request.demandSource = current.demandSource || 'registered'; requestByStudent.set(current.id, request);
    }

    const plannedIds = new Set(planStudents.map((student) => student.id));
    for (const student of allStudents) {
      if (plannedIds.has(student.id)) continue;
      const current = studentById.get(student.id)!;
      const route = router.findShortestPath(current.villageId, current.institutionId);
      const assignedBus = buses.find((bus) => bus.id === current.assignedBusId);
      const assignedAlt = alternatives.find((alt) => alt.id === current.assignedAlternativeId);
      const arrival = assignedBus?.estimatedArrivalTime || (route ? addMinutes(SIMULATION_START, route.totalMinutes + (assignedAlt ? 10 : 0)) : undefined);
      const exam = isExamStudent(current) ? current.examinationStartTime : undefined;
      const slack = exam && arrival ? AllocationEngine.parseTimeToMinutes(exam) - AllocationEngine.parseTimeToMinutes(arrival) : Infinity;
      const untilExam = exam ? AllocationEngine.parseTimeToMinutes(exam) - startMinutes : Infinity;
      const category: EmergencyPriorityCategory = !exam ? 'normal' : untilExam <= 60 || slack <= 30 ? 'critical' : untilExam <= 120 ? 'high' : 'normal';
      const priorityReason = !exam ? 'No examination is scheduled in this simulation.' : `Exam at ${exam}; current allocation estimates arrival at ${arrival || 'unknown'}${slack < 0 ? ', after the exam begins' : ` with ${slack} min buffer`}.`;
      const hasSeat = Boolean(assignedBus || assignedAlt);
      const onTime = !exam || (hasSeat && Boolean(arrival) && slack >= 0);
      const status: EmergencyStudentOutcome['status'] = !hasSeat ? current.status === 'waitlisted' ? 'waitlisted' : 'at_risk' : current.status === 'reassigned' ? 'reassigned' : 'confirmed';
      const vehicle = assignedBus?.busNumber || (assignedAlt ? `${assignedAlt.name} · ${assignedAlt.vehicleNumber}` : undefined);
      outcomes.push({ studentId: current.id, studentName: current.name, examinationStartTime: exam, priority: category, priorityReason, status, assignedVehicle: vehicle, estimatedArrivalTime: arrival, routePath: route?.path, explanation: hasSeat ? `Existing allocation retained on ${vehicle}; it was not assigned to a failed bus or the flooded road segment.` : 'No confirmed vehicle is currently assigned.' });
      if (route) routes.set(current.id, { studentId: current.id, fromNodeId: current.villageId, toNodeId: current.institutionId, originalPath: router.findShortestPath(current.villageId, current.institutionId, true)?.path || [], alternativePath: route.path, distanceKm: route.totalDistance, travelMinutes: route.totalMinutes, estimatedArrivalTime: arrival || addMinutes(SIMULATION_START, route.totalMinutes), feasible: onTime, explanation: `Current assigned service route rechecked against the flood closure${onTime ? '' : '; exam deadline remains at risk'}.` });
    }

    const results = [...studentById.values()];
    const examOutcomes = outcomes.filter((outcome) => outcome.examinationStartTime);
    const examsAllocatedOnTime = examOutcomes.filter((outcome) => ['confirmed', 'reassigned'].includes(outcome.status) && outcome.estimatedArrivalTime && AllocationEngine.parseTimeToMinutes(outcome.estimatedArrivalTime) <= AllocationEngine.parseTimeToMinutes(outcome.examinationStartTime!)).length;
    const examsAtRisk = examOutcomes.length - examsAllocatedOnTime;
    const event: DisruptionEvent = { id: 'disrupt_exam_day_crisis', timestamp: input.activatedAt || new Date().toISOString(), type: 'exam_day_crisis', title: 'Exam Day Crisis Activated', description: `Two government buses unavailable; demand increased by 40%; flood closure applied to Harugeri–Mugalkhod corridor. ${planStudents.length} students evaluated for reallocation.`, severity: 'critical', affectedBusId: affectedBusIds[0], affectedRoadId: FLOOD_ROAD_ID, affectedStudentIds: planStudents.map((student) => student.id), reassignedStudentIds: outcomes.filter((outcome) => outcome.status === 'reassigned' && planStudents.some((student) => student.id === outcome.studentId)).map((outcome) => outcome.studentId), waitlistedStudentIds: outcomes.filter((outcome) => ['waitlisted', 'at_risk'].includes(outcome.status)).map((outcome) => outcome.studentId), status: 'active' };
    const report: EmergencyRunReport = {
      activatedAt: event.timestamp, simulationStartTime: SIMULATION_START, demandBefore, demandAfter, simulatedRequests: surgeCount,
      allocatedBefore: input.students.filter((student) => ['confirmed', 'reassigned'].includes(student.status)).length,
      allocatedAfter: results.filter((student) => ['confirmed', 'reassigned'].includes(student.status)).length,
      affectedBusIds, affectedStudentIds: planStudents.map((student) => student.id), examStudentCount: examOutcomes.length, examsAllocatedOnTime,
      examsAtRisk, otherStudentsAllocated: outcomes.filter((outcome) => !outcome.examinationStartTime && ['confirmed', 'reassigned'].includes(outcome.status)).length,
      studentsReassigned: outcomes.filter((outcome) => outcome.status === 'reassigned').length, studentsWaiting: outcomes.filter((outcome) => ['waitlisted', 'at_risk'].includes(outcome.status)).length,
      availableBusCount: buses.filter((bus) => bus.status === 'active').length, unavailableBusCount: buses.filter((bus) => bus.status === 'breakdown').length,
      availableSeats: buses.filter((bus) => bus.status === 'active').reduce((sum, bus) => sum + Math.max(0, bus.totalCapacity - bus.occupiedSeats), 0) + alternatives.reduce((sum, alt) => sum + Math.max(0, alt.availableSeats), 0),
      affectedRoadIds, routeRecommendations: [...routes.values()], outcomes,
    };
    const notification: SystemNotification = { id: 'notif_exam_day_crisis', timestamp: event.timestamp, title: 'Exam Day Crisis response complete', message: `${examsAllocatedOnTime} of ${examOutcomes.length} examination students are allocated to arrive on time. ${report.studentsWaiting} students remain at risk or waiting. Demo-only routes and ETAs.`, type: examsAtRisk ? 'warning' : 'success', targetRole: 'all', read: false, linkAction: 'simulator' };
    return { buses, alternatives, roads, students: results, requests: [...requestByStudent.values()], report, event, notifications: [notification] };
  }
}
