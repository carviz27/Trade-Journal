import type { Trade } from '../types';
import { dailyHistory, fmtDate, fmtDuration, fmtMoney, pnlClass } from '../utils';

interface Props {
  trades: Trade[];
  selected: string | null;
  onSelect: (date: string) => void;
}

const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)}%`;

export default function TradingHistory({ trades, selected, onSelect }: Props) {
  const rows = dailyHistory(trades);
  return (
    <div className="card history">
      <div className="card-head">
        <span className="eyebrow">TRADING HISTORY</span>
        <span className="muted mono small">{rows.length} records</span>
      </div>
      {rows.length === 0 ? (
        <p className="muted">Ainda não há trades. Cada dia em que fizeres trades aparece aqui numa linha.</p>
      ) : (
        <div className="table-wrap scroll history-wrap">
          <table className="table mono-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Símbolo</th>
                <th className="num">Net P&L</th>
                <th className="num">P&L high</th>
                <th className="num">P&L low</th>
                <th className="num">Qty</th>
                <th className="num">Comissões</th>
                <th className="num">Avg win</th>
                <th className="num">Avg loss</th>
                <th>Win duration</th>
                <th>Loss duration</th>
                <th>Win %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className={r.date === selected ? 'row-selected' : ''} onClick={() => onSelect(r.date)}>
                  <td>{fmtDate(r.date)}</td>
                  <td>
                    {r.symbols.map((s) => (
                      <span key={s} className="sym">{s}</span>
                    ))}
                  </td>
                  <td className={`num ${pnlClass(r.net)}`}>{fmtMoney(r.net)}</td>
                  <td className="num">{fmtMoney(r.high)}</td>
                  <td className="num">{fmtMoney(r.low)}</td>
                  <td className="num">{r.qty}</td>
                  <td className="num">{fmtMoney(r.fees)}</td>
                  <td className="num">{fmtMoney(r.avgWin)}</td>
                  <td className="num">{fmtMoney(r.avgLoss)}</td>
                  <td>{fmtDuration(r.winDuration)}</td>
                  <td>{fmtDuration(r.lossDuration)}</td>
                  <td>
                    <span className={`wr ${r.winRate > 0 ? 'good' : 'bad'}`}>{pct(r.winRate)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
