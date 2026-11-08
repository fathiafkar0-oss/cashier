import React, { useState } from 'react';
import { Calculator, Delete, Check, X, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const formatCalcExpression = (expr) => {
  if (!expr && expr !== 0) return '0';
  const str = expr.toString();
  return str
    .replace(/(\d+)(\.\d+)?/g, (match, intPart, decPart) => {
      const formattedInt = Number(intPart).toLocaleString('id-ID');
      return decPart ? `${formattedInt}${decPart}` : formattedInt;
    })
    .replace(/([+×÷\-])/g, ' $1 ');
};

export default function QuickCalculator({ 
  isOpen, 
  onClose, 
  onApply, 
  applyLabel = "Terapkan Hasil",
  onSecondaryApply,
  secondaryApplyLabel,
  title = "Kalkulator Cepat"
}) {
  const [display, setDisplay] = useState('0');
  const [prevExpr, setPrevExpr] = useState('');

  if (!isOpen) return null;

  const handleKey = (val) => {
    if (val === 'C') {
      setDisplay('0');
      setPrevExpr('');
    } else if (val === 'DEL') {
      if (display.length <= 1) {
        setDisplay('0');
      } else {
        setDisplay(display.slice(0, -1));
      }
    } else if (val === '=') {
      try {
        const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '*0.01');
        if (/^[\d+\-*/. ()]+$/.test(sanitized)) {
          // eslint-disable-next-line no-eval
          const res = Function(`'use strict'; return (${sanitized})`)();
          const finalNum = Math.round(Number(res) || 0);
          setPrevExpr(formatCalcExpression(display) + ' =');
          setDisplay(finalNum.toString());
        }
      } catch (err) {
        toast.error('Format hitungan keliru');
      }
    } else if (val === '000') {
      if (display !== '0') {
        const lastChar = display.slice(-1);
        if (!['+', '-', '×', '÷'].includes(lastChar)) {
          setDisplay(prev => prev + '000');
        }
      }
    } else if (['+', '-', '×', '÷'].includes(val)) {
      const lastChar = display.slice(-1);
      if (['+', '-', '×', '÷'].includes(lastChar)) {
        setDisplay(display.slice(0, -1) + val);
      } else {
        setDisplay(prev => prev + val);
      }
    } else {
      if (display === '0') {
        setDisplay(val);
      } else {
        setDisplay(prev => prev + val);
      }
    }
  };

  const getComputedResult = () => {
    try {
      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '*0.01');
      if (/^[\d+\-*/. ()]+$/.test(sanitized)) {
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        return Math.round(Number(res) || 0);
      }
      return parseInt(display) || 0;
    } catch {
      return parseInt(display) || 0;
    }
  };

  const handleApply = (callback) => {
    const finalVal = getComputedResult();
    if (callback) {
      callback(finalVal);
      if (onClose) onClose();
    } else {
      navigator.clipboard?.writeText(finalVal.toString());
      toast.success(`Rp ${finalVal.toLocaleString('id-ID')} disalin ke clipboard!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1c1a18]/95 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),_inset_0_1px_2px_rgba(255,255,255,0.15)] max-w-sm w-full relative z-[10000] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Calculator size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white leading-tight">{title}</h3>
              <p className="text-[10px] text-white/40 font-medium">Hitung cepat nominal & nota</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-[#100f0e] rounded-2xl border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)] text-right">
          {prevExpr && (
            <div className="text-xs text-white/40 font-mono truncate mb-1">{prevExpr}</div>
          )}
          <div className="text-2xl sm:text-3xl font-black text-[#F4F3ED] font-mono tracking-wider overflow-x-auto whitespace-nowrap">
            {formatCalcExpression(display)}
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2 text-xs font-bold">
          {/* Row 1 */}
          <button
            type="button"
            onClick={() => handleKey('C')}
            className="py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 active:scale-95 transition cursor-pointer font-black"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleKey('DEL')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 active:scale-95 transition cursor-pointer flex items-center justify-center"
          >
            <Delete size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleKey('÷')}
            className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F4F3ED] border border-white/15 active:scale-95 transition cursor-pointer font-black text-sm"
          >
            ÷
          </button>
          <button
            type="button"
            onClick={() => handleKey('×')}
            className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F4F3ED] border border-white/15 active:scale-95 transition cursor-pointer font-black text-sm"
          >
            ×
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleKey('7')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleKey('8')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleKey('9')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleKey('-')}
            className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F4F3ED] border border-white/15 active:scale-95 transition cursor-pointer font-black text-sm"
          >
            -
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => handleKey('4')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleKey('5')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleKey('6')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleKey('+')}
            className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F4F3ED] border border-white/15 active:scale-95 transition cursor-pointer font-black text-sm"
          >
            +
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleKey('1')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleKey('2')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleKey('3')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleKey('=')}
            className="py-3 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-300 border border-amber-500/30 active:scale-95 transition cursor-pointer font-black text-sm"
          >
            =
          </button>

          {/* Row 5 */}
          <button
            type="button"
            onClick={() => handleKey('0')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleKey('000')}
            className="py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F4F3ED] border border-white/10 active:scale-95 transition cursor-pointer font-mono text-xs font-bold"
          >
            000
          </button>
          <button
            type="button"
            onClick={() => handleKey('.')}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-95 transition cursor-pointer font-mono text-sm font-black"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => handleApply(null)}
            title="Salin Angka"
            className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95 transition cursor-pointer flex items-center justify-center"
          >
            <Copy size={14} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {onApply && (
            <button
              type="button"
              onClick={() => handleApply(onApply)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)] text-xs"
            >
              <Check size={15} />
              <span>{applyLabel}</span>
            </button>
          )}

          {onSecondaryApply && (
            <button
              type="button"
              onClick={() => handleApply(onSecondaryApply)}
              className="w-full py-3 rounded-xl bg-[#F4F3ED] hover:bg-white text-[#1E1E1E] font-extrabold active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.25)] text-xs"
            >
              <Check size={15} />
              <span>{secondaryApplyLabel || "Terapkan Opsi 2"}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
