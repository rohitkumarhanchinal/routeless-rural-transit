import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, BarChart3, Bus, CalendarDays, GraduationCap, LogIn, MapPin, ShieldCheck, Users } from 'lucide-react';
import { TransportProvider, useTransport } from './context/TransportContext';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { OperatorDashboard } from './components/OperatorDashboard/OperatorDashboard';
import { RouteVisualizer } from './components/RouteVisualizer/RouteVisualizer';
import { DisruptionSimulator } from './components/DisruptionSimulator/DisruptionSimulator';
import { DemandAnalytics } from './components/Analytics/DemandAnalytics';
import { MobilityAssistant } from './components/AIAssistant/MobilityAssistant';
import { DEMO_ACCOUNTS } from './auth/demoAuth';

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

const LoginPage: React.FC = () => {
  const { loginDemo } = useTransport();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!loginDemo(email, password)) setError('Email and password do not match either demo account.');
    else setError('');
  };
  return <main className="auth-page"><div className="auth-layout"><section className="auth-intro"><span className="brand-mark"><Bus size={22}/></span><p className="eyebrow">RURALRIDE · THE LAST MILE</p><h1>Rural journeys,<br/>better connected.</h1><p>Plan your student trip or coordinate the transport network from one place.</p><div className="auth-promise"><ShieldCheck size={17}/><span>Demo workspace · Sample data stays in this browser</span></div></section><section className="auth-card" aria-labelledby="login-title"><div className="auth-card-heading"><span className="auth-icon"><LogIn size={19}/></span><div><h2 id="login-title">Sign in</h2><p>Choose one of the two demo accounts.</p></div></div><form onSubmit={onSubmit} className="auth-form"><div><label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required/></div><div><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/></div>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-primary auth-submit" type="submit">Sign in <ArrowRight size={16}/></button></form><div className="demo-login-list"><p className="demo-login-heading">Demo accounts</p>{DEMO_ACCOUNTS.map((account) => <button className="demo-login" type="button" key={account.id} onClick={() => { setEmail(account.email); setPassword(account.password); setError(''); }}><span className="demo-role-icon">{account.role === 'student' ? <GraduationCap size={17}/> : <Bus size={17}/>}</span><span className="demo-role-copy"><strong>{account.displayName}</strong><small>{account.email}</small></span><span className="demo-use">Use</span></button>)}</div><p className="auth-disclaimer">This login is for the local demo only. It is not connected to a secure authentication service.</p></section></div></main>;
};

const toTimeInput = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '08:45';
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
};

