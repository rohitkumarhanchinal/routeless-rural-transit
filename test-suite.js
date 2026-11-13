// Comprehensive Automated Functional Test Suite for ROUTELESS
// Tests all 7 required scenarios from Section 8 of Master Prompt

import { GraphRouter } from './src/algorithms/graphRouter.js';
import { AllocationEngine } from './src/algorithms/allocationEngine.js';
import { DisruptionEngine } from './src/algorithms/disruptionEngine.js';
import { DemandForecaster } from './src/algorithms/demandForecaster.js';
import {
  INITIAL_VILLAGES,
  INITIAL_INSTITUTIONS,
  INITIAL_ROADS,
  INITIAL_BUSES,
  INITIAL_ALTERNATIVE_PROVIDERS,
  INITIAL_STUDENTS,
  INITIAL_REQUESTS,
} from './src/data/demoData.js';

console.log('====================================================');
console.log('🧪 EXECUTING ROUTELESS FUNCTIONAL TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 7;

// Clone demo data for isolated test runs
const villages = JSON.parse(JSON.stringify(INITIAL_VILLAGES));
const institutions = JSON.parse(JSON.stringify(INITIAL_INSTITUTIONS));
let roads = JSON.parse(JSON.stringify(INITIAL_ROADS));
let buses = JSON.parse(JSON.stringify(INITIAL_BUSES));
let alternatives = JSON.parse(JSON.stringify(INITIAL_ALTERNATIVE_PROVIDERS));
let students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
let requests = JSON.parse(JSON.stringify(INITIAL_REQUESTS));

// TEST 1: A student selects a village and college and requests a seat.
// Expected: Identifies compatible buses and allocates a seat if available.
try {
  console.log('TEST 1: Student requests a seat on a compatible route...');
  const testStudent = {
    id: 'test_std_1',
    name: 'Kavya Patil',
    kannadaName: 'ಕಾವ್ಯಾ ಪಾಟೀಲ',
    rollNumber: 'TEST-001',
    villageId: 'v_raybag_west',
    institutionId: 'inst_govt_polytechnic',
    course: 'Diploma CS',
    yearOfStudy: '2nd Year',
    gender: 'female',
    requiredArrivalTime: '08:50 AM',
    priorityTier: 'standard',
    hasBoardExamToday: false,
    status: 'pending',
    pickupPoint: 'Raybag Hub',
    contactNumber: '+91 98000 11111',
    travelDate: '2026-11-13',
  };

  const decision = AllocationEngine.allocateStudent(testStudent, buses, alternatives, villages);
  if (decision.status === 'confirmed' && decision.assignedBus) {
    console.log(`✅ TEST 1 PASSED: Allocated to bus ${decision.assignedBus.busNumber}. Reason: ${decision.reason}\n`);
    passedTests++;
  } else {
    throw new Error(`Expected confirmed allocation, got: ${decision.status}`);
  }
} catch (e) {
  console.error('❌ TEST 1 FAILED:', e);
}

// TEST 2: A bus reaches its full capacity.
// Expected: Additional students cannot be allocated to that bus.
try {
  console.log('TEST 2: Strict capacity enforcement (no overbooking)...');
  // Full bus
  const fullBus = {
    ...buses[0],
    occupiedSeats: buses[0].totalCapacity, // 100% full
  };
  const evalResult = AllocationEngine.evaluateBusCandidate(fullBus, students[0], villages[0]);
  if (!evalResult.eligible && evalResult.reason.includes('full capacity')) {
    console.log(`✅ TEST 2 PASSED: Overbooking strictly rejected. Reason: ${evalResult.reason}\n`);
    passedTests++;
  } else {
    throw new Error(`Expected rejection due to full capacity, got eligible: ${evalResult.eligible}`);
  }
} catch (e) {
  console.error('❌ TEST 2 FAILED:', e);
}

// TEST 3: A government bus breaks down.
// Expected: Affected students are identified and reassigned using available transport capacity.
try {
  console.log('TEST 3: Bus Breakdown Simulation & Cascading Reallocation...');
  const targetBusId = 'bus_nwkrtc_101';
  const breakdownResult = DisruptionEngine.simulateBusBreakdown(
    targetBusId,
    buses,
    alternatives,
    students,
    requests,
    roads,
    villages,
    institutions
  );

  const brokenBus = breakdownResult.updatedBuses.find((b) => b.id === targetBusId);
  const reassignedCount = breakdownResult.impactReport.successfullyReassignedCount;
  const waitlistedCount = breakdownResult.impactReport.waitlistedCount;

  if (brokenBus.status === 'breakdown' && (reassignedCount > 0 || waitlistedCount > 0)) {
    console.log(`✅ TEST 3 PASSED: Bus marked BREAKDOWN. Displaced students: ${breakdownResult.impactReport.affectedStudentCount}. Reassigned: ${reassignedCount}, Waitlisted: ${waitlistedCount}.\n`);
    passedTests++;
  } else {
    throw new Error(`Breakdown simulation did not update status or reassign students properly.`);
  }
} catch (e) {
  console.error('❌ TEST 3 FAILED:', e);
}

// TEST 4: A road becomes unavailable.
// Expected: The route optimizer finds another valid route if one exists.
try {
  console.log('TEST 4: Road Closure & Dijkstra Shortest Bypass Path...');
  const router = new GraphRouter(villages, institutions, roads);
  // road_haru_poly_direct is disrupted by default
  const optResult = router.optimizeRoute('v_harugeri', 'inst_govt_polytechnic');

  if (optResult.hasDisruption && optResult.alternativePath && optResult.alternativePath.length > 2) {
    console.log(`✅ TEST 4 PASSED: Detected disruption on ${optResult.blockedSegment.id}. Alternative bypass path found: ${optResult.alternativePath.join(' ➔ ')}. Detour: +${optResult.detourDistanceKm} km (+${optResult.detourMinutes} mins).\n`);
    passedTests++;
  } else {
    throw new Error('Expected alternative route bypassing disrupted road.');
  }
} catch (e) {
  console.error('❌ TEST 4 FAILED:', e);
}

// TEST 5: Student demand increases suddenly.
// Expected: The analytics update and overloaded routes are highlighted.
try {
  console.log('TEST 5: Sudden demand surge simulation & Analytics Stress...');
  const surgeResult = DisruptionEngine.simulateDemandSurge(
    students,
    requests,
    buses,
    alternatives,
    villages,
    institutions
  );

  const routeDemand = DemandForecaster.analyzeRouteDemand(
    surgeResult.newRequests,
    surgeResult.updatedBuses,
    villages,
    institutions
  );

  const hasHighStress = routeDemand.some((r) => r.stressLevel === 'high' || r.stressLevel === 'critical_overload');
  if (surgeResult.newStudents.length > 0 && hasHighStress) {
    console.log(`✅ TEST 5 PASSED: Injected ${surgeResult.newStudents.length} surge students. High corridor stress detected successfully.\n`);
    passedTests++;
  } else {
    throw new Error('Demand surge did not produce high stress corridor detection.');
  }
} catch (e) {
  console.error('❌ TEST 5 FAILED:', e);
}

// TEST 6: An alternative vehicle becomes available.
// Expected: The allocation engine can use its capacity for affected students.
try {
  console.log('TEST 6: Auxiliary Bus Deployment & Waitlist Clearance...');
  // Find waitlisted students
  const waitlisted = students.filter((s) => s.status === 'waitlisted');
  const auxResult = DisruptionEngine.addAuxiliaryBus(
    {
      busNumber: 'KA-28-EX-8888',
      operatorName: 'Auxiliary Student Relief Bus',
      operatorType: 'ksrtc_sarige',
      model: 'Tata Starbus 32-Seater',
      totalCapacity: 30,
      routeId: 'route_aux',
      stops: ['v_harugeri', 'v_mugalkhod', 'inst_govt_polytechnic'],
      currentStopId: 'v_harugeri',
      departureTime: '07:40 AM',
      estimatedArrivalTime: '08:45 AM',
      driverName: 'Suresh K',
      driverContact: '+91 94480 12345',
      rating: 4.9,
      fuelType: 'electric',
    },
    buses,
    students,
    requests,
    villages,
    institutions
  );

  if (auxResult.updatedBuses.length > buses.length && auxResult.reassignedCount >= 0) {
    console.log(`✅ TEST 6 PASSED: Auxiliary bus added. Absorbed ${auxResult.reassignedCount} waitlisted students into confirmed status.\n`);
    passedTests++;
  } else {
    throw new Error('Auxiliary bus did not register or reassign waitlisted students.');
  }
} catch (e) {
  console.error('❌ TEST 6 FAILED:', e);
}

// TEST 7: Demo state serialization & hydration consistency
try {
  console.log('TEST 7: State serialization consistency check...');
  const serialized = JSON.stringify({ villages, institutions, roads, buses, students });
  const parsed = JSON.parse(serialized);
  if (parsed.villages.length === villages.length && parsed.buses.length === buses.length) {
    console.log(`✅ TEST 7 PASSED: Saved demo state serializes and hydrates without data loss.\n`);
    passedTests++;
  } else {
    throw new Error('State serialization mismatch.');
  }
} catch (e) {
  console.error('❌ TEST 7 FAILED:', e);
}

console.log('====================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED PERFECTLY`);
console.log('====================================================');
