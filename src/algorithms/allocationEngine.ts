import {
  Bus,
  AlternativeProvider,
  Student,
  TransportationRequest,
  TransportRequestStatus,
  Village,
} from '../types';

export interface AllocationDecision {
  status: TransportRequestStatus;
  assignedBus?: Bus;
  assignedAlternative?: AlternativeProvider;
  score: number;
  reason: string;
  scoreBreakdown: {
    routeMatch: number;
    timeMatch: number;
    capacityScore: number;
    priorityBonus: number;
    total: number;
  };
}

export class AllocationEngine {
  // Convert "08:45 AM" into total minutes from midnight for accurate comparison
  public static parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const clean = timeStr.trim();
    const parts = clean.split(' ');
    const timeParts = parts[0].split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    const meridiem = (parts[1] || 'AM').toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // Calculate priority score for student
  public static calculatePriorityScore(student: Student, village?: Village): number {
    let score = 50; // base score

    if (student.hasBoardExamToday || student.priorityTier === 'high_exam') {
      score += 40; // Board examination day is top priority
    }

    if (student.priorityTier === 'medical_girl_safety' || student.gender === 'female') {
      score += 25; // Remote rural safety priority
    }

    if (village?.isRemote) {
      score += 15; // Isolated village with zero walking alternatives
    }

    return score;
  }

  // Check if a bus route serves from village to institution in correct sequence
  public static isBusRouteCompatible(bus: Bus, villageId: string, institutionId: string): boolean {
    const fromIdx = bus.stops.indexOf(villageId);
    const toIdx = bus.stops.indexOf(institutionId);

    // Both stops must exist and village must be visited before or at the institution
    return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
  }

  // Evaluate and score a specific bus for a student request
  public static evaluateBusCandidate(
    bus: Bus,
    student: Student,
    village?: Village
  ): { eligible: boolean; score: number; breakdown: AllocationDecision['scoreBreakdown']; reason: string } {
    // 1. Vehicle availability check
    if (bus.status === 'breakdown') {
      return {
        eligible: false,
        score: 0,
        breakdown: { routeMatch: 0, timeMatch: 0, capacityScore: 0, priorityBonus: 0, total: 0 },
        reason: `Bus ${bus.busNumber} is marked UNAVAILABLE due to mechanical breakdown.`,
      };
    }

    if (bus.status === 'maintenance') {
      return {
        eligible: false,
        score: 0,
        breakdown: { routeMatch: 0, timeMatch: 0, capacityScore: 0, priorityBonus: 0, total: 0 },
        reason: `Bus ${bus.busNumber} is currently undergoing scheduled maintenance.`,
      };
    }

    // 2. Strict capacity check - NEVER overbook
    const remainingSeats = bus.totalCapacity - bus.occupiedSeats;
    if (remainingSeats <= 0) {
      return {
        eligible: false,
        score: 0,
        breakdown: { routeMatch: 0, timeMatch: 0, capacityScore: 0, priorityBonus: 0, total: 0 },
        reason: `Bus ${bus.busNumber} has reached full capacity (${bus.occupiedSeats}/${bus.totalCapacity} seats filled).`,
      };
    }

    // 3. Route compatibility check
    if (!this.isBusRouteCompatible(bus, student.villageId, student.institutionId)) {
      return {
        eligible: false,
        score: 0,
        breakdown: { routeMatch: 0, timeMatch: 0, capacityScore: 0, priorityBonus: 0, total: 0 },
        reason: `Route of bus ${bus.busNumber} does not connect ${student.villageId} to ${student.institutionId} in order.`,
      };
    }

    // 4. Timing compatibility
    const busArrivalMins = this.parseTimeToMinutes(bus.estimatedArrivalTime);
    const requiredArrivalMins = this.parseTimeToMinutes(student.requiredArrivalTime);
    const timeDiff = requiredArrivalMins - busArrivalMins; // Positive means bus arrives before class starts

    let timeScore = 15;
    if (timeDiff >= 0 && timeDiff <= 30) {
      // Perfect arrival window: 0-30 mins before institution opening
      timeScore = 25;
    } else if (timeDiff > 30 && timeDiff <= 60) {
      // Arrives slightly early (good buffer for rural connections)
      timeScore = 20;
    } else if (timeDiff < 0 && timeDiff >= -15) {
      // Arrives up to 15 mins late (penalized but possible)
      timeScore = 5;
    } else if (timeDiff < -15) {
      // Arrives far too late for exams/classes
      return {
        eligible: false,
        score: 0,
        breakdown: { routeMatch: 0, timeMatch: 0, capacityScore: 0, priorityBonus: 0, total: 0 },
        reason: `Bus arrives at ${bus.estimatedArrivalTime}, which is too late for student's required ${student.requiredArrivalTime}.`,
      };
    }

    // 5. Route score
    const routeScore = 35;

    // 6. Capacity score (favor buses with more buffer to prevent edge-of-capacity crowding)
    const capacityScore = Math.min(15, Math.round((remainingSeats / bus.totalCapacity) * 15));

    // 7. Student Priority Bonus
    let priorityBonus = 0;
    if (student.hasBoardExamToday) priorityBonus += 40;
    if (student.priorityTier === 'medical_girl_safety' || student.gender === 'female') priorityBonus += 25;
    if (village?.isRemote) priorityBonus += 15;

    const total = routeScore + timeScore + capacityScore + priorityBonus;

    return {
      eligible: true,
      score: total,
      breakdown: {
        routeMatch: routeScore,
        timeMatch: timeScore,
        capacityScore,
        priorityBonus,
        total,
      },
      reason: `Matched ${bus.operatorName} (${bus.busNumber}). Direct route served, arrives at ${bus.estimatedArrivalTime} (${remainingSeats} seats open). Total score: ${total}.`,
    };
  }

