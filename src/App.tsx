import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import CalendarPage from './pages/CalendarPage';
import TradesPage from './pages/TradesPage';
import TradeForm from './pages/TradeForm';
import TradeView from './pages/TradeView';
import PerformancePage from './pages/PerformancePage';
import MistakesPage from './pages/MistakesPage';
import SettingsPage from './pages/SettingsPage';
import PropFirmsPage from './pages/PropFirmsPage';

const NAV = [
  { to: '/', label: 'Calendário', end: true },
  { to: '/performance', label: 'Performance' },
  { to: '/trades', label: 'Trades' },
  { to: '/mistakes', label: 'Mistakes' },
  { to: '/prop-firms', label: 'Prop Firms' },
  { to: '/settings', label: 'Definições' },
];

export default function App() {
  const { loaded } = useStore();
  const navigate = useNavigate();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">TRADE<span>JOURNAL</span></div>
        <button className="btn primary full" onClick={() => navigate('/trades/new')}>
          + Nova trade
        </button>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        {!loaded ? (
          <div className="muted">A carregar…</div>
        ) : (
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/trades/new" element={<TradeForm />} />
            <Route path="/trades/:id" element={<TradeView />} />
            <Route path="/trades/:id/edit" element={<TradeForm />} />
            <Route path="/mistakes" element={<MistakesPage />} />
            <Route path="/prop-firms" element={<PropFirmsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
