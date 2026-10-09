export type Side = 'long' | 'short';

export interface TradeImage {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  symbol: string;
  side: Side;
  entry: number | null;
  exit: number | null;
  quantity: number | null;
  fees: number;
  pnl: number; // P&L líquido
  setup: string;
  mistakes: string[];
  checklist: Record<string, boolean>; // id do item -> cumprido
  notes: string;
  images: TradeImage[];
  rating: number; // 0-5
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface Settings {
  checklist: ChecklistItem[];
  mistakes: string[];
  setups: string[];
}