const toDisplayTime = (value: string) => {
  const [rawHour, rawMinute] = value.split(':').map(Number);
  const suffix = rawHour >= 12 ? 'PM' : 'AM';
  const hour = rawHour % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(rawMinute).padStart(2, '0')} ${suffix}`;
};

const StudentSetup: React.FC = () => {
  const { activeStudent, villages, institutions, language, submitRideRequest, completeStudentSetup, logoutDemo } = useTransport();
  const [villageId, setVillageId] = useState(activeStudent.villageId);
  const [institutionId, setInstitutionId] = useState(activeStudent.institutionId);
  const [travelDate, setTravelDate] = useState(activeStudent.travelDate || '2026-11-13');
  const [departureTime, setDepartureTime] = useState(toTimeInput('07:30 AM'));
  const [arrivalTime, setArrivalTime] = useState(toTimeInput(activeStudent.requiredArrivalTime));
  const [hasExam, setHasExam] = useState(activeStudent.hasBoardExamToday);
  const [examTime, setExamTime] = useState(toTimeInput(activeStudent.examinationStartTime || '09:00 AM'));
  const [error, setError] = useState('');
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      submitRideRequest({ studentId: activeStudent.id, villageId, institutionId, travelDate, departureTime: toDisplayTime(departureTime), arrivalTime: toDisplayTime(arrivalTime), priorityTier: hasExam ? 'high_exam' : activeStudent.gender === 'female' ? 'medical_girl_safety' : 'standard', hasBoardExamToday: hasExam, examinationStartTime: hasExam ? toDisplayTime(examTime) : undefined });
      completeStudentSetup();
    } catch {
      setError('We could not save this trip. Please check your selections and try again.');
    }
  };
  return <main className="auth-page setup-page"><div className="setup-card"><header className="setup-header"><a className="brand" href="#setup"><span className="brand-mark"><Bus size={20}/></span><span><strong>Ruralride</strong><small>Student travel setup</small></span></a><button type="button" className="icon-button" onClick={logoutDemo}>Sign out</button></header><div className="setup-intro"><span className="auth-icon"><MapPin size={20}/></span><div><p className="eyebrow">WELCOME, {activeStudent.name.toUpperCase()}</p><h1>Where are you travelling from?</h1><p>Set your pickup village, destination, and travel times to request a compatible seat.</p></div></div><form className="setup-form" onSubmit={onSubmit}><div className="setup-field-grid"><div><label htmlFor="setup-village">Pickup village</label><select id="setup-village" value={villageId} onChange={(event) => setVillageId(event.target.value)} required>{villages.map((village) => <option key={village.id} value={village.id}>{language === 'kn' ? village.kannadaName : village.name}</option>)}</select></div><div><label htmlFor="setup-institution">Institution</label><select id="setup-institution" value={institutionId} onChange={(event) => setInstitutionId(event.target.value)} required>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{language === 'kn' ? institution.kannadaName : institution.name}</option>)}</select></div><div><label htmlFor="setup-date">Travel date</label><span className="input-with-icon"><CalendarDays size={16}/><input id="setup-date" type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} required/></span></div><div><label htmlFor="setup-departure">Preferred departure</label><input id="setup-departure" type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} required/></div><div><label htmlFor="setup-arrival">Required arrival time</label><input id="setup-arrival" type="time" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} required/></div></div><label className="exam-toggle"><input type="checkbox" checked={hasExam} onChange={(event) => setHasExam(event.target.checked)}/><span><strong>I have an examination today</strong><small>We’ll use the exam start time to prioritize and check whether a route can get you there in time.</small></span></label>{hasExam && <div className="exam-time-field"><label htmlFor="setup-exam-time">Examination start time</label><input id="setup-exam-time" type="time" value={examTime} onChange={(event) => setExamTime(event.target.value)} required/></div>}{error && <p className="auth-error" role="alert">{error}</p>}<div className="setup-actions"><p>Your seat request will use current demo bus capacity and route data.</p><button type="submit" className="button button-primary">Check transport options <ArrowRight size={16}/></button></div></form></div></main>;
};

const AppContent: React.FC = () => {
  const { activeRole, setActiveRole, t, demoAccount } = useTransport();
  if (!demoAccount) return <LoginPage/>;
  if (activeRole === 'student_setup') return <StudentSetup/>;
  const role = demoAccount.role === 'student' && ['operator', 'overview', 'simulator', 'analytics'].includes(activeRole)
    ? 'student'
    : activeRole;
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a><Navbar/><main id="main-content" className="main-content" tabIndex={-1}>
    {role === 'overview' && <Overview/>}{role === 'student' && <StudentDashboard/>}{role === 'operator' && demoAccount.role === 'operator' && <OperatorDashboard/>}{role === 'routes' && <RouteVisualizer/>}{role === 'simulator' && demoAccount.role === 'operator' && <DisruptionSimulator/>}{role === 'analytics' && demoAccount.role === 'operator' && <DemandAnalytics/>}{role === 'assistant' && <MobilityAssistant/>}
    </main><footer className="app-footer"><strong>{t.app_name} · The Last Mile</strong><span>Rural mobility tools for students and transport teams</span></footer></div>;
};

export const App: React.FC = () => <TransportProvider><AppContent/></TransportProvider>;
export default App;
