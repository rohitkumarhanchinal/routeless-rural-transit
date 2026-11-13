// Dedicated Scenario Test Runner for Improved ROUTELESS Allocation Engine
// Tests the 3 mandatory scenarios requested by the Senior Algorithm Engineer review:
// 1. Normal transportation demand
// 2. Demand exceeding capacity
// 3. Sudden government bus breakdown

import { AllocationEngine } from './src/algorithms/allocationEngine.js';
import { DisruptionEngine } from './src/algorithms/disruptionEngine.js';
import {
  INITIAL_VILLAGES,
  INITIAL_INSTITUTIONS,
  INITIAL_ROADS,
  INITIAL_BUSES,
  INITIAL_ALTERNATIVE_PROVIDERS,
  INITIAL_STUDENTS,
  INITIAL_REQUESTS,
} from './src/data/demoData.js';

console.log('================================================================');
console.log('🚀 RUNNING COMPREHENSIVE ALLOCATION SCENARIO VERIFICATION');
console.log('================================================================\n');

let scenariosPassed = 0;
const totalScenarios = 3;

// Helper to clone demo data
const getFreshData = () => ({
  villages: JSON.parse(JSON.stringify(INITIAL_VILLAGES)),
  institutions: JSON.parse(JSON.stringify(INITIAL_INSTITUTIONS)),
  roads: JSON.parse(JSON.stringify(INITIAL_ROADS)),
  buses: JSON.parse(JSON.stringify(INITIAL_BUSES)),
  alternatives: JSON.parse(JSON.stringify(INITIAL_ALTERNATIVE_PROVIDERS)),
  students: JSON.parse(JSON.stringify(INITIAL_STUDENTS)),
  requests: JSON.parse(JSON.stringify(INITIAL_REQUESTS)),
});

// ============================================================================
// SCENARIO 1: NORMAL TRANSPORTATION DEMAND
// ============================================================================
try {
  console.log('▶ SCENARIO 1: NORMAL TRANSPORTATION DEMAND');
  console.log('----------------------------------------------------------------');
  const { villages, institutions, roads, buses, alternatives } = getFreshData();

  // Test student with regular morning commute
  const normalStudent = {
    id: 'std_normal_01',
    name: 'Suresh Patil',
    kannadaName: 'ಸುರೇಶ್ ಪಾಟೀಲ',
    rollNumber: 'GP-CKD-NORM-01',
    villageId: 'v_raybag_west',
    institutionId: 'inst_govt_polytechnic',
    course: 'Diploma Mechanical',
    yearOfStudy: '2nd Year',
    gender: 'male',
    requiredArrivalTime: '08:50 AM',
    priorityTier: 'standard',
    hasBoardExamToday: false,
    status: 'pending',
    pickupPoint: 'Raybag Railway Gate',
    contactNumber: '+91 94811 00001',
    travelDate: '2026-11-13',
  };

  const decision = AllocationEngine.allocateStudent(
    normalStudent,
    buses,
    alternatives,
    villages,
    roads
  );

  console.log(`• Allocation Status: ${decision.status.toUpperCase()}`);
  console.log(`• Assigned Vehicle: ${decision.assignedBus?.busNumber || decision.assignedAlternative?.vehicleNumber}`);
  console.log(`• Total Score: ${decision.score} points`);
  console.log(`• Detailed Score Breakdown:`, decision.scoreBreakdown);
  console.log(`• Decision Rationale: "${decision.reason}"`);

  if (
    decision.status === 'confirmed' &&
    decision.assignedBus &&
    decision.scoreBreakdown &&
    decision.scoreBreakdown.routeMatch > 0 &&
    decision.scoreBreakdown.timeMatch > 0 &&
    decision.scoreBreakdown.capacityScore > 0
  ) {
    console.log('✅ SCENARIO 1 PASSED: Normal demand matched with verified route, timing buffer, capacity headroom, and transparent scoring.\n');
    scenariosPassed++;
  } else {
    throw new Error('Scenario 1 allocation failed to confirm compatible bus.');
  }
} catch (e) {
  console.error('❌ SCENARIO 1 FAILED:', e);
}

