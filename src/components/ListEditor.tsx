import { useState } from 'react';

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}

export default function ListEditor({ items, onChange, placeholder }: Props) {
  const [value, setValue] = useState('');
  const add = () => {
    const v = value.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setValue('');
  };
  return (
    <div>
      <div className="chips">
        {items.map((m) => (
          <span key={m} className="chip on removable">
            {m}
            <button type="button" onClick={() => onChange(items.filter((x) => x !== m))} aria-label={`Remover ${m}`}>×</button>
          </span>
        ))}
      </div>
      <div className="row gap mt-s">
        <input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button type="button" className="btn" onClick={add}>Adicionar</button>
      </div>
    </div>
  );
}
