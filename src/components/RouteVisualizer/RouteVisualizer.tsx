import React, { useState } from 'react';
import { useTransport } from '../../context/TransportContext';
import { GraphRouter } from '../../algorithms/graphRouter';
import {
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Info,
} from 'lucide-react';

export const RouteVisualizer: React.FC = () => {
  const {
    t,
    language,
    villages,
    institutions,
    roads,
    buses,
    alternatives,
    toggleRoadStatus,
    isRuralLite,
  } = useTransport();

  const [fromNodeId, setFromNodeId] = useState<string>('v_harugeri');
  const [toNodeId, setToNodeId] = useState<string>('inst_govt_polytechnic');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const router = new GraphRouter(villages, institutions, roads);
  const optimization = router.optimizeRoute(fromNodeId, toNodeId);

  // Combined nodes for map rendering
  const allNodes = [
    ...villages.map((v) => ({ ...v, type: 'village' as const })),
    ...institutions.map((i) => ({ ...i, type: 'institution' as const })),
  ];

  const selectedNode = allNodes.find((n) => n.id === selectedNodeId);

  // Check which roads are on the alternative/active path
  const isSegmentOnActivePath = (u: string, v: string) => {
    if (!optimization.alternativePath) return false;
    const path = optimization.alternativePath;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === u && path[i + 1] === v) || (path[i] === v && path[i + 1] === u)) {
        return true;
      }
    }
    return false;
  };

  const isSegmentOnBaselinePath = (u: string, v: string) => {
    const path = optimization.originalPath;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === u && path[i + 1] === v) || (path[i] === v && path[i + 1] === u)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center">
            <Navigation className="w-6 h-6 mr-2.5 text-cyan-400" />
            {t.route_optimizer}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Weighted graph routing using Dijkstra's algorithm. Reroutes around flooded roads, bridge subsidence, and closures.
          </p>
        </div>

        {/* Route Selector Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-400 font-semibold">Origin:</span>
            <select
              value={fromNodeId}
              onChange={(e) => setFromNodeId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500" />

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-400 font-semibold">Destination:</span>
            <select
              value={toNodeId}
              onChange={(e) => setToNodeId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Path Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Schematic SVG Map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
            {/* Map Header & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-4">
                <span className="font-bold text-slate-200 flex items-center">
                  <Layers className="w-4 h-4 mr-1.5 text-brand-400" />
                  Belagavi Rural Transit Schematic Map
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  (Click any road to toggle disruption; click a node for info)
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-3 text-[10px] text-slate-300">
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 mr-1 shadow-sm shadow-cyan-400/50"></span>
                  Active Path
                </span>
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1 animate-pulse"></span>
                  Disrupted Road
                </span>
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1"></span>
                  Institution
                </span>
              </div>
            </div>

            {/* SVG Visualizer Canvas */}
            <div className="relative w-full aspect-[16/10] bg-slate-950/90 rounded-xl overflow-hidden mt-3 border border-slate-800">
              <svg viewBox="0 0 850 550" className="w-full h-full select-none">
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                  <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* 1. Road Segments (Edges) */}
                {roads.map((road) => {
                  const u = allNodes.find((n) => n.id === road.fromNodeId);
                  const v = allNodes.find((n) => n.id === road.toNodeId);
                  if (!u || !v) return null;

                  const onActive = isSegmentOnActivePath(road.fromNodeId, road.toNodeId);
                  const onBaseline = isSegmentOnBaselinePath(road.fromNodeId, road.toNodeId);
                  const midX = (u.coordinates.x + v.coordinates.x) / 2;
                  const midY = (u.coordinates.y + v.coordinates.y) / 2;

                  return (
                    <g
                      key={road.id}
                      onClick={() => toggleRoadStatus(road.id)}
                      className="cursor-pointer group"
                    >
                      {/* Thick transparent hit area for easy clicking */}
                      <line
                        x1={u.coordinates.x}
                        y1={u.coordinates.y}
                        x2={v.coordinates.x}
                        y2={v.coordinates.y}
                        stroke="transparent"
                        strokeWidth="20"
                      />

                      {/* Main visual road line */}
                      <line
                        x1={u.coordinates.x}
                        y1={u.coordinates.y}
                        x2={v.coordinates.x}
                        y2={v.coordinates.y}
                        stroke={
                          road.isDisrupted
                            ? '#f43f5e'
                            : onActive
                            ? '#06b6d4'
                            : '#334155'
                        }
                        strokeWidth={road.isDisrupted ? 3 : onActive ? 4 : 2}
                        strokeDasharray={road.isDisrupted ? '6,6' : onActive ? undefined : undefined}
                        className={!isRuralLite && onActive ? 'transition-all duration-300' : ''}
                      />

                      {/* Distance badge at midpoint */}
                      <rect
                        x={midX - 18}
                        y={midY - 9}
                        width="36"
                        height="18"
                        rx="4"
                        fill={road.isDisrupted ? '#881337' : '#0f172a'}
                        stroke={road.isDisrupted ? '#f43f5e' : '#334155'}
                        strokeWidth="1"
                      />
                      <text
                        x={midX}
                        y={midY + 3.5}
                        textAnchor="middle"
                        fontSize="9"
                        fill={road.isDisrupted ? '#fecdd3' : '#94a3b8'}
                        fontWeight="600"
                      >
                        {road.isDisrupted ? 'BLOCKED' : `${road.distanceKm}km`}
                      </text>
                    </g>
                  );
                })}

                {/* 2. Nodes (Villages & Institutions) */}
                {allNodes.map((node) => {
                  const isOrigin = node.id === fromNodeId;
                  const isDest = node.id === toNodeId;
                  const isInstitution = node.type === 'institution';
                  const isSelected = node.id === selectedNodeId;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.coordinates.x}, ${node.coordinates.y})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer group"
                    >
                      {/* Selection Ring */}
                      {(isOrigin || isDest || isSelected) && (
                        <circle
                          r="22"
                          fill="none"
                          stroke={isOrigin ? '#10b981' : isDest ? '#f59e0b' : '#38bdf8'}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          className={!isRuralLite ? 'animate-spin' : ''}
                          style={{ animationDuration: '8s' }}
                        />
                      )}

                      {/* Base Node Circle */}
                      <circle
                        r={isInstitution ? 14 : 11}
                        fill={
                          isOrigin
                            ? '#059669'
                            : isDest
                            ? '#d97706'
                            : isInstitution
                            ? '#2563eb'
                            : '#1e293b'
                        }
                        stroke={isInstitution ? '#60a5fa' : '#475569'}
                        strokeWidth="2"
                        className="group-hover:scale-125 transition-transform"
                      />

                      {/* Inner Dot */}
                      <circle
                        r={isInstitution ? 5 : 3.5}
                        fill="#ffffff"
                      />

                      {/* Label Text */}
                      <text
                        y={isInstitution ? 26 : 22}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isOrigin || isDest ? '800' : '600'}
                        fill={isOrigin ? '#34d399' : isDest ? '#fbbf24' : '#e2e8f0'}
                        className="pointer-events-none drop-shadow"
                      >
                        {language === 'kn' ? (node as any).kannadaName : node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="mt-2 text-[11px] text-slate-500 text-center">
              *Interactive Schematic Graph Topology. Road segments are weighted by distance, road condition, and live disruption status.
            </p>
          </div>
        </div>

        {/* Right Column: Path Details & Detour Comparison (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-brand-400" />
              Routing Optimization Summary
            </h2>

            {/* Disruption Alert Box if path has disruption */}
            {optimization.hasDisruption ? (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs mb-4">
                <div className="flex items-center space-x-1.5 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Direct Corridor Blocked</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  Segment <strong>{optimization.blockedSegment?.id}</strong> is unavailable due to:{' '}
                  <em>"{optimization.blockedSegment?.disruptionReason || 'Road damage'}"</em>.
                </p>
                <div className="mt-2 p-2 bg-rose-900/40 rounded-lg text-[11px]">
                  <strong>Dijkstra Engine Output:</strong> Automatically navigated alternative bypass corridor.
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs mb-4 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Optimal direct route clear. No road obstructions detected.</span>
              </div>
            )}

            {/* Travel Time & Distance Comparison Table */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Original Baseline Route
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-200">
                    {optimization.originalDistanceKm} km
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    ~{optimization.originalMinutes} mins typical
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  Path: {optimization.originalPath.map((id) => router.getNodeName(id)).join(' ➔ ')}
                </p>
              </div>

              {optimization.hasDisruption && (
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40">
                  <span className="text-[10px] text-cyan-300 font-semibold uppercase block">
                    Optimized Bypass Route
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-cyan-200">
                      {optimization.alternativeDistanceKm} km
                    </span>
                    <span className="text-xs text-cyan-300 font-medium">
                      ~{optimization.alternativeMinutes} mins (+{optimization.detourMinutes}m detour)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 line-clamp-2">
                    Path: {optimization.alternativePath?.map((id) => router.getNodeName(id)).join(' ➔ ')}
                  </p>
                </div>
              )}
            </div>

            {/* Detour Overhead Stat */}
            {optimization.hasDisruption && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <div className="flex justify-between font-bold">
                  <span>Detour Overhead:</span>
                  <span>+{optimization.detourDistanceKm} km | +{optimization.detourMinutes} mins</span>
                </div>
                {optimization.recommendedPickupPoint && (
                  <p className="mt-1 text-[11px] text-slate-300">
                    Recommended alternate boarding: <strong>{optimization.recommendedPickupPoint}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Selected Node Details Card */}
          {selectedNode && (
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg text-xs">
              <h3 className="font-bold text-white flex items-center justify-between">
                <span>{selectedNode.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 uppercase font-bold">
                  {selectedNode.type}
                </span>
              </h3>
              <p className="text-slate-400 mt-1">
                Landmark: <span className="text-slate-200">{selectedNode.landmark}</span>
              </p>
              {selectedNode.type === 'village' && (
                <div className="mt-2 text-slate-300 space-y-0.5">
                  <p>Taluk: {(selectedNode as any).taluk}</p>
                  <p>Student Commuters: {(selectedNode as any).studentPopulation}</p>
                  <p>Isolation Index: {(selectedNode as any).isRemote ? 'Remote Village' : 'Highway Accessible'}</p>
                </div>
              )}
              {selectedNode.type === 'institution' && (
                <div className="mt-2 text-slate-300 space-y-0.5">
                  <p>Hours: {(selectedNode as any).morningOpeningTime} - {(selectedNode as any).eveningClosingTime}</p>
                  <p>Total Student Enrollment: {(selectedNode as any).studentCapacity}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
