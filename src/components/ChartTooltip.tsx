import { fmtMoney } from '../utils';

interface Props {
  active?: boolean;
  label?: string;
  payload?: { value: number; name: string; payload: Record<string, unknown> }[];
  labelKey?: string;
}

export default function ChartTooltip({ active, payload, labelKey }: Props) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="muted">{String(row[labelKey ?? 'label'])}</div>
      {payload.map((p) => (
        <div key={p.name}>
          {p.name}: <strong>{fmtMoney(p.value)}</strong>
        </div>
      ))}
      {typeof row.trades === 'number' && <div className="muted">{row.trades} trades</div>}
    </div>
  );
}
