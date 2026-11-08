import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi } from '../../api';
import toast from 'react-hot-toast';
import { CheckCircle2, QrCode, Banknote, ArrowRight, RefreshCw, AlertCircle, ChefHat, Sparkles } from 'lucide-react';
import Ornament from '../../components/brand/Ornament';

export default function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchOrderStatus = async () => {
    try {
      const res = await customerApi.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil status pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSimulateCashlessSuccess = async () => {
    if (!order?.payment?.payment_reference) return;
    setSimulating(true);
    try {
      const res = await customerApi.post('/payments/mock-cashless-success', {
        payment_reference: order.payment.payment_reference
      });
      if (res.data.success) {
        toast.success('Pembayaran Cashless Berhasil!');
        fetchOrderStatus();
      }
    } catch (err) {
      toast.error('Gagal memproses simulasi');
    } finally {
      setSimulating(false);
    }
  };

  const handleSwitchToCash = async () => {
    try {
      const res = await customerApi.post(`/payments/${order.id}/switch-to-cash`);
      if (res.data.success) {
        toast.success('Metode bayar dialihkan ke CASH');
        fetchOrderStatus();
      }
    } catch (err) {
      toast.error('Gagal beralih ke Cash');
    }
  };

  if (loading) {
    return (
      <div className="theme-light flex min-h-screen items-center justify-center bg-canvas text-dana">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="theme-light flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center text-ink">
        <AlertCircle className="mb-3 h-12 w-12 text-danger" />
        <h2 className="text-xl font-bold">Pesanan Tidak Ditemukan</h2>
        <button
          onClick={() => navigate('/table-selection')}
          className="mt-5 rounded-md bg-accent px-6 py-3 text-sm font-bold text-on-accent"
        >
          Kembali ke Pemilihan Meja
        </button>
      </div>
    );
  }

  const isPaid = order.payment?.payment_status === 'PAID';
  const isProcessing = order.status === 'PROCESSING';
  const isCompleted = order.status === 'COMPLETED';
  const isCancelled = order.status === 'CANCELLED';

  const steps = [
    {
      key: 'payment',
      label: isPaid ? 'Sudah Lunas' : 'Menunggu Bayar',
      state: isPaid || isProcessing || isCompleted ? 'done' : 'active',
      content: isPaid ? <CheckCircle2 className="h-5 w-5" /> : '1',
    },
    {
      key: 'kitchen',
      label: isProcessing ? 'Sedang Dimasak' : isCompleted ? 'Selesai Dimasak' : 'Antrean Dapur',
      state: isCompleted ? 'done' : isProcessing ? 'active' : 'idle',
      content: <ChefHat className="h-5 w-5" />,
    },
    {
      key: 'ready',
      label: isCompleted ? 'Pesanan Selesai' : 'Siap Saji',
      state: isCompleted ? 'done' : 'idle',
      content: <Sparkles className="h-5 w-5" />,
    },
  ];

  const stepClass = {
    done: 'bg-success text-on-status',
    active: 'bg-accent text-on-accent ring-4 ring-periwinkle/40',
    idle: 'bg-raised text-faint',
  };

  const headline = isCancelled
    ? 'Pesanan dibatalkan'
    : isCompleted
    ? 'Pesanan Anda sudah selesai'
    : isProcessing
    ? 'Pesanan sedang dimasak'
    : isPaid
    ? 'Pesanan masuk antrean dapur'
    : 'Selesaikan pembayaran Anda';

  const billBoxClass = 'rounded-2xl bg-raised p-4 text-center';

  return (
    <div className="theme-light min-h-screen bg-canvas pb-12 text-ink">
      <header className="theme-dark bg-canvas text-ink">
        <div className="mx-auto max-w-xl px-5 pb-2 pt-7">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-soft">Kode {order.order_code}</span>
            <span className="rounded-md bg-raised px-3.5 py-1.5 font-bold">Meja {order.table_number}</span>
          </div>
          <h1 className="mt-8 text-[2.5rem] font-extrabold leading-[1.05] tracking-normal sm:text-5xl">{headline}</h1>
        </div>
        <Ornament className="mx-auto max-w-5xl px-5 py-7 sm:px-8" />
      </header>

      <div className="mx-auto max-w-xl space-y-4 px-5">
        <section className="rounded-3xl bg-panel p-6">
          <ol className="relative flex justify-between">
            <span className="absolute left-[16.66%] right-[16.66%] top-[18px] h-0.5 bg-line" aria-hidden="true" />
            {steps.map((step) => (
              <li key={step.key} className="relative z-10 flex w-1/3 flex-col items-center text-center">
                <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition ${stepClass[step.state]}`}>
                  {step.content}
                </span>
                <span className="mt-2 text-xs font-semibold leading-tight">{step.label}</span>
              </li>
            ))}
          </ol>
        </section>

        {!isPaid && !isCancelled && (
          <section className="rounded-3xl bg-panel p-6 text-center">
            {order.payment?.payment_method === 'CASH' ? (
              <div className="space-y-4">
                <Banknote className="mx-auto h-9 w-9 text-dana" />
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Pembayaran Tunai (Cash)</h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-soft">
                    Silakan menuju ke kasir dan sebutkan <strong className="text-ink">Nomor {order.table_number}</strong> atau kode pesanan <strong className="text-ink">{order.order_code}</strong> untuk melakukan pembayaran tunai.
                  </p>
                </div>
                <div className={billBoxClass}>
                  <span className="mb-0.5 block text-sm text-soft">Nominal yang Harus Dibayar</span>
                  <span className="text-3xl font-extrabold tracking-tight">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="flex items-center justify-center gap-2 text-xl font-bold tracking-tight">
                    <QrCode className="h-5 w-5 text-dana" />
                    Scan QRIS Pembayaran
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-soft">
                    Gunakan aplikasi m-banking atau e-wallet Anda untuk memindai kode QR di bawah.
                  </p>
                </div>

                {/* QR Code Mockup: latar harus tetap putih agar mudah dipindai */}
                <div className="mx-auto inline-block rounded-3xl bg-white p-5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${order.payment?.payment_reference || 'REF'}`}
                    alt="QRIS Payment"
                    className="mx-auto h-44 w-44"
                  />
                  <p className="mt-2 text-[11px] font-semibold text-abyss">{order.payment?.payment_reference}</p>
                </div>

                <div className={billBoxClass}>
                  <span className="mb-0.5 block text-sm text-soft">Total Tagihan</span>
                  <span className="text-3xl font-extrabold tracking-tight">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                </div>

                {/* Tombol Demo Simulasi Pembayaran Berhasil */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    onClick={handleSimulateCashlessSuccess}
                    disabled={simulating}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-success px-4 py-3.5 text-sm font-bold text-on-status transition hover:opacity-90 active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{simulating ? 'Memverifikasi...' : 'Simulasikan Pembayaran Berhasil (Demo Testing)'}</span>
                  </button>

                  <button
                    onClick={handleSwitchToCash}
                    className="w-full rounded-md border border-line-strong px-4 py-3 text-sm font-semibold text-soft transition hover:bg-raised hover:text-ink"
                  >
                    Ganti ke Pembayaran Tunai (Cash di Kasir)
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="rounded-3xl bg-panel p-6">
          <h3 className="text-lg font-bold tracking-tight">Item Pesanan</h3>
          <div className="mt-1 divide-y divide-line">
            {order.items?.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <h4 className="font-semibold">
                    {it.menu_name} <span className="font-medium text-faint">x{it.quantity}</span>
                  </h4>
                  {it.item_notes && <p className="mt-0.5 text-xs text-soft">Catatan: {it.item_notes}</p>}
                </div>
                <span className="whitespace-nowrap font-bold">Rp {it.subtotal.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          <div className="mt-1 flex items-center justify-between border-t border-line pt-4">
            <span className="font-semibold text-soft">Total</span>
            <span className="text-xl font-extrabold tracking-tight">Rp {order.total_amount.toLocaleString('id-ID')}</span>
          </div>
        </section>

        {isCompleted && (
          <button
            onClick={() => {
              localStorage.removeItem('selected_table');
              navigate('/table-selection');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-4 text-sm font-bold text-on-accent transition hover:bg-accent-hover active:scale-95"
          >
            <span>Pesan Menu Baru Lagi</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
