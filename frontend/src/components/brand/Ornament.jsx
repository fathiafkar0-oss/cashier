import React from 'react';

/** Garis emas dengan ornamen belah ketupat: pemisah klasik antar bagian. */
export default function Ornament({ className = '' }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-gold/45" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
      <span className="h-2.5 w-2.5 rotate-45 border border-gold" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
      <span className="h-px flex-1 bg-gold/45" />
    </div>
  );
}
