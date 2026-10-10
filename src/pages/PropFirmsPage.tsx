import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../store';
import type { PropTx, PropTxType } from '../types';
import { fmtDate, fmtMoney, pnlClass, toDateStr, todayStr, uid } from '../utils';
import ConfirmButton from '../components/ConfirmButton';
import ChartTooltip from '../components/ChartTooltip';

const CATEGORIES = ['Avaliação', 'Reset', 'Ativação', 'Mensalidade', 'Data fee', 'Outro'];
const SUGGESTED_FIRMS = ['Topstep', 'Apex Trader Funding', 'Lucid Trading', 'Tradeify', 'Take Profit Trader', 'My Funded Futures'];

const RANGES = [
  { id: 'all', label: 'Tudo' },
  { id: '30', label: '30D' },
  { id: '90', label: '90D' },
  { id: 'ytd', label: 'Este ano' },
] as const;
type Range = (typeof RANGES)[number]['id'];

const axisProps = { stroke: 'var(--muted)', fontSize: 11, tickLine: false, axisLine: false } as const;
const shortMoney = (v: number) =>
  Math.abs(v) >= 1000 ? `${v < 0 ? '-' : ''}$${(Math.abs(v) / 1000).toFixed(1)}k` : `${v < 0 ? '-' : ''}$${Math.abs(v)}`;
const fmtRoi = (roi: number | null) => (roi === null ? '—' : `${roi > 0 ? '+' : ''}${roi.toFixed(1)}%`);

interface Summary {
  expenses: number;
  payouts: number;
  net: number;
  roi: number | null;
  payoutCount: number;
  evals: number;
}

function summarize(txs: PropTx[]): Summary {
  const expenses = txs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const payoutTx = txs.filter((t) => t.type === 'payout');
  const payouts = payoutTx.reduce((a, t) => a + t.amount, 0);
  return {
    expenses,
    payouts,
    net: payouts - expenses,
    roi: expenses ? ((payouts - expenses) / expenses) * 100 : null,
    payoutCount: payoutTx.length,
    evals: txs.filter((t) => t.type === 'expense' && t.category === 'Avaliação').length,
  };
}

const emptyTx = (type: PropTxType, firm = ''): PropTx => ({
  id: uid(),
  date: todayStr(),
  firm,
  type,
  category: type === 'expense' ? 'Avaliação' : '',
  account: '',
  amount: 0,
  notes: '',
});