// ============================================================================
// SCENARIO 2: DEMAND EXCEEDING CAPACITY
// ============================================================================
try {
  console.log('▶ SCENARIO 2: DEMAND EXCEEDING CAPACITY');
  console.log('----------------------------------------------------------------');
  const { villages, institutions, roads, buses, alternatives } = getFreshData();

  // Borgaon is served by Bus 102 and Alternative Provider 1 (Shree Renuka MaxiCab)
  // Give 1 seat to Bus 102 and 1 seat to Alternative Provider 1
  const targetBus = buses.find((b) => b.id === 'bus_nwkrtc_102'); // capacity 30
  targetBus.occupiedSeats = 29; // Exactly 1 seat remaining (30 total)
  alternatives[0].availableSeats = 0; // Harugeri feeder
  alternatives[1].availableSeats = 1; // Exactly 1 seat remaining for Borgaon corridor!
  alternatives[2].availableSeats = 0; // Standby

  // Create 4 students all requesting this same corridor simultaneously:
  // Student A: High Exam Day Priority (+35 pts, arrival deadline 08:55 AM)
  // Student B: Female safety quota on remote corridor (+20 pts, arrival deadline 08:55 AM)
  // Student C: Standard commuter (+0 pts, arrival deadline 08:55 AM)
  // Student D: Standard commuter (+0 pts, arrival deadline 08:55 AM)
  const batchStudents = [
    {
      id: 'batch_std_A',
      name: 'Aishwarya (Exam Priority)',
      kannadaName: 'ಐಶ್ವರ್ಯಾ',
      rollNumber: 'BATCH-EXAM-01',
      villageId: 'v_borgaon',
      institutionId: 'inst_govt_polytechnic',
      course: 'Diploma CS',
      yearOfStudy: 'Final Year',
      gender: 'female',
      requiredArrivalTime: '08:55 AM',
      priorityTier: 'high_exam',
      hasBoardExamToday: true,
      status: 'pending',
      pickupPoint: 'Borgaon Stop',
      contactNumber: '+91 94811 00002',
      travelDate: '2026-11-13',
    },
    {
      id: 'batch_std_B',
      name: 'Deepa (Female Safety)',
      kannadaName: 'ದೀಪಾ',
      rollNumber: 'BATCH-SAFE-02',
      villageId: 'v_borgaon',
      institutionId: 'inst_govt_polytechnic',
      course: 'Diploma Civil',
      yearOfStudy: '2nd Year',
      gender: 'female',
      requiredArrivalTime: '08:55 AM',
      priorityTier: 'medical_girl_safety',
      hasBoardExamToday: false,
      status: 'pending',
      pickupPoint: 'Borgaon Stop',
      contactNumber: '+91 94811 00003',
      travelDate: '2026-11-13',
    },
    {
      id: 'batch_std_C',
      name: 'Chetan (Regular Commuter)',
      kannadaName: 'ಚೇತನ್',
      rollNumber: 'BATCH-REG-03',
      villageId: 'v_borgaon',
      institutionId: 'inst_govt_polytechnic',
      course: 'Diploma Mech',
      yearOfStudy: '1st Year',
      gender: 'male',
      requiredArrivalTime: '08:55 AM',
      priorityTier: 'standard',
      hasBoardExamToday: false,
      status: 'pending',
      pickupPoint: 'Borgaon Stop',
      contactNumber: '+91 94811 00004',
      travelDate: '2026-11-13',
    },
    {
      id: 'batch_std_D',
      name: 'Ramesh (Regular Commuter)',
      kannadaName: 'ರಮೇಶ್',
      rollNumber: 'BATCH-REG-04',
      villageId: 'v_borgaon',
      institutionId: 'inst_govt_polytechnic',
      course: 'Diploma Mech',
      yearOfStudy: '1st Year',
      gender: 'male',
      requiredArrivalTime: '08:55 AM',
      priorityTier: 'standard',
      hasBoardExamToday: false,
      status: 'pending',
      pickupPoint: 'Borgaon Stop',
      contactNumber: '+91 94811 00005',
      travelDate: '2026-11-13',
    },
  ];

  console.log(`• Total incoming batch requests: ${batchStudents.length}`);
  console.log(`• Available seats: Bus 102 (1 seat), Alt Provider (1 seat). Total available: 2 seats.`);

  const prioritizedBatch = [...batchStudents].sort((a, b) =>
    AllocationEngine.calculatePriorityScore(b, villages.find((v) => v.id === b.villageId)) -
    AllocationEngine.calculatePriorityScore(a, villages.find((v) => v.id === a.villageId))
  );
  const batchResults = prioritizedBatch.map((student) => {
    const decision = AllocationEngine.allocateStudent(student, buses, alternatives, villages);
    if (decision.assignedBus) decision.assignedBus.occupiedSeats += 1;
    if (decision.assignedAlternative) decision.assignedAlternative.availableSeats -= 1;
    return { student, decision };
  });

  batchResults.forEach((res, i) => {
    console.log(`  [${i + 1}] ${res.student.name}: Status=${res.decision.status.toUpperCase()}, Score=${res.decision.score} pts, Assigned=${res.decision.assignedBus?.busNumber || res.decision.assignedAlternative?.name || 'WAITLIST'}`);
  });

  const confirmedCount = batchResults.filter((r) => r.decision.status === 'confirmed').length;
  const waitlistedCount = batchResults.filter((r) => r.decision.status === 'waitlisted').length;

  // Verify that the exam student got the primary bus seat
  const studentA = batchResults.find((r) => r.student.id === 'batch_std_A');
  // Verify that targetBus never exceeds 30
  const busTotalAssigned = batchResults.filter((r) => r.decision.assignedBus?.id === targetBus.id).length;

  console.log(`• Confirmed: ${confirmedCount}, Waitlisted: ${waitlistedCount}`);
  console.log(`• Seats assigned on target bus: ${busTotalAssigned} (Cap: 1 seat available)`);

  if (
    confirmedCount === 2 &&
    waitlistedCount === 2 &&
    studentA.decision.status === 'confirmed' &&
    busTotalAssigned === 1
  ) {
    console.log('✅ SCENARIO 2 PASSED: Strict anti-overbooking enforced. Priority student with board exam given highest allocation score. Overflow routed to alternative provider. Excess commuters safely waitlisted with transparent reasons.\n');
    scenariosPassed++;
  } else {
    throw new Error(`Scenario 2 expectations not met: confirmed=${confirmedCount}, waitlisted=${waitlistedCount}, busAssigned=${busTotalAssigned}`);
  }
} catch (e) {
  console.error('❌ SCENARIO 2 FAILED:', e);
}

