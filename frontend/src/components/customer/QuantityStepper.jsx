import React from 'react';
import { Plus, Minus } from 'lucide-react';

export default function QuantityStepper({ name, quantity, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-raised p-1">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={`Kurangi ${name}`}
        className="grid h-8 w-8 place-items-center rounded-full text-ink transition hover:bg-raised-2 active:scale-90"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[1.5rem] text-center text-sm font-bold text-ink" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`Tambah ${name}`}
        className="grid h-8 w-8 place-items-center rounded-full bg-accent text-on-accent transition hover:bg-accent-hover active:scale-90"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