export default function PropFirmsPage() {
  const { propTx, saveProp, deleteProp } = useStore();
  const [range, setRange] = useState<Range>('all');
  const [firmFilter, setFirmFilter] = useState('');
  const [editing, setEditing] = useState<PropTx | null>(null);
  const [amount, setAmount] = useState('');

  const filtered = useMemo(() => {
    if (range === 'all') return propTx;
    const now = new Date();
    let from: string;
    if (range === 'ytd') from = `${now.getFullYear()}-01-01`;
    else {
      const d = new Date(now);
      d.setDate(d.getDate() - Number(range) + 1);
      from = toDateStr(d);
    }
    return propTx.filter((t) => t.date >= from);
  }, [propTx, range]);

  const s = summarize(filtered);
  const firms = [...new Set(propTx.map((t) => t.firm))].sort();

  const byFirm = firms
    .map((firm) => ({ firm, ...summarize(filtered.filter((t) => t.firm === firm)) }))
    .filter((f) => f.expenses || f.payouts)
    .sort((a, b) => b.net - a.net);

  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  let acc = 0;
  const curve = sorted.map((t) => {
    acc += t.type === 'payout' ? t.amount : -t.amount;
    return { label: `${fmtDate(t.date)} · ${t.firm}`, net: acc };
  });

  const monthly = new Map<string, { key: string; label: string; Despesas: number; Payouts: number }>();
  for (const t of sorted) {
    const key = t.date.slice(0, 7);
    const [y, m] = key.split('-').map(Number);
    const row = monthly.get(key) ?? {
      key,
      label: new Date(y, m - 1, 1).toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
      Despesas: 0,
      Payouts: 0,
    };
    if (t.type === 'expense') row.Despesas += t.amount;
    else row.Payouts += t.amount;
    monthly.set(key, row);
  }
  const months = [...monthly.values()];

  const history = [...filtered]
    .filter((t) => !firmFilter || t.firm === firmFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const open = (tx: PropTx) => {
    setEditing(tx);
    setAmount(tx.amount ? String(tx.amount) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const value = Math.abs(Number(amount.replace(',', '.')));
    if (!value || !editing.firm.trim()) return;
    saveProp({ ...editing, firm: editing.firm.trim(), account: editing.account.trim(), amount: value });
    setEditing(null);
  };

  const up = (patch: Partial<PropTx>) => editing && setEditing({ ...editing, ...patch });
  const isExisting = editing && propTx.some((t) => t.id === editing.id);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Prop Firms</h1>
        <div className="row gap wrap">
          <div className="toggle">
            {RANGES.map((r) => (
              <button key={r.id} className={range === r.id ? 'active' : ''} onClick={() => setRange(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
          <button className="btn" onClick={() => open(emptyTx('expense', firmFilter))}>+ Despesa</button>
          <button className="btn primary" onClick={() => open(emptyTx('payout', firmFilter))}>+ Payout</button>
        </div>
      </div>

      {editing && (
        <form className="card" onSubmit={submit}>
          <div className="card-head">
            <h3>{isExisting ? 'Editar registo' : editing.type === 'expense' ? 'Nova despesa' : 'Novo payout'}</h3>
            <div className="toggle">
              <button type="button" className={editing.type === 'expense' ? 'active short' : ''} onClick={() => up({ type: 'expense', category: editing.category || 'Avaliação' })}>Despesa</button>
              <button type="button" className={editing.type === 'payout' ? 'active long' : ''} onClick={() => up({ type: 'payout', category: '' })}>Payout</button>
            </div>
          </div>
          <div className="fields">
            <label>Data<input type="date" required value={editing.date} onChange={(e) => up({ date: e.target.value })} /></label>
            <label>
              Prop firm
              <input required list="firms" placeholder="Ex.: Topstep" value={editing.firm} onChange={(e) => up({ firm: e.target.value })} />
              <datalist id="firms">
                {[...new Set([...firms, ...SUGGESTED_FIRMS])].map((f) => <option key={f} value={f} />)}
              </datalist>
            </label>
            {editing.type === 'expense' && (
              <label>
                Tipo de despesa
                <select value={editing.category} onChange={(e) => up({ category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            )}
            <label>Conta<input placeholder="Ex.: 50K #2" value={editing.account} onChange={(e) => up({ account: e.target.value })} /></label>
            <label>Valor ($)<input required inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
            <label className="span-2">Notas<input placeholder={editing.type === 'expense' ? 'Ex.: código de desconto 80%' : 'Ex.: primeiro payout desta conta'} value={editing.notes} onChange={(e) => up({ notes: e.target.value })} /></label>
          </div>
          <div className="row gap mt-s">
            <button type="submit" className="btn primary">Guardar</button>
            <button type="button" className="btn" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="stat-grid four">
        <div className="stat big"><span>Lucro líquido</span><strong className={pnlClass(s.net)}>{fmtMoney(s.net)}</strong><small className="muted">payouts − despesas</small></div>
        <div className="stat big"><span>ROI</span><strong className={pnlClass(s.roi ?? 0)}>{fmtRoi(s.roi)}</strong><small className="muted">sobre o total gasto</small></div>
        <div className="stat"><span>Total gasto</span><strong className="neg">{fmtMoney(-s.expenses)}</strong></div>
        <div className="stat"><span>Total payouts</span><strong className="pos">{fmtMoney(s.payouts)}</strong></div>
        <div className="stat"><span>Nº de payouts</span><strong>{s.payoutCount}</strong><small className="muted">média {fmtMoney(s.payoutCount ? s.payouts / s.payoutCount : 0)}</small></div>
        <div className="stat"><span>Avaliações compradas</span><strong>{s.evals}</strong><small className="muted">{s.evals ? `${(s.payoutCount / s.evals).toFixed(2)} payouts por avaliação` : '—'}</small></div>
        <div className="stat"><span>Payouts / gasto</span><strong>{s.expenses ? `${(s.payouts / s.expenses).toFixed(2)}×` : '—'}</strong></div>
        <div className="stat"><span>Prop firms</span><strong>{byFirm.length}</strong></div>
      </div>

      {propTx.length === 0 ? (
        <div className="card empty-state">
          <p>Ainda não registaste despesas nem payouts.</p>
          <p className="muted">Começa por adicionar o que pagaste por avaliações, resets e ativações, e cada payout que recebeste.</p>
          <div className="row gap">
            <button className="btn" onClick={() => open(emptyTx('expense'))}>+ Despesa</button>
            <button className="btn primary" onClick={() => open(emptyTx('payout'))}>+ Payout</button>
          </div>
        </div>
      ) : (
        <>
          <div className="form-grid">
            <div className="card">
              <h3>Lucro líquido acumulado</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="propNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.net >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={s.net >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--grid)" vertical={false} />
                  <XAxis dataKey="label" hide />
                  <YAxis {...axisProps} tickFormatter={shortMoney} width={60} />
                  <ReferenceLine y={0} stroke="var(--border-strong)" />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
                  <Area type="stepAfter" dataKey="net" name="Líquido" stroke={s.net >= 0 ? 'var(--green)' : 'var(--red)'} strokeWidth={2} fill="url(#propNet)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>Despesas vs payouts por mês</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
                  <CartesianGrid stroke="var(--grid)" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={shortMoney} width={60} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                  <Bar dataKey="Despesas" fill="var(--red)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Payouts" fill="var(--green)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3>Por prop firm</h3>
            <div className="table-wrap">
              <table className="table mono-table">
                <thead>
                  <tr>
                    <th>Prop firm</th>
                    <th className="num">Gasto</th>
                    <th className="num">Payouts</th>
                    <th className="num">Líquido</th>
                    <th className="num">ROI</th>
                    <th className="num">Avaliações</th>
                    <th className="num">Nº payouts</th>
                  </tr>
                </thead>
                <tbody>
                  {byFirm.map((f) => (
                    <tr key={f.firm} className={firmFilter === f.firm ? 'row-selected' : ''} onClick={() => setFirmFilter(firmFilter === f.firm ? '' : f.firm)}>
                      <td><span className="sym">{f.firm}</span></td>
                      <td className="num neg">{fmtMoney(-f.expenses)}</td>
                      <td className="num pos">{fmtMoney(f.payouts)}</td>
                      <td className={`num ${pnlClass(f.net)}`}>{fmtMoney(f.net)}</td>
                      <td className={`num ${pnlClass(f.roi ?? 0)}`}>{fmtRoi(f.roi)}</td>
                      <td className="num">{f.evals}</td>
                      <td className="num">{f.payoutCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small-note">Clica numa prop firm para ver só os registos dela no histórico.</p>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Histórico {firmFilter && <span className="muted">· {firmFilter}</span>}</h3>
              {firmFilter && <button className="btn small" onClick={() => setFirmFilter('')}>Ver todas</button>}
            </div>
            <div className="table-wrap scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Prop firm</th>
                    <th>Tipo</th>
                    <th>Conta</th>
                    <th>Notas</th>
                    <th className="num">Valor</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {history.map((t) => (
                    <tr key={t.id} className="static">
                      <td>{fmtDate(t.date)}</td>
                      <td><strong>{t.firm}</strong></td>
                      <td>
                        <span className={`tag ${t.type === 'payout' ? 'long' : 'short'}`}>
                          {t.type === 'payout' ? 'PAYOUT' : t.category.toUpperCase()}
                        </span>
                      </td>
                      <td>{t.account || <span className="muted">—</span>}</td>
                      <td className="muted cell-notes">{t.notes}</td>
                      <td className={`num ${t.type === 'payout' ? 'pos' : 'neg'}`}>
                        {fmtMoney(t.type === 'payout' ? t.amount : -t.amount)}
                      </td>
                      <td className="num">
                        <div className="row gap-s">
                          <button className="btn small" onClick={() => open(t)}>Editar</button>
                          <ConfirmButton className="btn small danger" confirmLabel="Confirmar" onConfirm={() => deleteProp(t.id)}>Apagar</ConfirmButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
