import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import TradeTable from '../components/TradeTable';
import TradeFeed from '../components/TradeFeed';
import { computeStats, fmtMoney, fmtPct, pnlClass } from '../utils';

export default function TradesPage() {
  const { trades, settings } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [result, setResult] = useState<'all' | 'win' | 'loss'>('all');
  const [setup, setSetup] = useState('');
  const [mistake, setMistake] = useState('');
  const [view, setViewState] = useState<'table' | 'feed'>(() => {
    try {
      return localStorage.getItem('tradesView') === 'feed' ? 'feed' : 'table';
    } catch {
      return 'table';
    }
  });
  const setView = (v: 'table' | 'feed') => {
    setViewState(v);
    try {
      localStorage.setItem('tradesView', v);
    } catch {
      /* sem storage: fica só nesta sessão */
    }
  };
  const [newestFirst, setNewestFirst] = useState(true);

  const filtered = trades.filter(
    (t) =>
      (!q || t.symbol.toLowerCase().includes(q.toLowerCase())) &&
      (result === 'all' || (result === 'win' ? t.pnl > 0 : t.pnl < 0)) &&
      (!setup || t.setup === setup) &&
      (!mistake || t.mistakes.includes(mistake)),
  );
  const s = computeStats(filtered);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Trades</h1>
        <div className="row gap">
          <div className="toggle">
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Tabela</button>
            <button className={view === 'feed' ? 'active' : ''} onClick={() => setView('feed')}>Feed</button>
          </div>
          <button className="btn primary" onClick={() => navigate('/trades/new')}>+ Nova trade</button>
        </div>
      </div>
      <div className="filters">
        <input placeholder="Pesquisar símbolo…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={result} onChange={(e) => setResult(e.target.value as typeof result)}>
          <option value="all">Todas</option>
          <option value="win">Ganhas</option>
          <option value="loss">Perdidas</option>
        </select>
        <select value={setup} onChange={(e) => setSetup(e.target.value)}>
          <option value="">Todos os setups</option>
          {settings.setups.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select value={mistake} onChange={(e) => setMistake(e.target.value)}>
          <option value="">Todos os mistakes</option>
          {settings.mistakes.map((x) => <option key={x}>{x}</option>)}
        </select>
        {view === 'feed' && (
          <select value={newestFirst ? 'new' : 'old'} onChange={(e) => setNewestFirst(e.target.value === 'new')}>
            <option value="new">Mais recentes primeiro</option>
            <option value="old">Mais antigas primeiro</option>
          </select>
        )}
        <span className="muted">
          {s.trades} trades · <span className={pnlClass(s.net)}>{fmtMoney(s.net)}</span> · WR {fmtPct(s.winRate)}
        </span>
      </div>
      {filtered.length ? (
        view === 'table' ? (
          <TradeTable trades={filtered} />
        ) : (
          <TradeFeed trades={filtered} newestFirst={newestFirst} />
        )
      ) : (
        <div className="empty-state">
          <p>Ainda não há trades aqui.</p>
          <button className="btn primary" onClick={() => navigate('/trades/new')}>Registar a primeira trade</button>
        </div>
      )}
    </div>
  );
}
