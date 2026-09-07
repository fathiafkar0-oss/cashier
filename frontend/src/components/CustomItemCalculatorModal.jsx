import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Minus, X, ShoppingCart, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomItemCalculatorModal({ isOpen, onClose, onAddToCart }) {
  const [itemName, setItemName] = useState('');
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setItemName('');
      setDisplay('0');
      setPrevVal(null);
      setOperation(null);
      setWaitingForOperand(false);
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDisplayNumber = (val) => {
    if (!val || isNaN(val)) return '0';
    const num = parseInt(val.toString().replace(/\D/g, '') || '0', 10);
    return num.toLocaleString('id-ID');
  };

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      if (display === '0') {
        setDisplay(String(digit));
      } else {
        const next = display + String(digit);
        if (next.length <= 11) {
          setDisplay(next);
        }
      }
    }
  };

  const inputTripleZero = () => {
    if (waitingForOperand) {
      setDisplay('0');
      setWaitingForOperand(false);
    } else if (display !== '0') {
      const next = display + '000';
      if (next.length <= 11) {
        setDisplay(next);
      }
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevVal(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const addPreset = (amount) => {
    const current = parseInt(display.replace(/\D/g, '') || '0', 10);
    setDisplay(String(current + amount));
  };

  const performOperation = (nextOp) => {
    const inputValue = parseInt(display.replace(/\D/g, '') || '0', 10);

    if (prevVal === null) {
      setPrevVal(inputValue);
    } else if (operation) {
      const current = prevVal || 0;
      let result = 0;
      if (operation === '+') result = current + inputValue;
      else if (operation === '-') result = Math.max(0, current - inputValue);
      else if (operation === '×') result = current * inputValue;
      else if (operation === '÷') result = inputValue !== 0 ? Math.floor(current / inputValue) : 0;

      setDisplay(String(result));
      setPrevVal(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  };

  const handleEqual = () => {
    if (!operation || prevVal === null) return;
    const inputValue = parseInt(display.replace(/\D/g, '') || '0', 10);
    let result = 0;
    if (operation === '+') result = prevVal + inputValue;
    else if (operation === '-') result = Math.max(0, prevVal - inputValue);
    else if (operation === '×') result = prevVal * inputValue;
    else if (operation === '÷') result = inputValue !== 0 ? Math.floor(prevVal / inputValue) : 0;

    setDisplay(String(result));
    setPrevVal(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleAdd = () => {
    const currentPrice = parseInt(display.replace(/\D/g, '') || '0', 10);
    if (currentPrice <= 0) {
      toast.error('Masukkan nominal harga barang yang valid');
      return;
    }

    const finalName = itemName.trim() || 'Barang Lain';
    onAddToCart({
      product_id: 'custom_' + Date.now(),
      name: finalName,
      price: currentPrice,
      quantity: quantity,
      stock: 999999,
      is_custom: true,
      is_retail: false
    });

    toast.success(`"${finalName}" (Rp ${formatDisplayNumber(currentPrice)}) ditambahkan ke keranjang`);
    onClose();
  };

  const currentTotal = parseInt(display.replace(/\D/g, '') || '0', 10) * quantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#181615]/95 border border-white/15 rounded-[32px] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9),_inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#F4F3ED]/10 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F4F3ED]/10 border border-[#F4F3ED]/20 flex items-center justify-center text-[#F4F3ED] shadow-sm">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Kalkulator Input Barang Lain</h3>
              <p className="text-[11px] text-white/40">Input nominal cepat untuk barang tanpa katalog stok</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Nama Barang */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
            Nama Barang (Opsional)
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-[#121110]/80 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-white/25 text-xs shadow-inner"
            placeholder="Contoh: Gorengan / Sayur / Es Batu / Titipan (Default: Barang Lain)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>

        {/* Display Layar Kalkulator */}
        <div className="p-4 rounded-2xl bg-[#0f0e0d] border border-white/10 mb-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
          <div className="flex justify-between items-center text-[10px] text-white/40 font-mono mb-1">
            <span>HARGA SATUAN</span>
            {operation && (
              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {formatDisplayNumber(prevVal)} {operation}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-white/40 mr-1.5">Rp</span>
            <span className="text-2xl sm:text-3xl font-black text-[#F4F3ED] tracking-tight font-mono">
              {formatDisplayNumber(display)}
            </span>
          </div>
        </div>

        {/* Preset Cepat (+1rb, +2rb, +5rb, +10rb, +20rb, +50rb) */}
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {[1000, 2000, 5000, 10000, 20000, 50000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => addPreset(amt)}
              className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-bold border border-white/5 transition cursor-pointer active:scale-95"
            >
              +{amt >= 1000 ? `${amt / 1000}k` : amt}
            </button>
          ))}
        </div>

        {/* Keypad Kalkulator 4x4 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            type="button"
            onClick={clearAll}
            className="py-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-black text-sm border border-red-500/20 transition cursor-pointer"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => performOperation('÷')}
            className={`py-3 rounded-2xl font-bold text-sm border transition cursor-pointer ${
              operation === '÷' ? 'bg-[#F4F3ED] text-[#1E1E1E]' : 'bg-white/5 text-amber-300 hover:bg-white/10 border-white/5'
            }`}
          >
            ÷
          </button>
          <button
            type="button"
            onClick={() => performOperation('×')}
            className={`py-3 rounded-2xl font-bold text-sm border transition cursor-pointer ${
              operation === '×' ? 'bg-[#F4F3ED] text-[#1E1E1E]' : 'bg-white/5 text-amber-300 hover:bg-white/10 border-white/5'
            }`}
          >
            ×
          </button>
          <button
            type="button"
            onClick={() => performOperation('-')}
            className={`py-3 rounded-2xl font-bold text-sm border transition cursor-pointer ${
              operation === '-' ? 'bg-[#F4F3ED] text-[#1E1E1E]' : 'bg-white/5 text-amber-300 hover:bg-white/10 border-white/5'
            }`}
          >
            -
          </button>

          {[7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => inputDigit(n)}
              className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-base border border-white/5 transition cursor-pointer active:scale-95"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => performOperation('+')}
            className={`py-3 rounded-2xl font-bold text-sm border transition cursor-pointer ${
              operation === '+' ? 'bg-[#F4F3ED] text-[#1E1E1E]' : 'bg-white/5 text-amber-300 hover:bg-white/10 border-white/5'
            }`}
          >
            +
          </button>

          {[4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => inputDigit(n)}
              className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-base border border-white/5 transition cursor-pointer active:scale-95"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={handleEqual}
            rowSpan={2}
            className="py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-base border border-amber-500/30 transition cursor-pointer"
          >
            =
          </button>

          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => inputDigit(n)}
              className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-base border border-white/5 transition cursor-pointer active:scale-95"
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            onClick={() => inputDigit(0)}
            className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-base border border-white/5 transition cursor-pointer active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            onClick={inputTripleZero}
            className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 font-bold text-sm border border-white/5 transition cursor-pointer active:scale-95"
          >
            000
          </button>
          <button
            type="button"
            onClick={() => {
              if (display.length > 1) {
                setDisplay(display.slice(0, -1));
              } else {
                setDisplay('0');
              }
            }}
            className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-bold text-xs border border-white/5 transition cursor-pointer"
          >
            ⌫
          </button>
        </div>

        {/* Pengaturan Kuantitas & Tombol Submit */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-xs font-bold text-white font-mono">
              {quantity}x
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#F4F3ED] hover:bg-white text-[#1E1E1E] font-black text-xs shadow-[0_4px_16px_rgba(244,243,237,0.3)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ShoppingCart size={15} />
            <span>Tambah (Rp {formatDisplayNumber(currentTotal)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
