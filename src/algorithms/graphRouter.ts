import { RoadSegment, Village, Institution, RouteOptimizationResult } from '../types';

export interface GraphNode {
  id: string;
  name: string;
  type: 'village' | 'institution';
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  minutes: number;
  isDisrupted: boolean;
  disruptionReason?: string;
  condition: string;
}

export class GraphRouter {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: RoadSegment[] = [];

  constructor(villages: Village[], institutions: Institution[], roads: RoadSegment[]) {
    villages.forEach((v) => {
      this.nodes.set(v.id, {
        id: v.id,
        name: v.name,
        type: 'village',
        x: v.coordinates.x,
        y: v.coordinates.y,
      });
    });

    institutions.forEach((inst) => {
      this.nodes.set(inst.id, {
        id: inst.id,
        name: inst.name,
        type: 'institution',
        x: inst.coordinates.x,
        y: inst.coordinates.y,
      });
    });

    this.edges = roads;
  }

  // Get adjacency list. If ignoreDisruptions is false, blocked roads are excluded.
  private buildAdjacencyList(ignoreDisruptions: boolean): Map<string, Array<{ to: string; weight: number; distance: number; minutes: number; segment: RoadSegment }>> {
    const adj = new Map<string, Array<{ to: string; weight: number; distance: number; minutes: number; segment: RoadSegment }>>();

    this.nodes.forEach((_, id) => adj.set(id, []));

    for (const road of this.edges) {
      if (!ignoreDisruptions && road.isDisrupted) {
        continue; // Disrupted roads cannot be traversed
      }

      // Weight combines distance and condition penalty
      let conditionMultiplier = 1.0;
      if (road.condition === 'average') conditionMultiplier = 1.15;
      if (road.condition === 'poor') conditionMultiplier = 1.35;
      if (road.condition === 'under_repair') conditionMultiplier = 1.6;

      const weight = road.typicalMinutes * conditionMultiplier;

      // Roads are bidirectional
      adj.get(road.fromNodeId)?.push({
        to: road.toNodeId,
        weight,
        distance: road.distanceKm,
        minutes: road.typicalMinutes,
        segment: road,
      });

      adj.get(road.toNodeId)?.push({
        to: road.fromNodeId,
        weight,
        distance: road.distanceKm,
        minutes: road.typicalMinutes,
        segment: road,
      });
    }

    return adj;
  }

  // Dijkstra's Shortest Path Algorithm
  public findShortestPath(
    startNodeId: string,
    endNodeId: string,
    ignoreDisruptions: boolean = false
  ): { path: string[]; totalDistance: number; totalMinutes: number } | null {
    if (!this.nodes.has(startNodeId) || !this.nodes.has(endNodeId)) {
      return null;
    }

    const adj = this.buildAdjacencyList(ignoreDisruptions);
    const distances = new Map<string, number>();
    const previous = new Map<string, { node: string; distance: number; minutes: number }>();
    const unvisited = new Set<string>();

    this.nodes.forEach((_, id) => {
      distances.set(id, Infinity);
      unvisited.add(id);
    });

    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current: string | null = null;
      let minDistance = Infinity;

      unvisited.forEach((nodeId) => {
        const d = distances.get(nodeId) ?? Infinity;
        if (d < minDistance) {
          minDistance = d;
          current = nodeId;
        }
      });

      if (!current || minDistance === Infinity) {
        break; // No reachable remaining nodes
      }

      if (current === endNodeId) {
        break; // Destination reached
      }

      unvisited.delete(current);

      const neighbors = adj.get(current) ?? [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;

        const alt = minDistance + edge.weight;
        if (alt < (distances.get(edge.to) ?? Infinity)) {
          distances.set(edge.to, alt);
          previous.set(edge.to, {
            node: current,
            distance: edge.distance,
            minutes: edge.minutes,
          });
        }
      }
    }

    if (!previous.has(endNodeId) && startNodeId !== endNodeId) {
      return null; // No path found
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | undefined = endNodeId;
    let totalDist = 0;
    let totalMins = 0;

    while (curr && curr !== startNodeId) {
      path.unshift(curr);
      const step = previous.get(curr);
      if (step) {
        totalDist += step.distance;
        totalMins += step.minutes;
        curr = step.node;
      } else {
        break;
      }
    }
    path.unshift(startNodeId);

    return {
      path,
      totalDistance: Math.round(totalDist * 10) / 10,
      totalMinutes: Math.round(totalMins),
    };
  }

  // Complete Route Optimization & Disruption Analysis
  public optimizeRoute(fromNodeId: string, toNodeId: string): RouteOptimizationResult {
    // 1. Calculate baseline route (as if no disruptions exist)
    const baseline = this.findShortestPath(fromNodeId, toNodeId, true);

    // 2. Check if baseline traverses any currently disrupted road segment
    let hasDisruption = false;
    let blockedSegment: RoadSegment | undefined;

    if (baseline) {
      for (let i = 0; i < baseline.path.length - 1; i++) {
        const u = baseline.path[i];
        const v = baseline.path[i + 1];
        const seg = this.edges.find(
          (e) => (e.fromNodeId === u && e.toNodeId === v) || (e.fromNodeId === v && e.toNodeId === u)
        );
        if (seg && seg.isDisrupted) {
          hasDisruption = true;
          blockedSegment = seg;
          break;
        }
      }
    }

    // 3. Calculate active route (respecting disruptions)
    const activeRoute = this.findShortestPath(fromNodeId, toNodeId, false);

    const originalDist = baseline ? baseline.totalDistance : 0;
    const originalMins = baseline ? baseline.totalMinutes : 0;

    // 4. Recommend nearby pickup waypoint if direct route is severed
    let recommendedPickupPoint: string | undefined;
    if (hasDisruption && blockedSegment) {
      // Choose the unaffected neighboring node
      if (blockedSegment.fromNodeId === fromNodeId) {
        // Find alternative neighbor
        const adj = this.buildAdjacencyList(false);
        const altNeighbors = adj.get(fromNodeId) ?? [];
        if (altNeighbors.length > 0) {
          const neighborNode = this.nodes.get(altNeighbors[0].to);
          recommendedPickupPoint = neighborNode?.name;
        }
      }
    }

    return {
      fromNodeId,
      toNodeId,
      originalPath: baseline ? baseline.path : [],
      originalDistanceKm: originalDist,
      originalMinutes: originalMins,
      hasDisruption,
      blockedSegment,
      alternativePath: activeRoute ? activeRoute.path : undefined,
      alternativeDistanceKm: activeRoute ? activeRoute.totalDistance : undefined,
      alternativeMinutes: activeRoute ? activeRoute.totalMinutes : undefined,
      detourDistanceKm:
        activeRoute && baseline ? Math.round((activeRoute.totalDistance - baseline.totalDistance) * 10) / 10 : 0,
      detourMinutes:
        activeRoute && baseline ? Math.max(0, activeRoute.totalMinutes - baseline.totalMinutes) : 0,
      recommendedPickupPoint,
    };
  }

  // Get human readable name
  public getNodeName(nodeId: string): string {
    return this.nodes.get(nodeId)?.name ?? nodeId;
  }
}