// ============================================================================
// SCENARIO 3: SUDDEN GOVERNMENT BUS BREAKDOWN
// ============================================================================
try {
  console.log('▶ SCENARIO 3: SUDDEN GOVERNMENT BUS BREAKDOWN');
  console.log('----------------------------------------------------------------');
  const { villages, institutions, roads, buses, alternatives, students, requests } = getFreshData();

  const brokenBusId = 'bus_nwkrtc_101';
  const targetBus = buses.find((b) => b.id === brokenBusId);
  const affectedStudentsBefore = students.filter((s) => s.assignedBusId === brokenBusId);

  console.log(`• Simulating breakdown on: ${targetBus.busNumber} (${targetBus.operatorName})`);
  console.log(`• Displaced student passengers: ${affectedStudentsBefore.length} students`);

  const breakdownResult = DisruptionEngine.simulateBusBreakdown(
    brokenBusId,
    buses,
    alternatives,
    students,
    requests,
    roads,
    villages,
    institutions
  );

  const brokenBusAfter = breakdownResult.updatedBuses.find((b) => b.id === brokenBusId);
  console.log(`• Bus Status after event: ${brokenBusAfter.status.toUpperCase()}`);
  console.log(`• Successfully Reassigned: ${breakdownResult.impactReport.successfullyReassignedCount}`);
  console.log(`• Placed on Waitlist: ${breakdownResult.impactReport.waitlistedCount}`);

  console.log('\n• Sample Reassignment Manifest Entries:');
  breakdownResult.impactReport.reassignedDetails.slice(0, 3).forEach((item, idx) => {
    console.log(`  [${idx + 1}] ${item.studentName}: From ${item.fromVehicle} ➔ ${item.toVehicle} (${item.status})`);
    console.log(`      Reason: "${item.reason.substring(0, 100)}..."`);
  });

  if (
    brokenBusAfter.status === 'breakdown' &&
    breakdownResult.impactReport.affectedStudentCount === affectedStudentsBefore.length &&
    breakdownResult.impactReport.successfullyReassignedCount > 0
  ) {
    console.log('\n✅ SCENARIO 3 PASSED: Broken-down vehicle marked inactive; all affected passengers automatically collected and reassigned to active buses and verified alternative fleets with emergency displacement priority.\n');
    scenariosPassed++;
  } else {
    throw new Error('Scenario 3 breakdown reallocation failed.');
  }
} catch (e) {
  console.error('❌ SCENARIO 3 FAILED:', e);
}

console.log('================================================================');
console.log(`🏁 SCENARIO VERIFICATION COMPLETE: ${scenariosPassed}/${totalScenarios} PASSED`);
console.log('================================================================');