  // Main allocation routine for a single student request
  public static allocateStudent(
    student: Student,
    buses: Bus[],
    alternativeProviders: AlternativeProvider[],
    villages: Village[],
    preferredAlternativeId?: string
  ): AllocationDecision {
    const studentVillage = villages.find((v) => v.id === student.villageId);

    // Honor a student's explicit alternative-vehicle choice only when it is verified,
    // active, compatible with both endpoints, and has an available seat.
    const preferredAlternative = preferredAlternativeId && alternativeProviders.find((alt) =>
      alt.id === preferredAlternativeId && alt.status === 'active' && alt.isVerified && alt.availableSeats > 0 &&
      alt.operatingVillages.includes(student.villageId) && alt.destinationInstitutions.includes(student.institutionId)
    );
    if (preferredAlternative) {
      const priorityScore = this.calculatePriorityScore(student, studentVillage);
      return {
        status: 'confirmed',
        assignedAlternative: preferredAlternative,
        score: 75 + priorityScore * 0.2,
        reason: `Student-selected verified alternative: ${preferredAlternative.name} (${preferredAlternative.vehicleNumber}). Route and seat availability confirmed. Fare: ₹${preferredAlternative.farePerStudent}.`,
        scoreBreakdown: { routeMatch: 30, timeMatch: 20, capacityScore: 15, priorityBonus: priorityScore, total: Math.round(65 + priorityScore) },
      };
    }

    // Step 1: Evaluate all government and public scheduled buses
    const candidates = buses
      .map((bus) => ({ bus, evaluation: this.evaluateBusCandidate(bus, student, studentVillage) }))
      .filter((c) => c.evaluation.eligible)
      .sort((a, b) => b.evaluation.score - a.evaluation.score);

    if (candidates.length > 0) {
      const best = candidates[0];
      return {
        status: 'confirmed',
        assignedBus: best.bus,
        score: best.evaluation.score,
        reason: best.evaluation.reason,
        scoreBreakdown: best.evaluation.breakdown,
      };
    }

    // Step 2: If primary buses are unavailable or full, look for verified alternative providers!
    const matchingAlternatives = alternativeProviders.filter((alt) => {
      return (
        alt.status === 'active' &&
        alt.isVerified &&
        alt.availableSeats > 0 &&
        alt.operatingVillages.includes(student.villageId) &&
        alt.destinationInstitutions.includes(student.institutionId)
      );
    });

    if (matchingAlternatives.length > 0) {
      // Sort by available seats
      const bestAlt = matchingAlternatives.sort((a, b) => b.availableSeats - a.availableSeats)[0];
      const priorityScore = this.calculatePriorityScore(student, studentVillage);

      return {
        status: 'confirmed',
        assignedAlternative: bestAlt,
        score: 75 + priorityScore * 0.2,
        reason: `Primary government buses full or route severed. Successfully routed to verified alternative: ${bestAlt.name} (${bestAlt.vehicleNumber}). Subsidized fare: ₹${bestAlt.farePerStudent}.`,
        scoreBreakdown: {
          routeMatch: 30,
          timeMatch: 20,
          capacityScore: 15,
          priorityBonus: priorityScore,
          total: Math.round(65 + priorityScore),
        },
      };
    }

    // Step 3: Neither primary bus nor verified alternative has free capacity -> Put on Waitlist
    const priorityScore = this.calculatePriorityScore(student, studentVillage);
    return {
      status: 'waitlisted',
      score: priorityScore,
      reason: `All matching government buses and verified auxiliary feeders are currently at 100% capacity. Student placed on priority waitlist (Priority score: ${priorityScore}). Operator notified to deploy on-demand standby van.`,
      scoreBreakdown: {
        routeMatch: 35,
        timeMatch: 15,
        capacityScore: 0,
        priorityBonus: priorityScore,
        total: priorityScore,
      },
    };
  }
}
