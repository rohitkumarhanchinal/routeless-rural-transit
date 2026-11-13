import {
  Bus,
  AlternativeProvider,
  Student,
  TransportationRequest,
  DisruptionEvent,
  RoadSegment,
  Village,
  Institution,
  SystemNotification,
} from '../types';
import { AllocationEngine } from './allocationEngine';
import { GraphRouter } from './graphRouter';

export interface DisruptionSimulationResult {
  disruptionEvent: DisruptionEvent;
  updatedBuses: Bus[];
  updatedAlternatives: AlternativeProvider[];
  updatedStudents: Student[];
  updatedRequests: TransportationRequest[];
  updatedRoads: RoadSegment[];
  notifications: SystemNotification[];
  impactReport: {
    affectedStudentCount: number;
    successfullyReassignedCount: number;
    waitlistedCount: number;
    reassignedDetails: Array<{
      studentName: string;
      fromVehicle: string;
      toVehicle: string;
      status: string;
      reason: string;
    }>;
    capacityDeltaSummary: string;
  };
}

export class DisruptionEngine {
  // 1. Simulate Bus Breakdown
  public static simulateBusBreakdown(
    targetBusId: string,
    currentBuses: Bus[],
    currentAlternatives: AlternativeProvider[],
    currentStudents: Student[],
    currentRequests: TransportationRequest[],
    currentRoads: RoadSegment[],
    villages: Village[],
    institutions: Institution[]
  ): DisruptionSimulationResult {
    const targetBus = currentBuses.find((b) => b.id === targetBusId);
    if (!targetBus) {
      throw new Error(`Bus ${targetBusId} not found`);
    }

    // 1. Mark target bus as breakdown and zero out its active occupied status
    const updatedBuses = currentBuses.map((b) => {
      if (b.id === targetBusId) {
        return { ...b, status: 'breakdown' as const };
      }
      return { ...b };
    });

    const updatedAlternatives = currentAlternatives.map((alt) => ({ ...alt }));

    // 2. Identify all students assigned to this broken bus
    const affectedStudents = currentStudents.filter((s) => s.assignedBusId === targetBusId);
    const affectedStudentIds = affectedStudents.map((s) => s.id);

    // Sort affected students by priority so most critical students (board exam, girls remote safety) get reassigned first!
    const prioritizedAffectedStudents = [...affectedStudents].sort((a, b) => {
      const scoreA = AllocationEngine.calculatePriorityScore(a, villages.find((v) => v.id === a.villageId));
      const scoreB = AllocationEngine.calculatePriorityScore(b, villages.find((v) => v.id === b.villageId));
      return scoreB - scoreA;
    });

    const reassignedDetails: DisruptionSimulationResult['impactReport']['reassignedDetails'] = [];
    const reassignedStudentIds: string[] = [];
    const waitlistedStudentIds: string[] = [];

    // Map of updated students
    const studentMap = new Map<string, Student>();
    currentStudents.forEach((s) => studentMap.set(s.id, { ...s }));

    // Request map
    const requestMap = new Map<string, TransportationRequest>();
    currentRequests.forEach((r) => requestMap.set(r.studentId, { ...r }));

    // 3. Cascading Reallocation: Reassign each affected student
    for (const student of prioritizedAffectedStudents) {
      // Clear previous assignment
      const studentCopy: Student = {
        ...student,
        assignedBusId: undefined,
        assignedAlternativeId: undefined,
        status: 'pending',
      };

      const decision = AllocationEngine.allocateStudent(
        studentCopy,
        updatedBuses,
        updatedAlternatives,
        villages
      );

      if (decision.status === 'confirmed') {
        if (decision.assignedBus) {
          // Reassigned to another public bus!
          const busIndex = updatedBuses.findIndex((b) => b.id === decision.assignedBus!.id);
          if (busIndex !== -1) {
            updatedBuses[busIndex].occupiedSeats += 1;
          }

          studentCopy.status = 'reassigned';
          studentCopy.assignedBusId = decision.assignedBus.id;
          reassignedStudentIds.push(student.id);

          reassignedDetails.push({
            studentName: student.name,
            fromVehicle: `${targetBus.busNumber} (${targetBus.operatorName})`,
            toVehicle: `${decision.assignedBus.busNumber} (${decision.assignedBus.operatorName})`,
            status: 'Reassigned to Alternate Bus',
            reason: decision.reason,
          });

          // Update request record
          const req = requestMap.get(student.id);
          if (req) {
            req.status = 'reassigned';
            req.assignedVehicleId = decision.assignedBus.id;
            req.assignedVehicleNumber = decision.assignedBus.busNumber;
            req.assignedVehicleType = decision.assignedBus.operatorName;
            req.allocationReason = `EMERGENCY REASSIGNMENT: Previous bus ${targetBus.busNumber} broke down. Reassigned to ${decision.assignedBus.busNumber}.`;
          }
        } else if (decision.assignedAlternative) {
          // Reassigned to verified alternative transport provider (e.g. Panchayat Feeder)
          const altIndex = updatedAlternatives.findIndex((a) => a.id === decision.assignedAlternative!.id);
          if (altIndex !== -1) {
            updatedAlternatives[altIndex].availableSeats -= 1;
          }

          studentCopy.status = 'reassigned';
          studentCopy.assignedAlternativeId = decision.assignedAlternative.id;
          reassignedStudentIds.push(student.id);

          reassignedDetails.push({
            studentName: student.name,
            fromVehicle: `${targetBus.busNumber} (${targetBus.operatorName})`,
            toVehicle: `${decision.assignedAlternative.name} (${decision.assignedAlternative.vehicleNumber})`,
            status: 'Routed to Verified Alternative Provider',
            reason: decision.reason,
          });

          const req = requestMap.get(student.id);
          if (req) {
            req.status = 'reassigned';
            req.assignedVehicleId = decision.assignedAlternative.id;
            req.assignedVehicleNumber = decision.assignedAlternative.vehicleNumber;
            req.assignedVehicleType = decision.assignedAlternative.name;
            req.allocationReason = `EMERGENCY REASSIGNMENT: Dispatched via verified alternative ${decision.assignedAlternative.name}.`;
          }
        }
      } else {
        // Move to waitlist
        studentCopy.status = 'waitlisted';
        waitlistedStudentIds.push(student.id);

        reassignedDetails.push({
          studentName: student.name,
          fromVehicle: `${targetBus.busNumber} (${targetBus.operatorName})`,
          toVehicle: 'Waitlist / On-Demand Request',
          status: 'Waitlisted (No Open Seats)',
          reason: decision.reason,
        });

        const req = requestMap.get(student.id);
        if (req) {
          req.status = 'waitlisted';
          req.assignedVehicleId = undefined;
          req.assignedVehicleNumber = undefined;
          req.allocationReason = `WAITLISTED: Bus ${targetBus.busNumber} broke down and all alternative seats are exhausted. Standby emergency request logged.`;
        }
      }

      studentMap.set(student.id, studentCopy);
    }

    // 4. Create Disruption Event Record
    const disruptionEvent: DisruptionEvent = {
      id: `disrupt_breakdown_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'bus_breakdown',
      title: `Bus Breakdown: ${targetBus.operatorName} (${targetBus.busNumber})`,
      description: `Bus ${targetBus.busNumber} reported an engine/transmission breakdown near ${targetBus.currentStopId}. ${affectedStudents.length} rural students affected. AI reallocation activated.`,
      severity: 'critical',
      affectedBusId: targetBusId,
      affectedStudentIds,
      reassignedStudentIds,
      waitlistedStudentIds,
      status: 'active',
    };

    // 5. System Notifications
    const notifications: SystemNotification[] = [
      {
        id: `notif_${Date.now()}_1`,
        timestamp: new Date().toISOString(),
        title: `🚨 Emergency: Bus ${targetBus.busNumber} Breakdown`,
        message: `${affectedStudents.length} students affected. ${reassignedStudentIds.length} successfully reassigned; ${waitlistedStudentIds.length} placed on emergency waitlist.`,
        type: 'danger',
        targetRole: 'all',
        read: false,
      },
      {
        id: `notif_${Date.now()}_2`,
        timestamp: new Date().toISOString(),
        title: `⚡ AI Reallocation Complete`,
        message: `Verified alternative providers automatically engaged to absorb displaced rural students.`,
        type: 'warning',
        targetRole: 'operator',
        read: false,
      },
    ];

    return {
      disruptionEvent,
      updatedBuses,
      updatedAlternatives,
      updatedStudents: Array.from(studentMap.values()),
      updatedRequests: Array.from(requestMap.values()),
      updatedRoads: currentRoads,
      notifications,
      impactReport: {
        affectedStudentCount: affectedStudents.length,
        successfullyReassignedCount: reassignedStudentIds.length,
        waitlistedCount: waitlistedStudentIds.length,
        reassignedDetails,
        capacityDeltaSummary: `Fleet capacity reduced by ${targetBus.totalCapacity} seats. ${reassignedStudentIds.length}/${affectedStudents.length} (${Math.round((reassignedStudentIds.length / (affectedStudents.length || 1)) * 100)}%) students safely accommodated.`,
      },
    };
  }

  // 2. Simulate Road Closure
  public static simulateRoadClosure(
    roadSegmentId: string,
    closureReason: string,
    currentRoads: RoadSegment[],
    currentBuses: Bus[],
    villages: Village[],
    institutions: Institution[]
  ): {
    updatedRoads: RoadSegment[];
    updatedBuses: Bus[];
    disruptionEvent: DisruptionEvent;
    notifications: SystemNotification[];
    impactDetails: Array<{ busNumber: string; originalMins: number; detourMins: number; detourKm: number; newPathNames: string[] }>;
  } {
    const updatedRoads = currentRoads.map((r) => {
      if (r.id === roadSegmentId) {
        return {
          ...r,
          isDisrupted: true,
          disruptionReason: closureReason,
          condition: 'flooded' as const,
        };
      }
      return r;
    });

    const router = new GraphRouter(villages, institutions, updatedRoads);
    const impactDetails: Array<{ busNumber: string; originalMins: number; detourMins: number; detourKm: number; newPathNames: string[] }> = [];

    // Check which buses are impacted
    const updatedBuses = currentBuses.map((bus) => {
      // Check if bus stops traverse this road
      const busStops = bus.stops;
      let busImpacted = false;

      for (let i = 0; i < busStops.length - 1; i++) {
        const u = busStops[i];
        const v = busStops[i + 1];
        const opt = router.optimizeRoute(u, v);
        if (opt.hasDisruption) {
          busImpacted = true;
          impactDetails.push({
            busNumber: bus.busNumber,
            originalMins: opt.originalMinutes,
            detourMins: opt.detourMinutes ?? 0,
            detourKm: opt.detourDistanceKm ?? 0,
            newPathNames: (opt.alternativePath ?? []).map((nid) => router.getNodeName(nid)),
          });
          break;
        }
      }

      if (busImpacted) {
        return {
          ...bus,
          status: 'delayed' as const,
        };
      }
      return bus;
    });

    const disruptionEvent: DisruptionEvent = {
      id: `disrupt_road_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'road_closure',
      title: `Road Closure: ${closureReason}`,
      description: `Road segment ${roadSegmentId} blocked. Rerouting via alternative graph corridors. Travel time increased by ~15-25 mins.`,
      severity: 'high',
      affectedRoadId: roadSegmentId,
      affectedStudentIds: [],
      reassignedStudentIds: [],
      waitlistedStudentIds: [],
      status: 'active',
    };

    const notifications: SystemNotification[] = [
      {
        id: `notif_road_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: `🚧 Road Closure Alert: ${closureReason}`,
        message: `Graph optimizer computed bypass detours for affected rural transit corridors.`,
        type: 'warning',
        targetRole: 'all',
        read: false,
      },
    ];

    return {
      updatedRoads,
      updatedBuses,
      disruptionEvent,
      notifications,
      impactDetails,
    };
  }

  // 3. Simulate Sudden Student Demand Surge (Exam Season Rush)
  public static simulateDemandSurge(
    currentStudents: Student[],
    currentRequests: TransportationRequest[],
    currentBuses: Bus[],
    currentAlternatives: AlternativeProvider[],
    villages: Village[],
    institutions: Institution[]
  ): {
    newStudents: Student[];
    newRequests: TransportationRequest[];
    updatedBuses: Bus[];
    updatedAlternatives: AlternativeProvider[];
    notifications: SystemNotification[];
  } {
    const surgeNames = [
      { name: 'Ganesh Shinde', kannada: 'ಗಣೇಶ್ ಶಿಂಧೆ', gender: 'male' as const, village: 'v_harugeri', inst: 'inst_govt_polytechnic', exam: true },
      { name: 'Sunita Kuruba', kannada: 'ಸುನೀತಾ ಕುರುಬ', gender: 'female' as const, village: 'v_mugalkhod', inst: 'inst_govt_polytechnic', exam: true },
      { name: 'Karthik Patil', kannada: 'ಕಾರ್ತಿಕ್ ಪಾಟೀಲ', gender: 'male' as const, village: 'v_raybag_west', inst: 'inst_rural_degree', exam: false },
      { name: 'Rani Kamble', kannada: 'ರಾಣಿ ಕಾಂಬ್ಳೆ', gender: 'female' as const, village: 'v_harugeri', inst: 'inst_govt_polytechnic', exam: true },
      { name: 'Shankar Nayak', kannada: 'ಶಂಕರ್ ನಾಯಕ್', gender: 'male' as const, village: 'v_borgaon', inst: 'inst_govt_polytechnic', exam: false },
      { name: 'Aishwarya Kulkarni', kannada: 'ಐಶ್ವರ್ಯಾ ಕುಲಕರ್ಣಿ', gender: 'female' as const, village: 'v_hukkeri_cross', inst: 'inst_rural_degree', exam: true },
      { name: 'Praveen Goudar', kannada: 'ಪ್ರವೀಣ್ ಗೌಡರ್', gender: 'male' as const, village: 'v_ghataprabha', inst: 'inst_rural_degree', exam: false },
      { name: 'Laxmi Pujari', kannada: 'ಲಕ್ಷ್ಮೀ ಪೂಜಾರಿ', gender: 'female' as const, village: 'v_harugeri', inst: 'inst_govt_polytechnic', exam: true },
    ];

    const updatedBuses = currentBuses.map((b) => ({ ...b }));
    const updatedAlternatives = currentAlternatives.map((a) => ({ ...a }));
    const newStudents: Student[] = [];
    const newRequests: TransportationRequest[] = [];

    surgeNames.forEach((item, idx) => {
      const studentId = `std_surge_${Date.now()}_${idx}`;
      const student: Student = {
        id: studentId,
        name: item.name,
        kannadaName: item.kannada,
        rollNumber: `SURGE-${2024}-${100 + idx}`,
        villageId: item.village,
        institutionId: item.inst,
        course: 'General Polytechnic & Science Exam',
        yearOfStudy: 'Final Year',
        gender: item.gender,
        requiredArrivalTime: '08:45 AM',
        priorityTier: item.exam ? 'high_exam' : item.gender === 'female' ? 'medical_girl_safety' : 'standard',
        hasBoardExamToday: item.exam,
        status: 'pending',
        pickupPoint: villages.find((v) => v.id === item.village)?.landmark || 'Main Bus Stop',
        contactNumber: `+91 98450 ${Math.floor(10000 + Math.random() * 90000)}`,
        travelDate: '2026-11-13',
      };

      const decision = AllocationEngine.allocateStudent(student, updatedBuses, updatedAlternatives, villages);

      student.status = decision.status;
      if (decision.status === 'confirmed') {
        if (decision.assignedBus) {
          student.assignedBusId = decision.assignedBus.id;
          const bIdx = updatedBuses.findIndex((b) => b.id === decision.assignedBus!.id);
          if (bIdx !== -1) updatedBuses[bIdx].occupiedSeats += 1;
        } else if (decision.assignedAlternative) {
          student.assignedAlternativeId = decision.assignedAlternative.id;
          const aIdx = updatedAlternatives.findIndex((a) => a.id === decision.assignedAlternative!.id);
          if (aIdx !== -1) updatedAlternatives[aIdx].availableSeats -= 1;
        }
      }

      newStudents.push(student);

      const req: TransportationRequest = {
        id: `req_surge_${Date.now()}_${idx}`,
        studentId: student.id,
        studentName: student.name,
        villageId: student.villageId,
        villageName: villages.find((v) => v.id === student.villageId)?.name ?? student.villageId,
        institutionId: student.institutionId,
        institutionName: institutions.find((i) => i.id === student.institutionId)?.name ?? student.institutionId,
        requestedDepartureTime: '07:30 AM',
        requiredArrivalTime: '08:45 AM',
        travelDate: '2026-11-13',
        priorityScore: decision.score,
        priorityTier: student.priorityTier,
        status: decision.status,
        assignedVehicleId: decision.assignedBus?.id || decision.assignedAlternative?.id,
        assignedVehicleNumber: decision.assignedBus?.busNumber || decision.assignedAlternative?.vehicleNumber,
        assignedVehicleType: decision.assignedBus?.operatorName || decision.assignedAlternative?.name,
        pickupLocation: student.pickupPoint,
        allocationReason: decision.reason,
        scoreBreakdown: decision.scoreBreakdown,
        createdAt: new Date().toISOString(),
      };

      newRequests.push(req);
    });

    const notifications: SystemNotification[] = [
      {
        id: `notif_surge_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: `📈 Sudden Demand Surge (+${surgeNames.length} Students)`,
        message: `Board examination morning commuter surge simulated. Capacity stress detected across Harugeri-Chikkodi corridor.`,
        type: 'warning',
        targetRole: 'all',
        read: false,
      },
    ];

    return {
      newStudents,
      newRequests,
      updatedBuses,
      updatedAlternatives,
      notifications,
    };
  }

