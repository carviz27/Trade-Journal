import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { get, set } from 'idb-keyval';
import type { PropTx, Settings, Trade } from './types';
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
  // propTx omitido = mantém os registos de prop firms atuais
  replaceAll: (trades: Trade[], settings: Settings, propTx?: PropTx[]) => void;
  propTx: PropTx[];
  saveProp: (p: PropTx) => void;
  deleteProp: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [propTx, setPropTx] = useState<PropTx[]>([]);

  useEffect(() => {
    Promise.all([get<Trade[]>('trades'), get<Settings>('settings'), get<PropTx[]>('propTx')]).then(([t, s, p]) => {
      if (t) setTrades(t);
      if (p) setPropTx(p);
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

  useEffect(() => {
    if (loaded) set('propTx', propTx);
  }, [propTx, loaded]);

  const saveProp = useCallback((p: PropTx) => {
    setPropTx((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]));
  }, []);

  const deleteProp = useCallback((id: string) => {
    setPropTx((prev) => prev.filter((p) => p.id !== id));
  }, []);

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

  const replaceAll = useCallback((t: Trade[], s: Settings, p?: PropTx[]) => {
    setTrades(t);
    setSettingsState(s);
    if (p) setPropTx(p);
  }, []);

  return (
    <Ctx.Provider
      value={{ loaded, trades, settings, saveTrade, deleteTrade, setSettings: setSettingsState, replaceAll, propTx, saveProp, deleteProp }}
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
