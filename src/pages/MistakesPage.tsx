import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { fmtMoney, fmtPct, pnlClass } from '../utils';
import TradeTable from '../components/TradeTable';

export default function MistakesPage() {
  const { trades } = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  const map = new Map<string, { name: string; count: number; pnl: number; losses: number }>();
  for (const t of trades)
    for (const m of t.mistakes) {
      const e = map.get(m) ?? { name: m, count: 0, pnl: 0, losses: 0 };
      e.count++;
      e.pnl += t.pnl;
      if (t.pnl < 0) e.losses++;
      map.set(m, e);
    }
  const rows = [...map.values()].sort((a, b) => b.count - a.count || a.pnl - b.pnl);
  const max = rows[0]?.count ?? 1;

  const withMistakes = trades.filter((t) => t.mistakes.length);
  const clean = trades.filter((t) => !t.mistakes.length);
  const sum = (ts: typeof trades) => ts.reduce((a, t) => a + t.pnl, 0);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Mistakes</h1>
        <Link to="/settings" className="btn">Gerir lista de mistakes</Link>
      </div>

      <div className="stat-grid">
        <div className="stat"><span>Trades com mistakes</span><strong>{withMistakes.length}/{trades.length}</strong><small className="muted">{fmtPct(trades.length ? (withMistakes.length / trades.length) * 100 : 0)}</small></div>
        <div className="stat"><span>P&L com mistakes</span><strong className={pnlClass(sum(withMistakes))}>{fmtMoney(sum(withMistakes))}</strong></div>
        <div className="stat"><span>P&L sem mistakes</span><strong className={pnlClass(sum(clean))}>{fmtMoney(sum(clean))}</strong></div>
        <div className="stat"><span>Mistake mais comum</span><strong>{rows[0]?.name ?? '—'}</strong></div>
      </div>

      <div className="card">
        <h3>Mais cometidos</h3>
        {rows.length === 0 && <p className="muted">Ainda não marcaste mistakes em nenhuma trade.</p>}
        <div className="mistake-list">
          {rows.map((r, i) => (
            <button key={r.name} className={`mistake-row ${selected === r.name ? 'selected' : ''}`} onClick={() => setSelected(selected === r.name ? null : r.name)}>
              <span className="rank">#{i + 1}</span>
              <span className="mname">{r.name}</span>
              <span className="bar"><span style={{ width: `${(r.count / max) * 100}%` }} /></span>
              <span className="mcount">{r.count}×</span>
              <span className={`mpnl ${pnlClass(r.pnl)}`}>{fmtMoney(r.pnl)}</span>
            </button>
          ))}
        </div>
        {rows.length > 0 && (
          <p className="muted small-note">
            P&L = soma do resultado das trades onde esse mistake aconteceu. Clica num mistake para ver as trades.
          </p>
        )}
      </div>

      {selected && (
        <div className="card">
          <h3>Trades com “{selected}”</h3>
          <TradeTable trades={trades.filter((t) => t.mistakes.includes(selected))} />
        </div>
      )}
    </div>
  );
}
