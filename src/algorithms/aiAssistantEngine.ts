import {
  Bus,
  AlternativeProvider,
  Student,
  TransportationRequest,
  RoadSegment,
  Village,
  Institution,
  DisruptionEvent,
} from '../types';
import { GraphRouter } from './graphRouter';
import { DemandForecaster } from './demandForecaster';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  chips?: string[];
  dataPill?: {
    label: string;
    value: string;
    tone: 'info' | 'success' | 'warning' | 'danger';
  };
}

export class AIAssistantEngine {
  public static processQuery(
    query: string,
    context: {
      activeStudent: Student;
      villages: Village[];
      institutions: Institution[];
      buses: Bus[];
      alternatives: AlternativeProvider[];
      students: Student[];
      requests: TransportationRequest[];
      roads: RoadSegment[];
      disruptions: DisruptionEvent[];
    }
  ): AssistantMessage {
    const q = query.toLowerCase();
    const router = new GraphRouter(context.villages, context.institutions, context.roads);
    const student = context.activeStudent;
    const village = context.villages.find((v) => v.id === student.villageId);
    const institution = context.institutions.find((i) => i.id === student.institutionId);

    // 1. "Which bus can take me to my college?" or "my bus"
    if (q.includes('which bus') || q.includes('take me to') || q.includes('how can i reach') || q.includes('college bus')) {
      const compatibleBuses = context.buses.filter(
        (b) => b.stops.includes(student.villageId) && b.stops.includes(student.institutionId)
      );

      if (compatibleBuses.length === 0) {
        // Check alternatives
        const alt = context.alternatives.filter(
          (a) =>
            a.operatingVillages.includes(student.villageId) &&
            a.destinationInstitutions.includes(student.institutionId)
        );
        if (alt.length > 0) {
          return {
            id: `msg_${Date.now()}`,
            sender: 'assistant',
            text: `No direct regular government bus connects **${village?.name}** directly to **${institution?.name}**. However, **${alt[0].name}** (${alt[0].vehicleNumber}) is operating as a verified rural feeder with ${alt[0].availableSeats} open seats.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            chips: ['Request seat in E-Feeder', 'View route map', 'Check fare'],
            dataPill: { label: 'Alternative Available', value: alt[0].name, tone: 'info' },
          };
        }

        return {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: `Currently, no direct scheduled bus operates between **${village?.name}** and **${institution?.name}**. Please request an on-demand auxiliary route in the Student Portal.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          chips: ['Request new route', 'Find nearest junction'],
        };
      }

      const busListText = compatibleBuses
        .map((b) => {
          const open = b.totalCapacity - b.occupiedSeats;
          return `• **${b.busNumber}** (${b.operatorName}) - Departs ~${b.departureTime}, Arrives ~${b.estimatedArrivalTime} | Status: **${b.status.toUpperCase()}** (${open > 0 ? `${open} seats open` : 'FULL'})`;
        })
        .join('\n');

      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Here are the active transit options from **${village?.name}** to **${institution?.name}**:\n\n${busListText}\n\nYour assigned status is currently: **${student.status.toUpperCase()}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: ['Reserve a seat', 'Check disruption status', 'Alternative providers'],
        dataPill: {
          label: 'Primary Option',
          value: compatibleBuses[0].busNumber,
          tone: compatibleBuses[0].status === 'active' ? 'success' : 'danger',
        },
      };
    }

    // 2. "What happens if my bus breaks down?"
    if (q.includes('break down') || q.includes('breakdown') || q.includes('fails') || q.includes('punctured')) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `**Routeless Automated Disruption Protocol:**\n1. If your bus suffers a mechanical failure or breakdown, the driver or operator marks it in the Command Center.\n2. Our **AI Reallocation Engine** instantly executes in real-time.\n3. Students with Board/Semester exams and remote girl students receive prioritized reallocation to other passing government buses or verified auxiliary fleets (**${context.alternatives.map((a) => a.name).join(', ')}**).\n4. You will receive an instantaneous SMS and dashboard update with your new vehicle number and pickup time!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: ['Simulate Bus Breakdown now', 'View emergency contacts', 'Check spare capacity'],
        dataPill: { label: 'Protection', value: '100% Zero-Abandonment Rule', tone: 'success' },
      };
    }

    // 3. "Are there alternative routes?" or "road closure"
    if (q.includes('alternative route') || q.includes('road closed') || q.includes('detour') || q.includes('bypass')) {
      const opt = router.optimizeRoute(student.villageId, student.institutionId);

      if (opt.hasDisruption) {
        return {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Active Road Disruption Detected!**\nThe primary corridor between **${village?.name}** and **${institution?.name}** has a blockage: *"${opt.blockedSegment?.disruptionReason || 'Road under repair'}"*.\n\n• **Dijkstra Bypass Path:** ${opt.alternativePath?.map((id) => router.getNodeName(id)).join(' ➔ ')}\n• **Detour Overhead:** +${opt.detourDistanceKm} km (+${opt.detourMinutes} minutes)\n• **Recommended Pickup Point:** ${opt.recommendedPickupPoint || village?.landmark}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          chips: ['Open Interactive Map', 'Check updated arrival times'],
          dataPill: { label: 'Detour Active', value: `+${opt.detourMinutes} min delay`, tone: 'warning' },
        };
      }

      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Good news! All direct road segments between **${village?.name}** and **${institution?.name}** are clear with normal road conditions. The shortest path is **${opt.originalDistanceKm} km** (~${opt.originalMinutes} mins) via ${opt.originalPath.map((id) => router.getNodeName(id)).join(' ➔ ')}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: ['View road conditions', 'View schematic map'],
        dataPill: { label: 'Route Health', value: 'Clear (0 Disrupted Roads)', tone: 'success' },
      };
    }

    // 4. "Why is my request waitlisted?"
    if (q.includes('waitlist') || q.includes('why waitlisted') || q.includes('pending') || q.includes('seat not confirmed')) {
      const req = context.requests.find((r) => r.studentId === student.id);
      if (student.status === 'waitlisted' || req?.status === 'waitlisted') {
        return {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: `**Explainable Allocation Breakdown for ${student.name}:**\n• Primary Bus on your corridor reached maximum statutory seat capacity (no overbooking allowed for rural passenger safety).\n• Your calculated priority score is **${req?.priorityScore ?? 55} points**.\n• Standby status: You are currently near the top of the queue. If an auxiliary bus is deployed or another passenger cancels, you will automatically be promoted to Confirmed status.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          chips: ['Request auxiliary van', 'View verified alternatives', 'Contact operator'],
          dataPill: { label: 'Waitlist Reason', value: 'Capacity Cap Enforced', tone: 'warning' },
        };
      }

      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Your transit status is currently **${student.status.toUpperCase()}**! Assigned vehicle: **${student.assignedBusId || student.assignedAlternativeId || 'Scheduled Service'}**. You are not on the waitlist.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: ['View boarding pass', 'Check bus driver details'],
      };
    }

    // 5. Operator questions: "Which route needs additional buses?" / "crowded routes"
    if (q.includes('which route needs') || q.includes('crowded') || q.includes('bottleneck') || q.includes('overloaded')) {
      const routeDemand = DemandForecaster.analyzeRouteDemand(
        context.requests,
        context.buses,
        context.villages,
        context.institutions
      );
      const topCrowded = routeDemand[0];

      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `📊 **Corridor Demand Bottleneck Analysis:**\n• Most congested corridor: **${topCrowded.routeName}** with **${topCrowded.utilizationRate}% utilization**.\n• Current logged student demand: **${topCrowded.currentActualDemand} students**.\n• Available capacity: **${topCrowded.availableCapacity} seats**.\n• Projected next-day demand: **${topCrowded.projectedTomorrowDemand} students**.\n\n**Recommendation:** Deploy 1 auxiliary 26-seater shuttle on the ${topCrowded.fromVillage} morning 07:30 AM dispatch.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: ['Deploy Auxiliary Bus now', 'View Demand Analytics chart'],
        dataPill: { label: 'Highest Stress', value: topCrowded.routeName, tone: 'danger' },
      };
    }

    // 6. Operator questions: "Which students are affected by disruption?"
    if (q.includes('affected students') || q.includes('who is affected') || q.includes('affected by')) {
      const activeDisruptions = context.disruptions.filter((d) => d.status === 'active');
      if (activeDisruptions.length === 0) {
        return {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: 'There are currently no active disruptions on the network. All routes and vehicles are operating normally.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          chips: ['Simulate a disruption'],
        };
      }

      const d = activeDisruptions[0];
      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Current Disruption: ${d.title}**\n• Total students affected: **${d.affectedStudentIds.length}**\n• Successfully reassigned by AI: **${d.reassignedStudentIds.length}**\n• Currently waitlisted: **${d.waitlistedStudentIds.length}**\n• Impacted Student IDs: ${d.affectedStudentIds.join(', ')}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: ['View Reallocation Report', 'Deploy standby vehicle'],
        dataPill: { label: 'Affected Students', value: `${d.affectedStudentIds.length} Students`, tone: 'warning' },
      };
    }

    // 7. "Which vehicles have available seats?"
    if (q.includes('available seats') || q.includes('open seats') || q.includes('vacant')) {
      const busSeats = context.buses
        .filter((b) => b.status === 'active')
        .map((b) => `• **${b.busNumber}** (${b.operatorName}): ${b.totalCapacity - b.occupiedSeats} seats free / ${b.totalCapacity} total`)
        .join('\n');

      const altSeats = context.alternatives
        .map((a) => `• **${a.name}**: ${a.availableSeats} seats free (${a.totalCapacity} total)`)
        .join('\n');

      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `💺 **Live Fleet Seat Inventory:**\n\n**Scheduled Government & Public Buses:**\n${busSeats}\n\n**Verified Auxiliary Rural Providers:**\n${altSeats}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: ['View Fleet Manager', 'Simulate Demand Surge'],
      };
    }

    // Default intelligent fallback
    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `I understand you are asking about: *"${query}"*.\n\nAs your Routeless Mobility Assistant, I can help you with:\n1. Finding compatible buses for **${village?.name} ➔ ${institution?.name}**.\n2. Checking disruption detours and Dijkstra shortest bypass paths.\n3. Understanding why a seat was allocated or waitlisted.\n4. Identifying fleet capacity bottlenecks and deploying auxiliary rural vehicles.\n\nHow would you like me to assist you?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chips: [
        'Which bus can take me to my college?',
        'What happens if my bus breaks down?',
        'Are there alternative routes?',
        'Which route needs additional buses?',
      ],
    };
  }
}
