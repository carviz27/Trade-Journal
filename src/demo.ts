import type { Settings, Trade } from './types';
import { toDateStr, uid } from './utils';

const SYMBOLS = ['ES', 'NQ', 'MNQ', 'CL', 'GC'];

export function makeDemoTrades(settings: Settings): Trade[] {
  const trades: Trade[] = [];
  const end = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const wd = d.getDay();
    if (wd === 0 || wd === 6 || Math.random() < 0.2) continue;
    const n = 1 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) {
      const win = Math.random() < 0.55;
      const pnl = Math.round((win ? 80 + Math.random() * 500 : -(60 + Math.random() * 380)) * 4) / 4;
      const mistakes =
        !win && Math.random() < 0.7
          ? [settings.mistakes[Math.floor(Math.random() * settings.mistakes.length)]].filter(Boolean)
          : [];
      const checklist: Record<string, boolean> = {};
      settings.checklist.forEach((c) => (checklist[c.id] = Math.random() < (win ? 0.85 : 0.55)));
      trades.push({
        id: uid(),
        date: toDateStr(d),
        time: `${String(14 + k).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        side: Math.random() < 0.5 ? 'long' : 'short',
        entry: null,
        exit: null,
        quantity: 1 + Math.floor(Math.random() * 3),
        fees: 4.5,
        pnl,
        setup: settings.setups[Math.floor(Math.random() * settings.setups.length)] ?? '',
        mistakes,
        checklist,
        notes: '',
        images: [],
        rating: win ? 4 : 2,
        createdAt: Date.now() + trades.length,
      });
    }
  }
  return trades;
}
