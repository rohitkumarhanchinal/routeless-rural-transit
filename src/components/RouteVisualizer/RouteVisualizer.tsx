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
  Bus as BusIcon,
  Activity,
  Compass,
  CornerDownRight,
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('v_harugeri');
  const [hoveredRoadId, setHoveredRoadId] = useState<string | null>(null);

  const router = new GraphRouter(villages, institutions, roads);
  const optimization = router.optimizeRoute(fromNodeId, toNodeId);

  // Combined nodes for map rendering
  const allNodes = [
    ...villages.map((v) => ({ ...v, type: 'village' as const })),
    ...institutions.map((i) => ({ ...i, type: 'institution' as const })),
  ];

  const selectedNode = allNodes.find((n) => n.id === selectedNodeId);
  const hoveredRoad = roads.find((r) => r.id === hoveredRoadId);

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

  // Find buses stationed or passing through the selected node
  const busesAtSelectedNode = buses.filter(
    (b) => b.currentStopId === selectedNodeId || b.stops.includes(selectedNodeId || '')
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header & Mission Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              TOPOLOGICAL GRAPH ENGINE
            </span>
            <span className="text-[11px] text-slate-500 font-mono">DIJKSTRA SHORTEST PATH</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center">
            <Compass className="w-6 h-6 mr-2.5 text-cyan-400" />
            {t.route_optimizer}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic graph routing across Raybag, Chikkodi & Hukkeri taluks. Real-time bypass calculation around flooded culverts and damaged state highways.
          </p>
        </div>

        {/* Route Selector Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50/90 p-2 rounded-2xl border border-slate-200 shadow-lg">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-500 font-semibold px-1">Origin:</span>
            <select
              value={fromNodeId}
              onChange={(e) => {
                setFromNodeId(e.target.value);
                setSelectedNodeId(e.target.value);
              }}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {language === 'kn' ? v.kannadaName : v.name}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500" />

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-500 font-semibold px-1">Destination:</span>
            <select
              value={toNodeId}
              onChange={(e) => {
                setToNodeId(e.target.value);
                setSelectedNodeId(e.target.value);
              }}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {language === 'kn' ? inst.kannadaName : inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (8 cols) & Route HUD / Node Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Schematic SVG Map */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            {/* Map Telemetry Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-extrabold text-slate-900 flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-cyan-400" />
                  Belagavi District Rural Mobility Topology
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 font-mono hidden sm:inline">
                  Interactive Node Grid
                </span>
              </div>

              {/* Status Legend */}
              <div className="flex items-center space-x-3 text-[10px] text-slate-600">
                <span className="flex items-center">
                  <span className="w-3 h-1 bg-cyan-400 rounded mr-1.5 shadow-sm shadow-cyan-400"></span>
                  Active Path
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-1 bg-rose-500 rounded mr-1.5 border-dashed"></span>
                  Disrupted / Under Repair
                </span>
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>
                  College Campus
                </span>
              </div>
            </div>

            {/* SVG Visualizer Canvas */}
            <div className="relative w-full aspect-[16/10] bg-slate-50/95 rounded-2xl overflow-hidden mt-3 border border-slate-200/80 shadow-inner">
              <svg viewBox="0 0 850 550" className="w-full h-full select-none">
                <defs>
                  {/* Grid pattern */}
                  <pattern id="ruralGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.6" />
                  </pattern>

                  {/* Cyan Path Glow Filter */}
                  <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Red Hazard Glow Filter */}
                  <filter id="hazardGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background Grid */}
                <rect width="100%" height="100%" fill="url(#ruralGrid)" />

                {/* 1. Road Segments (Edges) */}
                {roads.map((road) => {
                  const u = allNodes.find((n) => n.id === road.fromNodeId);
                  const v = allNodes.find((n) => n.id === road.toNodeId);
                  if (!u || !v) return null;

                  const onActive = isSegmentOnActivePath(road.fromNodeId, road.toNodeId);
                  const onBaseline = isSegmentOnBaselinePath(road.fromNodeId, road.toNodeId);
                  const isHovered = hoveredRoadId === road.id;
                  const midX = (u.coordinates.x + v.coordinates.x) / 2;
                  const midY = (u.coordinates.y + v.coordinates.y) / 2;

                  return (
                    <g
                      key={road.id}
                      onClick={() => toggleRoadStatus(road.id)}
                      onMouseEnter={() => setHoveredRoadId(road.id)}
                      onMouseLeave={() => setHoveredRoadId(null)}
                      className="cursor-pointer group"
                    >
                      {/* Thick transparent hit area for effortless clicking */}
                      <line
                        x1={u.coordinates.x}
                        y1={u.coordinates.y}
                        x2={v.coordinates.x}
                        y2={v.coordinates.y}
                        stroke="transparent"
                        strokeWidth="24"
                      />

                      {/* Road Underlay Shadow / Glow */}
                      {(onActive || road.isDisrupted || isHovered) && (
                        <line
                          x1={u.coordinates.x}
                          y1={u.coordinates.y}
                          x2={v.coordinates.x}
                          y2={v.coordinates.y}
                          stroke={road.isDisrupted ? '#f43f5e' : onActive ? '#06b6d4' : '#38bdf8'}
                          strokeWidth={road.isDisrupted ? 6 : onActive ? 7 : 4}
                          strokeOpacity={road.isDisrupted ? 0.3 : onActive ? 0.4 : 0.25}
                          filter={road.isDisrupted ? 'url(#hazardGlow)' : 'url(#cyanGlow)'}
                        />
                      )}

                      {/* Main Visual Road Line */}
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
                            : isHovered
                            ? '#64748b'
                            : '#334155'
                        }
                        strokeWidth={road.isDisrupted ? 3 : onActive ? 4 : 2}
                        strokeDasharray={road.isDisrupted ? '8,8' : onActive && !isRuralLite ? undefined : undefined}
                      />

                      {/* Road Distance Badge */}
                      <rect
                        x={midX - 22}
                        y={midY - 11}
                        width="44"
                        height="22"
                        rx="6"
                        fill={road.isDisrupted ? '#881337' : onActive ? '#0e7490' : '#0f172a'}
                        stroke={road.isDisrupted ? '#f43f5e' : onActive ? '#22d3ee' : '#334155'}
                        strokeWidth="1.2"
                      />
                      <text
                        x={midX}
                        y={midY + 4}
                        textAnchor="middle"
                        fontSize="9.5"
                        fill={road.isDisrupted ? '#fecdd3' : onActive ? '#cffafe' : '#94a3b8'}
                        fontWeight="700"
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
                  const hasBusHere = buses.some((b) => b.currentStopId === node.id && b.status === 'active');

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.coordinates.x}, ${node.coordinates.y})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer group"
                    >
                      {/* Selection / Origin / Dest Ping Ring */}
                      {(isOrigin || isDest || isSelected) && (
                        <circle
                          r="26"
                          fill="none"
                          stroke={isOrigin ? '#10b981' : isDest ? '#f59e0b' : '#38bdf8'}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          className={!isRuralLite ? 'animate-spin' : ''}
                          style={{ animationDuration: '10s' }}
                        />
                      )}

                      {/* Main Node Body */}
                      <circle
                        r={isInstitution ? 16 : 12}
                        fill={
                          isOrigin
                            ? '#059669'
                            : isDest
                            ? '#d97706'
                            : isInstitution
                            ? '#2563eb'
                            : '#1e293b'
                        }
                        stroke={isInstitution ? '#93c5fd' : isSelected ? '#38bdf8' : '#475569'}
                        strokeWidth={isSelected ? 3 : 2}
                        className="group-hover:scale-125 transition-transform duration-200"
                      />

                      {/* Center Glyph Dot */}
                      <circle
                        r={isInstitution ? 6 : 4}
                        fill="#ffffff"
                      />

                      {/* Station Name Label */}
                      <text
                        y={isInstitution ? 30 : 25}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isOrigin || isDest ? '800' : '600'}
                        fill={isOrigin ? '#34d399' : isDest ? '#fbbf24' : '#f1f5f9'}
                        className="pointer-events-none drop-shadow-md"
                      >
                        {language === 'kn' ? (node as any).kannadaName : node.name}
                      </text>

                      {/* Bus Present Indicator Icon */}
                      {hasBusHere && (
                        <g transform="translate(10, -18)">
                          <circle r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                          <text y="3" textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold">🚌</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="mt-3 text-[11px] text-slate-500 text-center flex items-center justify-center space-x-2">
              <span>💡 Click any road segment to simulate a disruption • Click any station node to inspect transit telemetry</span>
            </p>
          </div>
        </div>

        {/* Right Column: Routing Optimization HUD & Station Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          {/* Optimization Telemetry HUD */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-cyan-400" />
                Dijkstra Routing Output
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/30">
                OPTIMAL
              </span>
            </div>

            {/* Disruption Alert Box if path has disruption */}
            {optimization.hasDisruption ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs">
                <div className="flex items-center space-x-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Direct Corridor Severed</span>
                </div>
                <p className="mt-1 leading-relaxed text-[11px] text-slate-600">
                  Segment <strong>{optimization.blockedSegment?.id}</strong> is closed due to:{' '}
                  <em>"{optimization.blockedSegment?.disruptionReason || 'Road damage'}"</em>.
                </p>
                <div className="mt-2.5 p-2.5 bg-rose-900/40 rounded-xl text-[11px] font-medium border border-rose-500/30">
                  <strong>Graph Bypass Active:</strong> Dijkstra algorithm routed traffic via safe bypass node.
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Optimal direct route clear. Zero road obstructions detected.</span>
              </div>
            )}

            {/* Travel Time & Distance Comparison Table */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/60">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Original Baseline Route
                </span>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-base font-bold text-slate-700">
                    {optimization.originalDistanceKm} km
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ~{optimization.originalMinutes} mins typical
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                  {optimization.originalPath.map((id) => router.getNodeName(id)).join(' ➔ ')}
                </p>
              </div>

              {optimization.hasDisruption && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40">
                  <span className="text-[10px] text-cyan-300 font-semibold uppercase block">
                    Optimized Bypass Route
                  </span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-base font-bold text-cyan-200">
                      {optimization.alternativeDistanceKm} km
                    </span>
                    <span className="text-xs text-cyan-300 font-mono">
                      ~{optimization.alternativeMinutes} mins (+{optimization.detourMinutes}m detour)
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-100 mt-1 line-clamp-2">
                    {optimization.alternativePath?.map((id) => router.getNodeName(id)).join(' ➔ ')}
                  </p>
                </div>
              )}
            </div>

            {/* Detour Overhead Stat */}
            {optimization.hasDisruption && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <div className="flex justify-between font-bold">
                  <span>Detour Overhead:</span>
                  <span>+{optimization.detourDistanceKm} km | +{optimization.detourMinutes} mins</span>
                </div>
                {optimization.recommendedPickupPoint && (
                  <p className="mt-1.5 text-[11px] text-slate-600">
                    Alternate pickup point: <strong>{optimization.recommendedPickupPoint}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Station Node Inspector Card */}
          {selectedNode && (
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-5 shadow-xl text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedNode.name}</h3>
                  <p className="text-[11px] text-slate-500">{selectedNode.landmark}</p>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 uppercase font-bold border border-brand-500/30">
                  {selectedNode.type}
                </span>
              </div>

              {selectedNode.type === 'village' && (
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="p-2 bg-white rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Taluk</span>
                    <strong className="text-slate-900">{(selectedNode as any).taluk}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Student Commuters</span>
                    <strong className="text-slate-900">{(selectedNode as any).studentPopulation}</strong>
                  </div>
                </div>
              )}

              {/* Buses Serving this Node */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">
                  Transit Fleet Serving This Station ({busesAtSelectedNode.length}):
                </span>
                <div className="space-y-1.5">
                  {busesAtSelectedNode.map((bus) => (
                    <div
                      key={bus.id}
                      className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-bold text-slate-900">{bus.busNumber}</span>
                      <span className="text-slate-500">{bus.departureTime} ➔ {bus.estimatedArrivalTime}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          bus.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {bus.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
