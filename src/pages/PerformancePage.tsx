import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../store';
import { bucketize, computeStats, equityCurve, fmtMoney, fmtPct, parseDate, pnlClass, toDateStr, type Period } from '../utils';
import ChartTooltip from '../components/ChartTooltip';

const RANGES = [
  { id: 'all', label: 'Tudo' },
  { id: '7', label: '7D' },
  { id: '30', label: '30D' },
  { id: '90', label: '90D' },
  { id: 'ytd', label: 'Este ano' },
] as const;
type Range = (typeof RANGES)[number]['id'];

const PERIODS: { id: Period; label: string }[] = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
];

const GREEN = 'var(--green)';
const RED = 'var(--red)';
const axisProps = { stroke: 'var(--muted)', fontSize: 11, tickLine: false, axisLine: false } as const;
const shortMoney = (v: number) => (Math.abs(v) >= 1000 ? `${v < 0 ? '-' : ''}$${(Math.abs(v) / 1000).toFixed(1)}k` : `${v < 0 ? '-' : ''}$${Math.abs(v)}`);

export default function PerformancePage() {
  const { trades } = useStore();
  const [range, setRange] = useState<Range>('all');
  const [period, setPeriod] = useState<Period>('day');

  const filtered = useMemo(() => {
    if (range === 'all') return trades;
    const now = new Date();
    let from: string;
    if (range === 'ytd') from = `${now.getFullYear()}-01-01`;
    else {
      const d = new Date(now);
      d.setDate(d.getDate() - Number(range) + 1);
      from = toDateStr(d);
    }
    return trades.filter((t) => t.date >= from);
  }, [trades, range]);

  const s = computeStats(filtered);
  const curve = equityCurve(filtered);
  const buckets = bucketize(filtered, period);
  const days = bucketize(filtered, 'day');
  const best = days.reduce((a, b) => (b.pnl > (a?.pnl ?? -Infinity) ? b : a), undefined as (typeof days)[number] | undefined);
  const worst = days.reduce((a, b) => (b.pnl < (a?.pnl ?? Infinity) ? b : a), undefined as (typeof days)[number] | undefined);
  const greenDays = days.filter((d) => d.pnl > 0).length;

  // P&L por dia da semana
  const byWeekday = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, i) => {
    const ts = filtered.filter((t) => parseDate(t.date).getDay() === i);
    return { label, pnl: ts.reduce((a, t) => a + t.pnl, 0), trades: ts.length };
  }).filter((d) => d.trades > 0);

  const curveColor = s.net >= 0 ? GREEN : RED;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Performance</h1>
        <div className="toggle">
          {RANGES.map((r) => (
            <button key={r.id} className={range === r.id ? 'active' : ''} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat big"><span>P&L líquido</span><strong className={pnlClass(s.net)}>{fmtMoney(s.net)}</strong></div>
        <div className="stat"><span>Win rate</span><strong>{fmtPct(s.winRate)}</strong><small className="muted">{s.wins}W / {s.losses}L</small></div>
        <div className="stat"><span>Profit factor</span><strong>{s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}</strong></div>
        <div className="stat"><span>Expectativa / trade</span><strong className={pnlClass(s.expectancy)}>{fmtMoney(s.expectancy)}</strong></div>
        <div className="stat"><span>Ganho médio</span><strong className="pos">{fmtMoney(s.avgWin)}</strong></div>
        <div className="stat"><span>Perda média</span><strong className="neg">{fmtMoney(-s.avgLoss)}</strong></div>
        <div className="stat"><span>Max drawdown</span><strong className="neg">{fmtMoney(-s.maxDrawdown)}</strong></div>
        <div className="stat"><span>Dias verdes</span><strong>{greenDays}/{days.length}</strong></div>
        <div className="stat"><span>Melhor dia</span><strong className="pos">{best ? fmtMoney(best.pnl) : '—'}</strong><small className="muted">{best?.label}</small></div>
        <div className="stat"><span>Pior dia</span><strong className="neg">{worst ? fmtMoney(worst.pnl) : '—'}</strong><small className="muted">{worst?.label}</small></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Equity curve</h3></div>
        {curve.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={curveColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={curveColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="n" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={shortMoney} width={60} />
              <ReferenceLine y={0} stroke="var(--border-strong)" />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
              <Area type="monotone" dataKey="equity" name="Equity" stroke={curveColor} strokeWidth={2} fill="url(#eq)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">Sem trades no período.</p>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>P&L por {PERIODS.find((p) => p.id === period)!.label.toLowerCase()}</h3>
          <div className="toggle">
            {PERIODS.map((p) => (
              <button key={p.id} className={period === p.id ? 'active' : ''} onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {buckets.length ? (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={buckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} tickFormatter={shortMoney} width={60} />
                <ReferenceLine y={0} stroke="var(--border-strong)" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="pnl" name="P&L" radius={[4, 4, 4, 4]} maxBarSize={36}>
                  {buckets.map((b) => <Cell key={b.key} fill={b.pnl >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="table-wrap scroll">
              <table className="table">
                <thead>
                  <tr><th>Período</th><th className="num">Trades</th><th className="num">Win rate</th><th className="num">P&L</th></tr>
                </thead>
                <tbody>
                  {[...buckets].reverse().map((b) => (
                    <tr key={b.key} className="static">
                      <td>{b.label}</td>
                      <td className="num">{b.trades}</td>
                      <td className="num">{fmtPct(b.winRate)}</td>
                      <td className={`num ${pnlClass(b.pnl)}`}>{fmtMoney(b.pnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="muted">Sem trades no período.</p>
        )}
      </div>

      {byWeekday.length > 0 && (
        <div className="card">
          <h3>P&L por dia da semana</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byWeekday} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={shortMoney} width={60} />
              <ReferenceLine y={0} stroke="var(--border-strong)" />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 4, 4]} maxBarSize={48}>
                {byWeekday.map((b) => <Cell key={b.label} fill={b.pnl >= 0 ? GREEN : RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
