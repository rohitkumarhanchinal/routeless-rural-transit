import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, writeFile, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const scenarioSource = `
import assert from 'node:assert/strict';
import { EmergencyOptimizer } from './src/algorithms/emergencyOptimizer.ts';
import { INITIAL_ALTERNATIVE_PROVIDERS, INITIAL_BUSES, INITIAL_INSTITUTIONS, INITIAL_REQUESTS, INITIAL_ROADS, INITIAL_STUDENTS, INITIAL_VILLAGES } from './src/data/demoData.ts';

const base = () => ({ buses: INITIAL_BUSES.map((x) => ({ ...x })), alternatives: INITIAL_ALTERNATIVE_PROVIDERS.map((x) => ({ ...x })), roads: INITIAL_ROADS.map((x) => ({ ...x })), students: INITIAL_STUDENTS.map((x) => ({ ...x })), requests: INITIAL_REQUESTS.map((x) => ({ ...x })), villages: INITIAL_VILLAGES, institutions: INITIAL_INSTITUTIONS, activatedAt: '2026-11-13T01:30:00.000Z' });
const result = EmergencyOptimizer.activate(base());

// 1: two buses unavailable and excluded from allocation
assert.equal(result.report.unavailableBusCount, 2);
assert.equal(result.report.affectedBusIds.length, 2);
assert.ok(result.report.affectedBusIds.every((id) => result.buses.find((bus) => bus.id === id)?.status === 'breakdown'));
assert.ok(result.report.affectedBusIds.every((id) => !result.report.outcomes.some((outcome) => outcome.assignedVehicle === result.buses.find((bus) => bus.id === id)?.busNumber)));

// 2: surge is ceil(D * 1.4) and stable IDs make the run repeatable
assert.equal(result.report.demandBefore, 16);
assert.equal(result.report.demandAfter, 23);
assert.equal(result.report.simulatedRequests, 7);
assert.equal(result.students.filter((student) => student.id.startsWith('exam_surge_')).length, 7);
const repeat = EmergencyOptimizer.activate(base());
assert.deepEqual(repeat.students.filter((student) => student.id.startsWith('exam_surge_')).map((s) => s.id), result.students.filter((student) => student.id.startsWith('exam_surge_')).map((s) => s.id));
assert.throws(() => EmergencyOptimizer.activate({ ...base(), buses: result.buses, alternatives: result.alternatives, roads: result.roads, students: result.students, requests: result.requests }), /already been applied/);

// 3 and 6: route search excludes the flood road and uses a viable alternative when one exists
const flood = result.roads.find((road) => road.id === 'road_haru_mugalkhod');
assert.equal(flood?.isDisrupted, true);
const harugeriRoute = result.report.routeRecommendations.find((route) => route.fromNodeId === 'v_harugeri' && route.toNodeId === 'inst_govt_polytechnic');
assert.ok(harugeriRoute?.alternativePath.length);
assert.ok(!harugeriRoute.alternativePath.some((node, index, list) => index < list.length - 1 && ((node === flood?.fromNodeId && list[index + 1] === flood?.toNodeId) || (node === flood?.toNodeId && list[index + 1] === flood?.fromNodeId))));

// 4: actual exam times change urgency categories
const timedInput = base();
timedInput.students = timedInput.students.map((student) => student.id === 'std_01' ? { ...student, examinationStartTime: '08:35 AM' } : student.id === 'std_05' ? { ...student, examinationStartTime: '10:30 AM' } : student);
const timed = EmergencyOptimizer.activate(timedInput);
const urgent = timed.report.outcomes.find((outcome) => outcome.studentId === 'std_01');
const later = timed.report.outcomes.find((outcome) => outcome.studentId === 'std_05');
assert.equal(urgent?.priority, 'critical');
assert.equal(later?.priority, 'normal');
assert.notEqual(urgent?.priorityReason, later?.priorityReason);

// 5: constrained capacity creates waitlist/risk without overbooking
const tight = base();
tight.buses = tight.buses.map((bus) => ({ ...bus, occupiedSeats: bus.totalCapacity }));
tight.alternatives = tight.alternatives.map((alt) => ({ ...alt, availableSeats: 0 }));
const constrained = EmergencyOptimizer.activate(tight);
assert.ok(constrained.report.studentsWaiting > 0);
assert.ok(constrained.buses.every((bus) => bus.occupiedSeats <= bus.totalCapacity));
assert.ok(constrained.alternatives.every((alt) => alt.availableSeats >= 0));
assert.ok(constrained.report.outcomes.some((outcome) => outcome.status === 'at_risk' || outcome.status === 'waitlisted'));

// 7: no valid path is reported as unavailable and exam students remain at risk
const closed = base();
closed.roads = closed.roads.map((road) => ({ ...road, isDisrupted: true, condition: 'flooded' }));
const noPath = EmergencyOptimizer.activate(closed);
assert.equal(noPath.report.routeRecommendations.length, 0);
assert.ok(noPath.report.outcomes.some((outcome) => outcome.status === 'at_risk'));

// 9: reset baseline is represented by the untouched fixture and can be run again deterministically
assert.equal(INITIAL_BUSES.filter((bus) => bus.status === 'active').length, 5);
assert.equal(INITIAL_STUDENTS.length, 16);
 console.log('Emergency optimizer checks passed: repeat activation guard, disruption state, exact demand surge, exam priority, capacity enforcement, and flood-safe/no-path routing.');
 console.log('Demo response: demand ' + result.report.demandBefore + ' → ' + result.report.demandAfter + ' (+' + result.report.simulatedRequests + '); students with a vehicle ' + result.report.allocatedBefore + ' → ' + result.report.allocatedAfter + '; exams on time ' + result.report.examsAllocatedOnTime + '/' + result.report.examStudentCount + '; at risk ' + result.report.examsAtRisk + '; reassigned ' + result.report.studentsReassigned + '; other students accommodated ' + result.report.otherStudentsAllocated + '; waiting ' + result.report.studentsWaiting + '; buses unavailable ' + result.report.unavailableBusCount + '; available buses ' + result.report.availableBusCount + '; available seats ' + result.report.availableSeats + '.');
`;

