import React from 'react';
import { Activity, BarChart3, Bus, Globe, LayoutDashboard, LogOut, Map, Menu, RotateCcw, Sparkles, TriangleAlert, UserRound } from 'lucide-react';
import { useTransport } from '../context/TransportContext';

const items = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'operator' },
  { id: 'student', label: 'Student portal', icon: UserRound, group: 'student' },
  { id: 'operator', label: 'Operator dashboard', icon: Bus, group: 'operator' },
  { id: 'routes', label: 'Routes', icon: Map },
  { id: 'simulator', label: 'Disruptions', icon: TriangleAlert, group: 'operator' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'operator' },
  { id: 'assistant', label: 'AI assistant', icon: Sparkles },
];

export const Navbar: React.FC = () => {
  const { language, setLanguage, activeRole, setActiveRole, buses, students, requests, resetDemoData, demoAccount, logoutDemo } = useTransport();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const activeBuses = buses.filter((bus) => bus.status === 'active').length;
  const accountRole = demoAccount?.role || 'student';
  const nav = items.filter((item) => !item.group || item.group === accountRole);
  const go = (id: string) => { setActiveRole(id); setMenuOpen(false); };

  return <header className="app-header">
    <a className="brand" href="#main-content" onClick={(e) => { e.preventDefault(); go(accountRole === 'operator' ? 'overview' : 'student'); }} aria-label="Routeless home">
      <span className="brand-mark"><Bus size={20} /></span>
      <span><strong>ROUTELESS</strong><small>The Last Mile</small></span>
    </a>
    <nav className={`primary-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
      {nav.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => go(id)} className={`nav-link ${activeRole === id ? 'active' : ''}`} aria-current={activeRole === id ? 'page' : undefined}>
        <Icon size={17} aria-hidden="true" /><span>{label}</span>
      </button>)}
    </nav>
    <div className="header-actions">
      <span className="network-status"><Activity size={15} /> {activeBuses} buses active</span>
      <button className="icon-button" type="button" onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')} aria-label="Change language"><Globe size={17} /><span>{language === 'en' ? 'ಕನ್ನಡ' : 'EN'}</span></button>
      {accountRole === 'operator' && <button className="icon-button reset-button" type="button" onClick={() => { if (window.confirm('Reset all demo routes, buses, and student allocations?')) resetDemoData(); }} aria-label="Reset demo data"><RotateCcw size={16} /><span>Reset demo</span></button>}
      <span className="account-chip">{demoAccount?.displayName}</span>
      <button className="icon-button logout-button" type="button" onClick={logoutDemo} aria-label="Sign out"><LogOut size={16} /><span>Sign out</span></button>
      <button className="menu-button" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={21} /></button>
    </div>
    <span className="sr-only" aria-live="polite">{students.length} students and {requests.length} transport requests</span>
  </header>;
};
