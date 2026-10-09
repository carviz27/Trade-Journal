import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import ConfirmButton from '../components/ConfirmButton';
import { fmtDate, fmtMoney, pnlClass } from '../utils';

export default function TradeView() {
  const { id } = useParams();
  const { trades, settings, deleteTrade } = useStore();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const t = trades.find((x) => x.id === id);
  if (!t) return <div className="page muted">Trade não encontrada.</div>;
  const current = t.images[Math.min(active, t.images.length - 1)];

  const remove = () => {
    deleteTrade(t.id);
    navigate('/trades');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>
            {t.symbol} <span className={`tag ${t.side}`}>{t.side.toUpperCase()}</span>
          </h1>
          <span className="muted">{fmtDate(t.date)} · {t.time}</span>
        </div>
        <div className="row gap">
          <ConfirmButton className="btn danger" confirmLabel="Clica de novo para apagar" onConfirm={remove}>Apagar</ConfirmButton>
          <button className="btn primary" onClick={() => navigate(`/trades/${t.id}/edit`)}>Editar</button>
        </div>
      </div>

      {t.images.length > 0 && (
        <div className="card gallery">
          <figure className="gallery-main" onClick={() => setZoom(current.dataUrl)}>
            <img src={current.dataUrl} alt={current.caption} />
            {current.caption && <figcaption>{current.caption}</figcaption>}
          </figure>
          {t.images.length > 1 && (
            <div className="gallery-thumbs">
              {t.images.map((img, i) => (
                <button key={img.id} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>
                  <img src={img.dataUrl} alt={img.caption} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="stat-grid">
        <div className="stat"><span>P&L</span><strong className={pnlClass(t.pnl)}>{fmtMoney(t.pnl)}</strong></div>
        <div className="stat"><span>Entrada</span><strong>{t.entry ?? '—'}</strong></div>
        <div className="stat"><span>Saída</span><strong>{t.exit ?? '—'}</strong></div>
        <div className="stat"><span>Quantidade</span><strong>{t.quantity ?? '—'}</strong></div>
        <div className="stat"><span>Comissões</span><strong>{fmtMoney(t.fees)}</strong></div>
        <div className="stat"><span>Setup</span><strong>{t.setup || '—'}</strong></div>
        <div className="stat"><span>Execução</span><strong className="stars-static">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</strong></div>
      </div>

      <div className="form-grid">
        <div className="card">
          <h3>Checklist</h3>
          <ul className="checklist-view">
            {settings.checklist.map((c) => (
              <li key={c.id} className={t.checklist[c.id] ? 'ok' : 'no'}>
                {t.checklist[c.id] ? '✓' : '✗'} {c.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Mistakes</h3>
          {t.mistakes.length ? (
            <div className="chips">{t.mistakes.map((m) => <span key={m} className="chip on">{m}</span>)}</div>
          ) : (
            <p className="muted">Sem mistakes. 👌</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Notas</h3>
        <p className="notes">{t.notes || <span className="muted">Sem notas.</span>}</p>
      </div>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" />
        </div>
      )}
    </div>
  );
}
