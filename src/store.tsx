import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { get, set } from 'idb-keyval';
import type { Settings, Trade } from './types';
import { uid } from './utils';

const DEFAULT_SETTINGS: Settings = {
  checklist: [
    { id: uid(), text: 'Tendência do timeframe superior a favor' },
    { id: uid(), text: 'Setup válido segundo o meu plano' },
    { id: uid(), text: 'Stop loss definido antes de entrar' },
    { id: uid(), text: 'Risco ≤ 1% da conta' },
    { id: uid(), text: 'Sem notícias de alto impacto próximas' },
  ],
  mistakes: [
    'FOMO',
    'Entrada antecipada',
    'Mover o stop',
    'Overtrading',
    'Revenge trade',
    'Sair cedo demais',
    'Size demasiado grande',
    'Não seguir o plano',
  ],
  setups: ['Breakout', 'Pullback', 'Reversão', 'Range'],
};

interface Store {
  loaded: boolean;
  trades: Trade[];
  settings: Settings;
  saveTrade: (t: Trade) => void;
  deleteTrade: (id: string) => void;
  setSettings: (s: Settings) => void;
  replaceAll: (trades: Trade[], settings: Settings) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    Promise.all([get<Trade[]>('trades'), get<Settings>('settings')]).then(([t, s]) => {
      if (t) setTrades(t);
      if (s) setSettingsState(s);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) set('trades', trades);
  }, [trades, loaded]);

  useEffect(() => {
    if (loaded) set('settings', settings);
  }, [settings, loaded]);

  const saveTrade = useCallback((t: Trade) => {
    setTrades((prev) => {
      const i = prev.findIndex((x) => x.id === t.id);
      if (i === -1) return [...prev, t];
      const copy = [...prev];
      copy[i] = t;
      return copy;
    });
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const replaceAll = useCallback((t: Trade[], s: Settings) => {
    setTrades(t);
    setSettingsState(s);
  }, []);

  return (
    <Ctx.Provider
      value={{ loaded, trades, settings, saveTrade, deleteTrade, setSettings: setSettingsState, replaceAll }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}
