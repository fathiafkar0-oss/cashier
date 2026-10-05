import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi } from '../../api';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, QrCode, Banknote, ArrowRight, RefreshCw, AlertCircle, ChefHat, Sparkles } from 'lucide-react';

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
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-amber-500">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold">Pesanan Tidak Ditemukan</h2>
        <button
          onClick={() => navigate('/table-selection')}
          className="mt-4 px-4 py-2 bg-stone-800 rounded-xl text-sm"
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

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Status Card Banner */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-stone-400 font-semibold">Kode Pesanan</p>
              <h1 className="text-xl font-black text-amber-400 font-mono tracking-wider">
                {order.order_code}
              </h1>
            </div>
            <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-right">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Meja Makan</span>
              <span className="text-base font-black text-white">{order.table_number}</span>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="mt-6 pt-6 border-t border-stone-800/80">
            <div className="flex items-center justify-between relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isPaid || isProcessing || isCompleted
                      ? 'bg-emerald-500 text-stone-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-amber-500 text-stone-950 animate-pulse'
                  }`}
                >
                  {isPaid ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                </div>
                <span className="text-[11px] font-semibold mt-2 text-stone-300">
                  {isPaid ? 'Sudah Lunas' : 'Menunggu Bayar'}
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? 'bg-emerald-500 text-stone-950'
                      : isProcessing
                      ? 'bg-amber-500 text-stone-950 animate-bounce'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold mt-2 text-stone-300">
                  {isProcessing ? 'Sedang Dimasak' : isCompleted ? 'Selesai Dimasak' : 'Antrean Dapur'}
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? 'bg-emerald-500 text-stone-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold mt-2 text-stone-300">
                  {isCompleted ? 'Pesanan Selesai' : 'Siap Saji'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instruksi Pembayaran Khusus */}
        {!isPaid && !isCancelled && (
          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 shadow-xl">
            {order.payment?.payment_method === 'CASH' ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Banknote className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Pembayaran Tunai (Cash)</h3>
                  <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Silakan menuju ke kasir dan sebutkan <strong>Nomor {order.table_number}</strong> atau kode pesanan <strong>{order.order_code}</strong> untuk melakukan pembayaran tunai.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-center">
                  <span className="text-xs text-stone-400 block mb-1">Nominal yang Harus Dibayar:</span>
                  <span className="text-2xl font-black text-amber-400">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Scan QRIS Pembayaran</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Gunakan aplikasi m-banking atau e-wallet Anda untuk memindai kode QR di bawah.
                  </p>
                </div>

                {/* QR Code Mockup */}
                <div className="p-6 bg-white rounded-3xl inline-block shadow-2xl mx-auto border-4 border-amber-500/30">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${order.payment?.payment_reference || 'REF'}`}
                    alt="QRIS Payment"
                    className="w-44 h-44 mx-auto"
                  />
                  <p className="text-[11px] font-mono font-bold text-stone-900 mt-2">
                    {order.payment?.payment_reference}
                  </p>
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-400">
                  Total Tagihan: <strong className="text-amber-400 text-sm">Rp {order.total_amount.toLocaleString('id-ID')}</strong>
                </div>

                {/* Tombol Demo Simulasi Pembayaran Berhasil */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    onClick={handleSimulateCashlessSuccess}
                    disabled={simulating}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{simulating ? 'Memverifikasi...' : 'Simulasikan Pembayaran Berhasil (Demo Testing)'}</span>
                  </button>

                  <button
                    onClick={handleSwitchToCash}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-700 bg-stone-850 hover:bg-stone-800 text-stone-300 font-semibold text-xs transition"
                  >
                    Ganti ke Pembayaran Tunai (Cash di Kasir)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rincian Menu Dipesan */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Item Pesanan</h3>
          <div className="divide-y divide-stone-800">
            {order.items?.map((it) => (
              <div key={it.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-sm">
                <div>
                  <h4 className="font-semibold text-stone-200">
                    {it.menu_name} <span className="text-xs text-stone-500">x{it.quantity}</span>
                  </h4>
                  {it.item_notes && (
                    <p className="text-[11px] text-amber-400/80 italic mt-0.5">Catatan: {it.item_notes}</p>
                  )}
                </div>
                <span className="font-bold text-stone-200">
                  Rp {it.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-base font-bold">
            <span className="text-stone-400">Total</span>
            <span className="text-amber-400">Rp {order.total_amount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Tombol Buat Pesanan Baru jika Selesai */}
        {isCompleted && (
          <button
            onClick={() => {
              localStorage.removeItem('selected_table');
              navigate('/table-selection');
            }}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm transition shadow-xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Pesan Menu Baru Lagi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
