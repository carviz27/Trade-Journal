import { useEffect, useState, type ClipboardEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import type { Trade } from '../types';
import { fmtMoney, readFileAsDataUrl, todayStr, uid } from '../utils';

const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));
const str = (n: number | null) => (n === null ? '' : String(n));

export default function TradeForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { trades, settings, saveTrade } = useStore();
  const navigate = useNavigate();
  const existing = id ? trades.find((t) => t.id === id) : undefined;

  const [t, setT] = useState<Trade>(
    () =>
      existing ?? {
        id: uid(),
        date: params.get('date') ?? todayStr(),
        time: new Date().toTimeString().slice(0, 5),
        symbol: '',
        side: 'long',
        entry: null,
        exit: null,
        quantity: null,
        fees: 0,
        pnl: 0,
        setup: '',
        mistakes: [],
        checklist: {},
        notes: '',
        images: [],
        rating: 0,
        createdAt: Date.now(),
      },
  );
  // campos numéricos como texto para permitir escrever "-", "1." etc.
  const [entry, setEntry] = useState(str(t.entry));
  const [exit, setExit] = useState(str(t.exit));
  const [qty, setQty] = useState(str(t.quantity));
  const [mult, setMult] = useState('1');
  const [fees, setFees] = useState(str(t.fees));
  const [pnl, setPnl] = useState(existing ? str(t.pnl) : '');

  const up = (patch: Partial<Trade>) => setT((prev) => ({ ...prev, ...patch }));

  const calcPnl = () => {
    const e = num(entry), x = num(exit), q = num(qty), m = num(mult) ?? 1, f = num(fees) ?? 0;
    if (e === null || x === null || q === null) return null;
    const gross = (t.side === 'long' ? x - e : e - x) * q * m;
    return Math.round((gross - f) * 100) / 100;
  };
  const suggested = calcPnl();

  const addFiles = async (files: FileList | File[]) => {
    const imgs = await Promise.all(
      [...files]
        .filter((f) => f.type.startsWith('image/'))
        .map(async (f) => ({ id: uid(), dataUrl: await readFileAsDataUrl(f), caption: '' })),
    );
    if (imgs.length) setT((prev) => ({ ...prev, images: [...prev.images, ...imgs] }));
  };

  // colar screenshots com Ctrl+V em qualquer ponto do formulário
  useEffect(() => {
    const onPaste = (e: Event) => {
      const files = (e as unknown as ClipboardEvent).clipboardData?.files;
      if (files && files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const toggleMistake = (m: string) =>
    up({ mistakes: t.mistakes.includes(m) ? t.mistakes.filter((x) => x !== m) : [...t.mistakes, m] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPnl = num(pnl) ?? suggested ?? 0;
    const trade: Trade = {
      ...t,
      symbol: t.symbol.trim().toUpperCase(),
      entry: num(entry),
      exit: num(exit),
      quantity: num(qty),
      fees: num(fees) ?? 0,
      pnl: finalPnl,
    };
    saveTrade(trade);
    navigate(`/trades/${trade.id}`);
  };

  const checklistDone = settings.checklist.filter((c) => t.checklist[c.id]).length;

  return (
    <form className="page" onSubmit={submit}>
      <div className="page-head">
        <h1>{existing ? 'Editar trade' : 'Nova trade'}</h1>
        <div className="row gap">
          <button type="button" className="btn" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn primary">Guardar</button>
        </div>
      </div>

      <div className="form-grid">
        <div className="card">
          <h3>Detalhes</h3>
          <div className="fields">
            <label>Data<input type="date" required value={t.date} onChange={(e) => up({ date: e.target.value })} /></label>
            <label>Hora de entrada<input type="time" step={1} value={t.time} onChange={(e) => up({ time: e.target.value })} /></label>
            <label>Hora de saída<input type="time" step={1} value={t.exitTime ?? ''} onChange={(e) => up({ exitTime: e.target.value })} /></label>
            <label>Símbolo<input required placeholder="ES, NQ, EURUSD…" value={t.symbol} onChange={(e) => up({ symbol: e.target.value })} /></label>
            <label>
              Lado
              <div className="toggle">
                <button type="button" className={t.side === 'long' ? 'active long' : ''} onClick={() => up({ side: 'long' })}>Long</button>
                <button type="button" className={t.side === 'short' ? 'active short' : ''} onClick={() => up({ side: 'short' })}>Short</button>
              </div>
            </label>
            <label>Entrada<input inputMode="decimal" value={entry} onChange={(e) => setEntry(e.target.value)} /></label>
            <label>Saída<input inputMode="decimal" value={exit} onChange={(e) => setExit(e.target.value)} /></label>
            <label>Quantidade<input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
            <label title="Valor por ponto (ex.: ES = 50, NQ = 20, MNQ = 2)">Multiplicador<input inputMode="decimal" value={mult} onChange={(e) => setMult(e.target.value)} /></label>
            <label>Comissões<input inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} /></label>
            <label>
              P&L líquido ($)
              <input
                inputMode="decimal"
                placeholder={suggested !== null ? String(suggested) : '0.00'}
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
              />
              {suggested !== null && pnl === '' && (
                <small className="muted">Calculado: {fmtMoney(suggested)}</small>
              )}
            </label>
            <label>
              Setup
              <select value={t.setup} onChange={(e) => up({ setup: e.target.value })}>
                <option value="">—</option>
                {settings.setups.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              Avaliação da execução
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} className={n <= t.rating ? 'on' : ''} onClick={() => up({ rating: n === t.rating ? 0 : n })}>★</button>
                ))}
              </div>
            </label>
          </div>
        </div>

        <div className="card">
          <h3>
            Checklist <span className="muted">{checklistDone}/{settings.checklist.length}</span>
          </h3>
          {settings.checklist.length === 0 && (
            <p className="muted">Define a tua checklist nas Definições.</p>
          )}
          <div className="checklist">
            {settings.checklist.map((c) => (
              <label key={c.id} className={`check ${t.checklist[c.id] ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={!!t.checklist[c.id]}
                  onChange={(e) => up({ checklist: { ...t.checklist, [c.id]: e.target.checked } })}
                />
                {c.text}
              </label>
            ))}
          </div>

          <h3 className="mt">Mistakes</h3>
          <div className="chips">
            {settings.mistakes.map((m) => (
              <button type="button" key={m} className={`chip ${t.mistakes.includes(m) ? 'on' : ''}`} onClick={() => toggleMistake(m)}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Descrição / notas</h3>
        <textarea
          rows={6}
          placeholder="Porque entrei, como geri, o que senti, o que faria diferente…"
          value={t.notes}
          onChange={(e) => up({ notes: e.target.value })}
        />
      </div>

      <div className="card">
        <h3>Imagens</h3>
        <label
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <input type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
          Arrasta imagens, clica para escolher, ou cola com <kbd>Ctrl</kbd>+<kbd>V</kbd>
        </label>
        <div className="images">
          {t.images.map((img) => (
            <div key={img.id} className="image-item">
              <img src={img.dataUrl} alt={img.caption} />
              <input
                placeholder="Legenda (ex.: entrada 5m)"
                value={img.caption}
                onChange={(e) =>
                  up({ images: t.images.map((x) => (x.id === img.id ? { ...x, caption: e.target.value } : x)) })
                }
              />
              <button type="button" className="btn danger small" onClick={() => up({ images: t.images.filter((x) => x.id !== img.id) })}>
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