  // 4. Add Auxiliary Bus / Vehicle Online
  public static addAuxiliaryBus(
    newBusData: Omit<Bus, 'id' | 'occupiedSeats' | 'status'>,
    currentBuses: Bus[],
    currentStudents: Student[],
    currentRequests: TransportationRequest[],
    villages: Village[],
    institutions: Institution[]
  ): {
    updatedBuses: Bus[];
    updatedStudents: Student[];
    updatedRequests: TransportationRequest[];
    reassignedCount: number;
    notifications: SystemNotification[];
  } {
    const newBus: Bus = {
      ...newBusData,
      id: `bus_aux_${Date.now()}`,
      occupiedSeats: 0,
      status: 'active',
    };

    const updatedBuses = [...currentBuses, newBus];
    const studentMap = new Map<string, Student>();
    currentStudents.forEach((s) => studentMap.set(s.id, { ...s }));

    const requestMap = new Map<string, TransportationRequest>();
    currentRequests.forEach((r) => requestMap.set(r.studentId, { ...r }));

    // Find currently waitlisted students that can be accommodated by this new bus
    const waitlistedStudents = currentStudents
      .filter((s) => s.status === 'waitlisted')
      .sort((a, b) => {
        const vA = villages.find((v) => v.id === a.villageId);
        const vB = villages.find((v) => v.id === b.villageId);
        return AllocationEngine.calculatePriorityScore(b, vB) - AllocationEngine.calculatePriorityScore(a, vA);
      });

    let reassignedCount = 0;
    for (const student of waitlistedStudents) {
      if (newBus.occupiedSeats >= newBus.totalCapacity) break;

      const evalResult = AllocationEngine.evaluateBusCandidate(
        newBus,
        student,
        villages.find((v) => v.id === student.villageId)
      );

      if (evalResult.eligible) {
        newBus.occupiedSeats += 1;
        reassignedCount += 1;

        const updatedStudent = {
          ...student,
          status: 'confirmed' as const,
          assignedBusId: newBus.id,
        };
        studentMap.set(student.id, updatedStudent);

        const req = requestMap.get(student.id);
        if (req) {
          req.status = 'confirmed';
          req.assignedVehicleId = newBus.id;
          req.assignedVehicleNumber = newBus.busNumber;
          req.assignedVehicleType = newBus.operatorName;
          req.allocationReason = `Allocated via newly added auxiliary vehicle ${newBus.busNumber}. Cleared from waitlist.`;
        }
      }
    }

    const notifications: SystemNotification[] = [
      {
        id: `notif_aux_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: `🚌 Auxiliary Bus Added: ${newBus.busNumber}`,
        message: `Capacity expanded by ${newBus.totalCapacity} seats. ${reassignedCount} waitlisted students successfully allocated.`,
        type: 'success',
        targetRole: 'all',
        read: false,
      },
    ];

    return {
      updatedBuses,
      updatedStudents: Array.from(studentMap.values()),
      updatedRequests: Array.from(requestMap.values()),
      reassignedCount,
      notifications,
    };
  }
}
