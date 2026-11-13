import React from 'react';
import { AlertTriangle, ArrowRight, BarChart3, Bus, MapPin, Users } from 'lucide-react';
import { TransportProvider, useTransport } from './context/TransportContext';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { OperatorDashboard } from './components/OperatorDashboard/OperatorDashboard';
import { RouteVisualizer } from './components/RouteVisualizer/RouteVisualizer';
import { DisruptionSimulator } from './components/DisruptionSimulator/DisruptionSimulator';
import { DemandAnalytics } from './components/Analytics/DemandAnalytics';
import { MobilityAssistant } from './components/AIAssistant/MobilityAssistant';
import { LandingPage } from './components/LandingPage/LandingPage';

const Overview: React.FC = () => {
  const { buses, students, requests, roads, alternatives, disruptions, villages, setActiveRole } = useTransport();
  const active = buses.filter((b) => b.status === 'active');
  const allocated = students.filter((s) => ['confirmed', 'reassigned'].includes(s.status)).length;
  const pending = requests.filter((r) => r.status === 'pending').length;
  const alerts = disruptions.filter((d) => d.status === 'active');
  const fleetCapacity = buses.reduce((n, b) => n + b.totalCapacity, 0);
  const fleetOccupancy = buses.reduce((n, b) => n + b.occupiedSeats, 0);
  return <div className="page-container overview-page">
    <div className="page-intro"><div><p className="eyebrow">TRANSPORT NETWORK</p><h1>Good morning. Here’s your network.</h1><p className="muted">Live service, student allocations and operational alerts in one place.</p></div><button className="button button-primary" onClick={() => setActiveRole('simulator')}><AlertTriangle size={17}/> Report disruption</button></div>
    <section className="metric-grid" aria-label="Network summary">
      {[{ label: 'Active buses', value: active.length, detail: `of ${buses.length} vehicles`, icon: Bus }, { label: 'Total students', value: students.length, detail: `${students.filter((s) => s.status === 'waitlisted').length} currently waitlisted`, icon: Users }, { label: 'Allocated students', value: allocated, detail: `${students.length ? Math.round(allocated / students.length * 100) : 0}% of students`, icon: MapPin }, { label: 'Pending requests', value: pending, detail: 'Need operator review', icon: AlertTriangle }].map(({ label, value, detail, icon: Icon }) => <article className="metric-card" key={label}><span className="metric-icon"><Icon size={19}/></span><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-detail">{detail}</span></article>)}
    </section>
    <div className="overview-grid">
      <section className="panel network-panel"><div className="panel-heading"><div><h2>Rural transportation network</h2><p>Current fleet and road conditions</p></div><button className="text-action" onClick={() => setActiveRole('routes')}>Explore routes <ArrowRight size={15}/></button></div>
        <div className="network-summary"><div><span className="summary-value">{roads.length}</span><span>road segments</span></div><div><span className="summary-value">{alternatives.filter((a) => a.status === 'active').length}</span><span>active feeder providers</span></div><div><span className="summary-value">{roads.filter((r) => r.isDisrupted).length}</span><span>disrupted segments</span></div></div>
        <div className="capacity-row"><div className="capacity-copy"><span>Fleet seats in use</span><strong>{fleetOccupancy} / {fleetCapacity}</strong></div><div className="capacity-track" role="progressbar" aria-label="Fleet seats in use" aria-valuenow={fleetOccupancy} aria-valuemin={0} aria-valuemax={fleetCapacity}><span style={{width: `${fleetCapacity ? Math.min(100, fleetOccupancy / fleetCapacity * 100) : 0}%`}}/></div></div>
        <div className="fleet-list">{active.slice(0, 4).map((bus) => <div className="fleet-row" key={bus.id}><span className="fleet-avatar"><Bus size={16}/></span><span className="fleet-name"><strong>{bus.busNumber}</strong><small>{bus.operatorName}</small></span><span className="fleet-seats">{Math.max(0, bus.totalCapacity - bus.occupiedSeats)} seats free</span><span className="status-dot" aria-label="Active"/></div>)}{active.length === 0 && <p className="empty-state">No active buses are currently listed.</p>}</div>
      </section>
      <section className="panel alerts-panel"><div className="panel-heading"><div><h2>Transportation alerts</h2><p>Events requiring attention</p></div><span className="count-pill">{alerts.length}</span></div>
        {alerts.length ? alerts.slice(0, 3).map((event) => <article className="alert-row" key={event.id}><span className="alert-icon"><AlertTriangle size={17}/></span><div><strong>{event.title}</strong><p>{event.description}</p><small>{new Date(event.timestamp).toLocaleString()}</small></div></article>) : <div className="empty-state">No active disruptions. Your network is operating normally.</div>}
        <button className="button button-secondary full-button" onClick={() => setActiveRole('simulator')}>Open disruption management</button>
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>Student allocation</h2><p>Current status across the network</p></div><Users size={18}/></div><div className="allocation-stats"><div><span>Allocated</span><strong>{allocated}</strong></div><div><span>Waitlisted</span><strong>{students.filter((s) => s.status === 'waitlisted').length}</strong></div><div><span>Unassigned</span><strong>{students.filter((s) => s.status === 'pending').length}</strong></div></div><button className="text-action" onClick={() => setActiveRole('operator')}>Review requests <ArrowRight size={15}/></button></section>
      <section className="panel"><div className="panel-heading"><div><h2>Alternative transport</h2><p>Verified providers for service continuity</p></div><Bus size={18}/></div><div className="alternative-callout"><strong>{alternatives.filter((a) => a.isVerified && a.status !== 'standby').length} providers ready</strong><span>Available feeder options can help cover rural corridors when a bus is disrupted.</span></div><button className="text-action" onClick={() => setActiveRole('operator')}>Manage fleet <ArrowRight size={15}/></button></section>
      <section className="panel demand-panel"><div className="panel-heading"><div><h2>Demand overview</h2><p>Students by village in current data</p></div><BarChart3 size={18}/></div><div className="demand-bars">{[...new Set(students.map((s) => s.villageId))].slice(0, 5).map((id) => { const count = students.filter((s) => s.villageId === id).length; const label = villages.find((v) => v.id === id)?.name || id.replace(/^v_/, '').replace(/_/g, ' '); const max = Math.max(1, ...students.map((s) => students.filter((x) => x.villageId === s.villageId).length)); return <div className="demand-row" key={id}><span>{label}</span><div className="demand-track"><span style={{width: `${count / max * 100}%`}}/></div><strong>{count}</strong></div>; })}</div><button className="text-action" onClick={() => setActiveRole('analytics')}>View demand analytics <ArrowRight size={15}/></button></section>
    </div>
  </div>;
};

const AppContent: React.FC = () => {
  const { activeRole, setActiveRole, t } = useTransport();
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a><Navbar/><main id="main-content" className="main-content" tabIndex={-1}>
    {activeRole === 'landing' && <LandingPage onExplore={setActiveRole}/>}
    {activeRole === 'overview' && <Overview/>}{activeRole === 'student' && <StudentDashboard/>}{activeRole === 'operator' && <OperatorDashboard/>}{activeRole === 'routes' && <RouteVisualizer/>}{activeRole === 'simulator' && <DisruptionSimulator/>}{activeRole === 'analytics' && <DemandAnalytics/>}{activeRole === 'assistant' && <MobilityAssistant/>}
    </main><footer className="app-footer"><strong>{t.app_name} · The Last Mile</strong><span>Rural mobility tools for students and transport teams</span></footer></div>;
};

export const App: React.FC = () => <TransportProvider><AppContent/></TransportProvider>;
export default App;
