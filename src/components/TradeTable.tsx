import { useNavigate } from 'react-router-dom';
import type { Trade } from '../types';
import { fmtDate, fmtMoney, pnlClass, sortTrades } from '../utils';
import { useStore } from '../store';

export default function TradeTable({ trades }: { trades: Trade[] }) {
  const navigate = useNavigate();
  const { settings } = useStore();
  const rows = sortTrades(trades).reverse();
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Símbolo</th>
            <th>Lado</th>
            <th>Setup</th>
            <th>Checklist</th>
            <th>Mistakes</th>
            <th className="num">P&L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const total = settings.checklist.length;
            const done = settings.checklist.filter((c) => t.checklist[c.id]).length;
            return (
              <tr key={t.id} onClick={() => navigate(`/trades/${t.id}`)}>
                <td>
                  {fmtDate(t.date)} <span className="muted">{t.time}</span>
                </td>
                <td><strong>{t.symbol}</strong></td>
                <td>
                  <span className={`tag ${t.side}`}>{t.side === 'long' ? 'LONG' : 'SHORT'}</span>
                </td>
                <td>{t.setup || <span className="muted">—</span>}</td>
                <td>{total ? `${done}/${total}` : '—'}</td>
                <td>
                  {t.mistakes.length ? (
                    t.mistakes.map((m) => (
                      <span key={m} className="tag mistake">{m}</span>
                    ))
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className={`num ${pnlClass(t.pnl)}`}>{fmtMoney(t.pnl)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
