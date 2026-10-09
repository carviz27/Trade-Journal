import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}

// Primeiro clique pede confirmação, segundo clique executa (sem pop-ups do browser).
export default function ConfirmButton({ children, confirmLabel, onConfirm, className = 'btn' }: Props) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      className={`${className} ${armed ? 'armed' : ''}`}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
