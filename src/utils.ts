import type { Trade } from './types';

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function fmtMoney(n: number): string {
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? '-' : ''}$${abs}`;
}

export const fmtPct = (n: number) => `${Math.round(n)}%`;

export const pnlClass = (n: number) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayStr = () => toDateStr(new Date());

export function fmtDate(s: string): string {
  return parseDate(s).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function sortTrades(trades: Trade[]): Trade[] {
  return [...trades].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.time.localeCompare(b.time) ||
      a.createdAt - b.createdAt,
  );
}

export type Period = 'day' | 'week' | 'month';

function periodKey(date: string, period: Period): string {
  if (period === 'day') return date;
  if (period === 'month') return date.slice(0, 7);
  // semana começa ao domingo (igual ao calendário)
  const d = parseDate(date);
  d.setDate(d.getDate() - d.getDay());
  return toDateStr(d);
}

function periodLabel(key: string, period: Period): string {
  if (period === 'day') return fmtDate(key);
  if (period === 'month') {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('pt-PT', {
      month: 'short',
      year: 'numeric',
    });
  }
  return `Sem. ${parseDate(key).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;
}

export interface Bucket {
  key: string;
  label: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
}

export function bucketize(trades: Trade[], period: Period): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const t of trades) {
    const key = periodKey(t.date, period);
    let b = map.get(key);
    if (!b) {
      b = { key, label: periodLabel(key, period), pnl: 0, trades: 0, wins: 0, losses: 0, winRate: 0 };
      map.set(key, b);
    }
    b.pnl += t.pnl;
    b.trades += 1;
    if (t.pnl > 0) b.wins += 1;
    else if (t.pnl < 0) b.losses += 1;
  }
  const out = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const b of out) b.winRate = b.trades ? (b.wins / b.trades) * 100 : 0;
  return out;
}

export interface Stats {
  net: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
}

export function computeStats(trades: Trade[]): Stats {
  const sorted = sortTrades(trades);
  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let bestTrade = 0;
  let worstTrade = 0;
  for (const t of sorted) {
    if (t.pnl > 0) {
      wins++;
      grossProfit += t.pnl;
    } else if (t.pnl < 0) {
      losses++;
      grossLoss += -t.pnl;
    }
    bestTrade = Math.max(bestTrade, t.pnl);
    worstTrade = Math.min(worstTrade, t.pnl);
    equity += t.pnl;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }
  const n = sorted.length;
  return {
    net: grossProfit - grossLoss,
    trades: n,
    wins,
    losses,
    winRate: n ? (wins / n) * 100 : 0,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0,
    avgWin: wins ? grossProfit / wins : 0,
    avgLoss: losses ? grossLoss / losses : 0,
    expectancy: n ? (grossProfit - grossLoss) / n : 0,
    maxDrawdown,
    bestTrade,
    worstTrade,
  };
}

export function equityCurve(trades: Trade[]) {
  let eq = 0;
  return sortTrades(trades).map((t, i) => {
    eq += t.pnl;
    return { n: i + 1, date: t.date, label: `${fmtDate(t.date)} · ${t.symbol}`, equity: eq, pnl: t.pnl };
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
