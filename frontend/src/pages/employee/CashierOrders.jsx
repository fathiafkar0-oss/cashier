import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api';
import toast from 'react-hot-toast';
import { 
  Banknote, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Sparkles, 
  XCircle, 
  ArrowRightLeft, 
  RefreshCw, 
  Users,
  Search,
  AlertTriangle
} from 'lucide-react';

export default function CashierOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING_PAYMENT' | 'PROCESSING' | 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');

  // Cash Modal State
  const [cashModalOrder, setCashModalOrder] = useState(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [confirmingCash, setConfirmingCash] = useState(false);

  // Move Table Modal State
  const [moveModalOrder, setMoveModalOrder] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedNewTableId, setSelectedNewTableId] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await employeeApi.get('/cashier/orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil antrean pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const openCashModal = (order) => {
    setCashModalOrder(order);
    setAmountReceived('');
  };

  const handleConfirmCashPayment = async (e) => {
    e.preventDefault();
    if (!cashModalOrder?.payment) return;

    const receivedNum = parseInt(amountReceived, 10) || 0;
    if (receivedNum < cashModalOrder.payment.amount_due) {
      toast.error('Uang yang dimasukkan kurang dari total tagihan!');
      return;
    }

    setConfirmingCash(true);
    try {
      const res = await employeeApi.post(`/cashier/payments/${cashModalOrder.payment.id}/confirm-cash`, {
        amount_received: receivedNum
      });
      if (res.data.success) {
        toast.success(`Pembayaran Tunai Berhasil! Kembalian: Rp ${res.data.data.change_amount.toLocaleString('id-ID')}`);
        setCashModalOrder(null);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal konfirmasi cash');
    } finally {
      setConfirmingCash(false);
    }
  };

  const handleVerifyCashless = async (paymentId) => {
    try {
      const res = await employeeApi.post(`/cashier/payments/${paymentId}/verify-cashless`);
      if (res.data.success) {
        toast.success('Pembayaran Cashless diverifikasi berhasil');
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal verifikasi cashless');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await employeeApi.patch(`/cashier/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Pesanan diubah menjadi ${newStatus}`);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const openMoveModal = async (order) => {
    setMoveModalOrder(order);
    try {
      const res = await employeeApi.get('/tables');
      if (res.data.success) {
        setAvailableTables(res.data.data.filter(t => t.status === 'AVAILABLE'));
      }
    } catch (err) {
      toast.error('Gagal mengambil daftar meja');
    }
  };

  const handleConfirmMoveTable = async (e) => {
    e.preventDefault();
    if (!selectedNewTableId) return;

    try {
      const res = await employeeApi.post(`/cashier/orders/${moveModalOrder.id}/change-table`, {
        new_table_id: parseInt(selectedNewTableId, 10)
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setMoveModalOrder(null);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memindahkan meja');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === 'ALL' || o.status === activeTab;
    const matchesSearch = o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const amountReceivedNum = parseInt(amountReceived, 10) || 0;
  const changeAmountPreview = cashModalOrder ? Math.max(0, amountReceivedNum - cashModalOrder.payment.amount_due) : 0;
  const isCashInsufficient = cashModalOrder ? amountReceivedNum < cashModalOrder.payment.amount_due : false;

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Antrean Pesanan Kasir</h2>
          <p className="text-xs text-stone-400">Kelola konfirmasi pembayaran dan alur penyajian meja</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode / meja / nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-white transition"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-stone-800">
        {[
          { key: 'ALL', label: 'Semua Pesanan', count: orders.length },
          { key: 'PENDING_PAYMENT', label: 'Menunggu Bayar', count: orders.filter(o => o.status === 'PENDING_PAYMENT').length },
          { key: 'PROCESSING', label: 'Sedang Dimasak', count: orders.filter(o => o.status === 'PROCESSING').length },
          { key: 'COMPLETED', label: 'Selesai', count: orders.filter(o => o.status === 'COMPLETED').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === tab.key ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-stone-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid Antrean Orders */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-stone-900/40 rounded-3xl border border-stone-800/80">
          <ChefHat className="w-12 h-12 text-stone-600 mx-auto mb-3 opacity-40" />
          <p className="text-sm text-stone-400 font-semibold">Tidak ada pesanan pada antrean ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const isUnpaid = order.payment?.payment_status !== 'PAID';
            const isCash = order.payment?.payment_method === 'CASH';

            return (
              <div
                key={order.id}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-2xl font-black text-amber-400 block tracking-tight">
                        {order.table_number}
                      </span>
                      <span className="text-[11px] font-mono text-stone-400 font-medium">
                        {order.order_code}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        order.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : order.status === 'PROCESSING'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {order.status === 'PENDING_PAYMENT' ? 'Menunggu Bayar' : order.status === 'PROCESSING' ? 'Sedang Dimasak' : 'Selesai'}
                      </span>
                      <p className="text-[11px] text-stone-400 mt-1 font-semibold">{order.customer_name}</p>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="bg-stone-950/80 rounded-2xl p-3 border border-stone-850 space-y-1.5 text-xs max-h-40 overflow-y-auto">
                    {order.items?.map(it => (
                      <div key={it.id} className="flex justify-between items-center text-stone-300">
                        <span>
                          <strong className="text-white">{it.quantity}x</strong> {it.menu_name}
                        </span>
                        <span className="font-semibold text-stone-400">
                          Rp {it.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Info */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-stone-800/80">
                    <span className="flex items-center gap-1.5 text-stone-400">
                      {isCash ? <Banknote className="w-3.5 h-3.5 text-emerald-400" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                      <span>{order.payment?.payment_method}</span>
                      <span className={`font-bold ml-1 ${order.payment?.payment_status === 'PAID' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({order.payment?.payment_status})
                      </span>
                    </span>

                    <span className="text-sm font-black text-amber-400">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Actions button group */}
                <div className="space-y-2 pt-2 border-t border-stone-850">
                  {/* Action 1: Pembayaran jika UNPAID */}
                  {isUnpaid && isCash && (
                    <button
                      onClick={() => openCashModal(order)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Terima Uang Cash</span>
                    </button>
                  )}

                  {isUnpaid && !isCash && (
                    <button
                      onClick={() => handleVerifyCashless(order.payment.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verifikasi Cashless Lunas</span>
                    </button>
                  )}

                  {/* Action 2: Update status pesanan jika sudah lunas */}
                  {!isUnpaid && order.status === 'PROCESSING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Selesaikan & Lepas Meja</span>
                    </button>
                  )}

                  {/* Action Secondary: Pindah Meja / Batalkan */}
                  {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openMoveModal(order)}
                        className="flex-1 py-1.5 px-2 rounded-lg border border-stone-800 bg-stone-950 hover:bg-stone-800 text-[11px] font-semibold text-stone-400 hover:text-white transition flex items-center justify-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Pindah Meja</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        className="py-1.5 px-2.5 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/40 text-[11px] font-semibold text-rose-400 transition"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CASH PAYMENT MODAL (Wajib Spesifikasi Rubrik Kasir) */}
      {cashModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Pembayaran Tunai (Cash)</h3>
                <p className="text-xs text-stone-400">Meja {cashModalOrder.table_number} • {cashModalOrder.order_code}</p>
              </div>
              <button
                onClick={() => setCashModalOrder(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Total Due */}
            <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-center">
              <span className="text-xs text-stone-400 block mb-1">Total yang Harus Dibayar:</span>
              <span className="text-3xl font-black text-amber-400">
                Rp {cashModalOrder.payment.amount_due.toLocaleString('id-ID')}
              </span>
            </div>

            <form onSubmit={handleConfirmCashPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1.5">
                  Nominal Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Contoh: 50000"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setAmountReceived(cashModalOrder.payment.amount_due.toString())}
                  className="py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-[11px] font-bold text-amber-400 transition"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived('50000')}
                  className="py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-[11px] font-bold text-stone-300 transition"
                >
                  50.000
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived('100000')}
                  className="py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-[11px] font-bold text-stone-300 transition"
                >
                  100.000
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived((amountReceivedNum + 50000).toString())}
                  className="py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-[11px] font-bold text-stone-300 transition"
                >
                  +50k
                </button>
              </div>

              {/* Change Amount Box */}
              <div className={`p-4 rounded-2xl border text-center transition ${
                isCashInsufficient
                  ? 'bg-rose-950/20 border-rose-900/50 text-rose-400'
                  : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
              }`}>
                <span className="text-xs font-bold block mb-0.5">
                  {isCashInsufficient ? 'Uang Masih Kurang' : 'Kembalian Pelanggan:'}
                </span>
                <span className="text-2xl font-black font-mono">
                  Rp {changeAmountPreview.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCashModalOrder(null)}
                  className="flex-1 py-3 rounded-xl border border-stone-700 text-stone-300 text-sm font-semibold hover:bg-stone-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={confirmingCash || isCashInsufficient}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition flex items-center justify-center gap-2 ${
                    isCashInsufficient || confirmingCash
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95'
                  }`}
                >
                  {confirmingCash ? 'Menyimpan...' : 'Konfirmasi Lunas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE TABLE MODAL */}
      {moveModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Pindahkan Meja Pesanan</h3>
            <p className="text-xs text-stone-400">
              Meja saat ini: <strong className="text-white">{moveModalOrder.table_number}</strong>
            </p>

            <form onSubmit={handleConfirmMoveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1.5">
                  Pilih Meja Kosong Baru
                </label>
                <select
                  required
                  value={selectedNewTableId}
                  onChange={(e) => setSelectedNewTableId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Meja --</option>
                  {availableTables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.table_number} (Kapasitas {t.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMoveModalOrder(null)}
                  className="flex-1 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
                >
                  Pindahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