const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'routeless-emergency-'));
try {
  const built = await build({
    stdin: { contents: scenarioSource, resolveDir: process.cwd(), sourcefile: 'emergency-scenarios.ts', loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
  });
  const outputPath = path.join(tempDirectory, 'scenarios.mjs');
  await writeFile(outputPath, built.outputFiles[0].contents);
  await import(pathToFileURL(outputPath).href);

  for (const legacyEntry of ['test-allocation-scenarios.js', 'test-suite.js']) {
    const entryPath = path.resolve(legacyEntry);
    const legacyOutput = path.join(tempDirectory, `${path.basename(legacyEntry, '.js')}.mjs`);
    await build({
      entryPoints: [entryPath],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: legacyOutput,
      plugins: [{
        name: 'resolve-typescript-source',
        setup(builder) {
          builder.onResolve({ filter: /\.js$/ }, async (args) => {
            if (!args.path.startsWith('.')) return undefined;
            const tsPath = path.resolve(args.resolveDir, args.path.replace(/\.js$/, '.ts'));
            try { await access(tsPath); return { path: tsPath }; } catch { return undefined; }
          });
        },
      }],
    });
    const captured = [];
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...values) => captured.push(values.join(' '));
    console.error = (...values) => captured.push(values.join(' '));
    try { await import(`${pathToFileURL(legacyOutput).href}?run=${Date.now()}`); }
    finally { console.log = originalLog; console.error = originalError; }
    const output = captured.join('\n');
    originalLog(output);
    assert.ok(!output.includes('FAILED'), `${legacyEntry} reported a failed scenario.`);
    assert.ok(/(?:VERIFICATION COMPLETE|TEST SUMMARY):\s*\d+\/\d+/.test(output), `${legacyEntry} did not emit a test summary.`);
  }
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}
