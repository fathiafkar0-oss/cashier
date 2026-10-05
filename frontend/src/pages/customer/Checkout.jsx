import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Banknote, ShieldCheck, Trash2, Plus, Minus, Send, AlertCircle } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('customer_cart');
    return saved ? JSON.parse(saved) : {};
  });
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('customer_name') || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedTable = JSON.parse(localStorage.getItem('selected_table') || 'null');

  useEffect(() => {
    if (!selectedTable) {
      toast.error('Silakan pilih meja terlebih dahulu');
      navigate('/table-selection');
      return;
    }
    if (Object.keys(cart).length === 0) {
      toast.error('Keranjang belanja Anda masih kosong');
      navigate('/menu');
    }
  }, [selectedTable, cart, navigate]);

  const updateQuantity = (id, delta) => {
    setCart((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        localStorage.setItem('customer_cart', JSON.stringify(copy));
        return copy;
      }
      const updated = { ...prev, [id]: { ...item, quantity: newQty } };
      localStorage.setItem('customer_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateItemNotes = (id, notes) => {
    setCart((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const updated = { ...prev, [id]: { ...item, notes } };
      localStorage.setItem('customer_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const totalAmount = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!customerName.trim()) {
      toast.error('Mohon masukkan nama pemesan');
      return;
    }

    localStorage.setItem('customer_name', customerName.trim());
    setSubmitting(true);

    try {
      // 1. Quick Register/Login session otomatis
      try {
        const authRes = await customerApi.post('/auth/register', {
          full_name: customerName.trim(),
          phone: customerName.trim().replace(/\s+/g, '').toLowerCase() + '_table'
        });
        if (authRes.data.success && authRes.data.data.token) {
          localStorage.setItem('customer_token', authRes.data.data.token);
        }
      } catch (authErr) {
        console.warn('Quick session fallback', authErr);
      }

      // 2. Submit Order ke Customer Microservice
      const itemsPayload = Object.values(cart).map((it) => ({
        menu_id: it.id,
        quantity: it.quantity,
        item_notes: it.notes || ''
      }));

      const payload = {
        table_id: selectedTable.id,
        payment_method: paymentMethod,
        table_confirmed: true,
        notes: orderNotes.trim(),
        items: itemsPayload
      };

      const res = await customerApi.post('/orders', payload);
      if (res.data.success) {
        toast.success('Pesanan berhasil dibuat!');
        // Bersihkan cart
        localStorage.removeItem('customer_cart');
        const createdOrder = res.data.data;
        navigate(`/order-status/${createdOrder.id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memproses pesanan';
      toast.error(msg);
      if (err.response?.status === 409) {
        // Meja sudah digunakan
        setTimeout(() => navigate('/table-selection'), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
          <h1 className="font-bold text-base text-white">Ringkasan Pesanan</h1>
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold">
            {selectedTable?.table_number}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleCheckout} className="space-y-6">
          {/* Identitas Pemesan */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Nama Pemesan / Atas Nama
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pak Budi"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm font-medium"
            />
          </div>

          {/* Rincian Menu */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Item Dipesan</h2>
            <div className="divide-y divide-stone-800">
              {Object.values(cart).map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-stone-200">{item.name}</h4>
                      <p className="text-xs text-amber-400 font-semibold">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-2 text-white min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Catatan khusus (misal: pedas, es sedikit)..."
                    value={item.notes || ''}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-700"
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-800">
              <input
                type="text"
                placeholder="Catatan tambahan untuk kasir/dapur (opsional)..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-700"
              />
            </div>
          </div>

          {/* Pilihan Metode Pembayaran */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Metode Pembayaran</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cash */}
              <label
                className={`p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition select-none ${
                  paymentMethod === 'CASH'
                    ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                    : 'border-stone-800 bg-stone-950 hover:bg-stone-850'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                  className="hidden"
                />
                <div className={`p-2.5 rounded-xl ${paymentMethod === 'CASH' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Tunai (Cash)</h4>
                  <p className="text-[11px] text-stone-400">Bayar ke kasir setelah pesan</p>
                </div>
              </label>

              {/* Cashless */}
              <label
                className={`p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition select-none ${
                  paymentMethod === 'CASHLESS'
                    ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                    : 'border-stone-800 bg-stone-950 hover:bg-stone-850'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="CASHLESS"
                  checked={paymentMethod === 'CASHLESS'}
                  onChange={() => setPaymentMethod('CASHLESS')}
                  className="hidden"
                />
                <div className={`p-2.5 rounded-xl ${paymentMethod === 'CASHLESS' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Cashless (QRIS)</h4>
                  <p className="text-[11px] text-stone-400">Scan QRIS / E-Wallet di HP</p>
                </div>
              </label>
            </div>
          </div>

          {/* Total & Submit Button */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between text-base">
              <span className="text-stone-400 font-medium">Total Pembayaran</span>
              <span className="text-2xl font-black text-amber-400">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400/90">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Meja {selectedTable?.table_number} telah dikonfirmasi dan akan dikunci saat pesanan dikirim.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                submitting
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-amber-500/20 active:scale-95'
              }`}
            >
              {submitting ? (
                <span>Memproses Pesanan...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesanan Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
