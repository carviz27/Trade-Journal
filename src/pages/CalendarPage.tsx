import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { bucketize, computeStats, fmtDate, fmtMoney, fmtPct, pnlClass, toDateStr, todayStr } from '../utils';
import TradeTable from '../components/TradeTable';

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function CalendarPage() {
  const { trades } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'pnl' | 'events'>('pnl');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => new Map(bucketize(trades, 'day').map((b) => [b.key, b])), [trades]);

  const monthPrefix = toDateStr(month).slice(0, 7);
  const monthTrades = trades.filter((t) => t.date.startsWith(monthPrefix));
  const monthStats = computeStats(monthTrades);
  const tradingDays = new Set(monthTrades.map((t) => t.date)).size;

  // grelha: começa no domingo antes do dia 1, até ao sábado depois do último dia
  const weeks: (Date | null)[][] = [];
  const first = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  let week: (Date | null)[] = Array(first).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(month.getFullYear(), month.getMonth(), d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);

  const shift = (n: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
    setSelected(null);
  };

  const today = todayStr();
  const selectedTrades = selected ? trades.filter((t) => t.date === selected) : [];

  return (
    <div className="page">
      <div className="cal-header">
        <div className="row gap">
          <span className="eyebrow">TRADING CALENDAR</span>
          <div className="toggle">
            <button className={mode === 'pnl' ? 'active' : ''} onClick={() => setMode('pnl')}>
              PNL
            </button>
            <button className={mode === 'events' ? 'active' : ''} onClick={() => setMode('events')}>
              Events
            </button>
          </div>
        </div>
        <div className="row gap">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Mês anterior">←</button>
          <span className="month-label">
            {month.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
          </span>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Mês seguinte">→</button>
        </div>
      </div>

      <div className="month-summary">
        <div>
          <span className="muted">P&L do mês</span>
          <strong className={pnlClass(monthStats.net)}>{fmtMoney(monthStats.net)}</strong>
        </div>
        <div>
          <span className="muted">Dias de trading</span>
          <strong>{tradingDays}</strong>
        </div>
        <div>
          <span className="muted">Trades</span>
          <strong>{monthStats.trades}</strong>
        </div>
        <div>
          <span className="muted">Win rate</span>
          <strong>{fmtPct(monthStats.winRate)}</strong>
        </div>
      </div>

      <div className="calendar">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
        <div className="cal-weekday">SEMANA</div>
        {weeks.map((wk, wi) => {
          const wkTrades = wk.flatMap((d) => (d ? trades.filter((t) => t.date === toDateStr(d)) : []));
          const wkPnl = wkTrades.reduce((s, t) => s + t.pnl, 0);
          return [
            ...wk.map((d, di) => {
              if (!d) return <div key={`${wi}-${di}`} className="cal-cell empty" />;
              const key = toDateStr(d);
              const b = days.get(key);
              const cls = b ? (b.pnl > 0 ? 'win' : b.pnl < 0 ? 'loss' : 'flat') : '';
              const dayTrades = b ? trades.filter((t) => t.date === key) : [];
              return (
                <button
                  key={key}
                  className={`cal-cell ${cls} ${key === today ? 'today' : ''} ${key === selected ? 'selected' : ''}`}
                  onClick={() => setSelected(key === selected ? null : key)}
                >
                  <span className="cal-day">{d.getDate()}</span>
                  {b && mode === 'pnl' && (
                    <>
                      <span className={`cal-pnl ${pnlClass(b.pnl)}`}>{fmtMoney(b.pnl)}</span>
                      <span className={`cal-sub ${pnlClass(b.pnl)}`}>{fmtPct(b.winRate)}</span>
                    </>
                  )}
                  {b && mode === 'events' && (
                    <>
                      <span className="cal-events">
                        {b.trades} trade{b.trades > 1 ? 's' : ''}
                      </span>
                      <span className="cal-sub muted">
                        {[...new Set(dayTrades.map((t) => t.symbol))].slice(0, 3).join(' · ')}
                      </span>
                    </>
                  )}
                </button>
              );
            }),
            <div key={`w${wi}`} className="cal-cell week">
              <span className="cal-day muted">Sem. {wi + 1}</span>
              {wkTrades.length > 0 && (
                <>
                  <span className={`cal-pnl ${pnlClass(wkPnl)}`}>{fmtMoney(wkPnl)}</span>
                  <span className="cal-sub muted">{wkTrades.length} trades</span>
                </>
              )}
            </div>,
          ];
        })}
      </div>

      {selected && (
        <div className="card">
          <div className="card-head">
            <h3>{fmtDate(selected)}</h3>
            <button className="btn primary" onClick={() => navigate(`/trades/new?date=${selected}`)}>
              + Trade neste dia
            </button>
          </div>
          {selectedTrades.length ? (
            <TradeTable trades={selectedTrades} />
          ) : (
            <p className="muted">Sem trades neste dia.</p>
          )}
        </div>
      )}
    </div>
  );
}
