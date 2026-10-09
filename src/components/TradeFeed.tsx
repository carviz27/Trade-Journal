import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Trade } from '../types';
import { useStore } from '../store';
import { fmtDate, fmtMoney, pnlClass, sortTrades } from '../utils';

interface Props {
  trades: Trade[];
  newestFirst: boolean;
}

export default function TradeFeed({ trades, newestFirst }: Props) {
  const { settings } = useStore();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState<string | null>(null);

  const sorted = sortTrades(trades);
  if (newestFirst) sorted.reverse();

  // agrupar por dia, mantendo a ordem
  const days: { date: string; trades: Trade[] }[] = [];
  for (const t of sorted) {
    const last = days[days.length - 1];
    if (last && last.date === t.date) last.trades.push(t);
    else days.push({ date: t.date, trades: [t] });
  }

  return (
    <div className="feed">
      {days.map((d) => {
        const dayPnl = d.trades.reduce((a, t) => a + t.pnl, 0);
        return (
          <section key={d.date} className="feed-day">
            <div className="feed-sep">
              <span>{fmtDate(d.date)}</span>
              <span className={pnlClass(dayPnl)}>{fmtMoney(dayPnl)}</span>
            </div>
            {d.trades.map((t) => {
              const total = settings.checklist.length;
              const done = settings.checklist.filter((c) => t.checklist[c.id]).length;
              return (
                <article key={t.id} className="post">
                  <header className="post-head">
                    <button className="post-title" onClick={() => navigate(`/trades/${t.id}`)}>
                      <strong>{t.symbol}</strong>
                      <span className={`tag ${t.side}`}>{t.side.toUpperCase()}</span>
                      {t.setup && <span className="muted">{t.setup}</span>}
                      <span className="muted">{t.time}</span>
                    </button>
                    <div className="post-right">
                      <strong className={`post-pnl ${pnlClass(t.pnl)}`}>{fmtMoney(t.pnl)}</strong>
                      <button className="btn small" onClick={() => navigate(`/trades/${t.id}/edit`)}>Editar</button>
                    </div>
                  </header>

                  {t.notes && <p className="post-notes">{t.notes}</p>}

                  {t.images.length > 0 && (
                    <div className={`post-images n${Math.min(t.images.length, 3)}`}>
                      {t.images.map((img) => (
                        <figure key={img.id} onClick={() => setZoom(img.dataUrl)}>
                          <img src={img.dataUrl} alt={img.caption} loading="lazy" />
                          {img.caption && <figcaption>{img.caption}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  )}

                  {(t.mistakes.length > 0 || total > 0 || t.rating > 0) && (
                    <footer className="post-foot">
                      {total > 0 && <span className="muted">Checklist {done}/{total}</span>}
                      {t.rating > 0 && <span className="stars-static">{'★'.repeat(t.rating)}</span>}
                      {t.mistakes.map((m) => (
                        <span key={m} className="tag mistake">{m}</span>
                      ))}
                    </footer>
                  )}
                </article>
              );
            })}
          </section>
        );
      })}

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" />
        </div>
      )}
    </div>
  );
}
