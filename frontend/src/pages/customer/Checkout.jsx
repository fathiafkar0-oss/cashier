import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Banknote, ShieldCheck, Send } from 'lucide-react';
import QuantityStepper from '../../components/customer/QuantityStepper';

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

  const inputClass =
    'w-full rounded-xl border border-line bg-canvas/50 px-4 py-3 text-base text-ink placeholder-faint transition focus:border-accent focus:outline-none sm:text-sm';

  const paymentOptions = [
    { value: 'CASH', title: 'Tunai (Cash)', hint: 'Bayar ke kasir setelah pesan', Icon: Banknote },
    { value: 'CASHLESS', title: 'Cashless (QRIS)', hint: 'Scan QRIS / E-Wallet di HP', Icon: CreditCard },
  ];

  return (
    <div className="theme-light min-h-screen bg-canvas pb-16 text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 px-5 py-3.5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-semibold text-soft transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </button>
          <span className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-bold text-on-accent">
            Meja {selectedTable?.table_number}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8">
        <h1 className="mb-6 text-4xl font-extrabold tracking-[-0.03em]">Ringkasan Pesanan</h1>

        <form onSubmit={handleCheckout} className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-5">
            <section className="rounded-2xl bg-panel p-5 sm:p-6">
              <label htmlFor="customer-name" className="mb-2 block text-sm font-bold">
                Nama Pemesan / Atas Nama
              </label>
              <input
                id="customer-name"
                type="text"
                required
                placeholder="Contoh: Pak Budi"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputClass}
              />
            </section>

            <section className="rounded-2xl bg-panel p-5 sm:p-6">
              <h2 className="mb-1 text-lg font-bold tracking-tight">Item Dipesan</h2>
              <div className="divide-y divide-line">
                {Object.values(cart).map((item) => (
                  <div key={item.id} className="flex flex-col gap-2.5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold leading-snug">{item.name}</h4>
                        <p className="text-sm text-soft">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <QuantityStepper
                        name={item.name}
                        quantity={item.quantity}
                        onDecrease={() => updateQuantity(item.id, -1)}
                        onIncrease={() => updateQuantity(item.id, 1)}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Catatan khusus (misal: pedas, es sedikit)..."
                      aria-label={`Catatan untuk ${item.name}`}
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.id, e.target.value)}
                      className="w-full border-b border-transparent bg-transparent py-1 text-base text-soft placeholder-faint transition focus:border-accent focus:outline-none sm:text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="border-t border-line pt-4">
                <input
                  type="text"
                  placeholder="Catatan tambahan untuk kasir/dapur (opsional)..."
                  aria-label="Catatan tambahan untuk kasir atau dapur"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className={inputClass}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20">
            <section className="rounded-2xl bg-panel p-5 sm:p-6">
              <h2 className="mb-3 text-lg font-bold tracking-tight">Metode Pembayaran</h2>
              <div className="grid gap-2.5">
                {paymentOptions.map(({ value, title, hint, Icon }) => {
                  const active = paymentMethod === value;
                  return (
                    <label
                      key={value}
                      className={`flex cursor-pointer select-none items-center gap-3.5 rounded-xl p-3.5 transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${
                        active ? 'bg-accent text-on-accent' : 'bg-raised hover:bg-raised-2'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={value}
                        checked={active}
                        onChange={() => setPaymentMethod(value)}
                        className="sr-only"
                      />
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>
                        <span className="block text-sm font-bold">{title}</span>
                        <span className={`block text-xs ${active ? 'text-movie' : 'text-soft'}`}>{hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="theme-dark rounded-2xl bg-canvas p-5 text-ink sm:p-6">
              <p className="text-sm text-soft">Total Pembayaran</p>
              <p className="mt-0.5 text-4xl font-extrabold tracking-[-0.03em]">
                Rp {totalAmount.toLocaleString('id-ID')}
              </p>

              <p className="mt-4 flex gap-2 text-sm leading-snug text-soft">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Meja {selectedTable?.table_number} telah dikonfirmasi dan akan dikunci saat pesanan dikirim.</span>
              </p>

              <button
                type="submit"
                disabled={submitting}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold transition ${
                  submitting
                    ? 'cursor-not-allowed bg-raised text-faint'
                    : 'bg-accent text-on-accent hover:bg-accent-hover active:scale-95'
                }`}
              >
                {submitting ? (
                  <span>Memproses Pesanan...</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Kirim Pesanan Sekarang</span>
                  </>
                )}
              </button>
            </section>
          </aside>
        </form>
      </main>
    </div>
  );
}
