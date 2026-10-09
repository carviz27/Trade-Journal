import { useState } from 'react';
import { useStore } from '../store';
import ListEditor from '../components/ListEditor';
import { makeDemoTrades } from '../demo';
import ConfirmButton from '../components/ConfirmButton';
import { todayStr, uid } from '../utils';

export default function SettingsPage() {
  const { settings, setSettings, trades, replaceAll } = useStore();
  const [newItem, setNewItem] = useState('');
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<{ trades: typeof trades; settings: typeof settings } | null>(null);

  const setChecklist = (checklist: typeof settings.checklist) => setSettings({ ...settings, checklist });
  const addItem = () => {
    if (!newItem.trim()) return;
    setChecklist([...settings.checklist, { id: uid(), text: newItem.trim() }]);
    setNewItem('');
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= settings.checklist.length) return;
    const c = [...settings.checklist];
    [c[i], c[j]] = [c[j], c[i]];
    setChecklist(c);
  };

  const backupJson = () => JSON.stringify({ version: 1, trades, settings }, null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(backupJson());
      setMsg('Backup copiado. Cola-o num ficheiro .json para o guardar.');
    } catch {
      setMsg('Não foi possível copiar. Usa "Exportar backup".');
    }
  };

  const exportJson = () => {
    const blob = new Blob([backupJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `trade-journal-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.trades) || !data.settings) throw new Error();
      setPending({ trades: data.trades, settings: data.settings });
      setMsg('');
    } catch {
      setPending(null);
      setMsg('Este ficheiro não é um backup válido do Trade Journal.');
    }
  };

  return (
    <div className="page">
      <div className="page-head"><h1>Definições</h1></div>

      <div className="card">
        <h3>Checklist pré-definida</h3>
        <p className="muted">Aparece em todas as trades novas para marcares o que cumpriste.</p>
        <ul className="edit-list">
          {settings.checklist.map((c, i) => (
            <li key={c.id}>
              <input
                value={c.text}
                onChange={(e) => setChecklist(settings.checklist.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))}
              />
              <button className="icon-btn" onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button className="icon-btn" onClick={() => move(i, 1)} aria-label="Descer">↓</button>
              <button className="icon-btn danger" onClick={() => setChecklist(settings.checklist.filter((x) => x.id !== c.id))} aria-label="Remover">×</button>
            </li>
          ))}
        </ul>
        <div className="row gap mt-s">
          <input
            placeholder="Nova regra da checklist…"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <button className="btn" onClick={addItem}>Adicionar</button>
        </div>
      </div>

      <div className="card">
        <h3>Mistakes</h3>
        <ListEditor items={settings.mistakes} onChange={(mistakes) => setSettings({ ...settings, mistakes })} placeholder="Novo mistake…" />
      </div>

      <div className="card">
        <h3>Setups</h3>
        <ListEditor items={settings.setups} onChange={(setups) => setSettings({ ...settings, setups })} placeholder="Novo setup…" />
      </div>

      <div className="card">
        <h3>Dados</h3>
        <p className="muted">Os dados ficam guardados neste browser. Faz backup regularmente.</p>
        <div className="row gap wrap">
          <button className="btn" onClick={exportJson}>Exportar backup (JSON)</button>
          <label className="btn">
            Importar backup
            <input type="file" accept="application/json" hidden onChange={(e) => { if (e.target.files?.[0]) importJson(e.target.files[0]); e.target.value = ''; }} />
          </label>
          <button className="btn" onClick={copyJson}>Copiar backup</button>
          <ConfirmButton confirmLabel="Clica de novo para adicionar" onConfirm={() => replaceAll([...trades, ...makeDemoTrades(settings)], settings)}>
            Carregar dados de exemplo
          </ConfirmButton>
          <ConfirmButton className="btn danger" confirmLabel="Clica de novo para apagar tudo" onConfirm={() => replaceAll([], settings)}>
            Apagar todas as trades
          </ConfirmButton>
        </div>
        {pending && (
          <div className="notice">
            <span>Importar {pending.trades.length} trades? Isto substitui os dados atuais.</span>
            <div className="row gap">
              <button className="btn" onClick={() => setPending(null)}>Cancelar</button>
              <button
                className="btn primary"
                onClick={() => {
                  replaceAll(pending.trades, pending.settings);
                  setPending(null);
                  setMsg('Backup importado.');
                }}
              >
                Importar
              </button>
            </div>
          </div>
        )}
        {msg && <p className="muted mt-s">{msg}</p>}
      </div>
    </div>
  );
}
