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
          <h2 className="text-xl font-extrabold text-ink">Antrean Pesanan Kasir</h2>
          <p className="text-xs text-soft">Kelola konfirmasi pembayaran dan alur penyajian meja</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode / meja / nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-panel border border-line text-xs text-ink placeholder-faint focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-panel border border-line hover:bg-raised text-soft hover:text-ink transition"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent-text' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-line">
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
                ? 'bg-accent text-on-accent shadow-md'
                : 'text-soft hover:bg-panel hover:text-ink'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[11px] ${
              activeTab === tab.key ? 'bg-canvas text-accent-text' : 'bg-raised text-soft'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid Antrean Orders */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-panel/40 rounded-2xl border border-line/80">
          <ChefHat className="w-12 h-12 text-faint mx-auto mb-3 opacity-40" />
          <p className="text-sm text-soft font-semibold">Tidak ada pesanan pada antrean ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const isUnpaid = order.payment?.payment_status !== 'PAID';
            const isCash = order.payment?.payment_method === 'CASH';

            return (
              <div
                key={order.id}
                className="bg-panel border border-line hover:border-line-strong rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-2xl font-extrabold text-accent-text block tracking-tight">
                        {order.table_number}
                      </span>
                      <span className="text-[11px] text-soft font-medium">
                        {order.order_code}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider border ${
                        order.status === 'COMPLETED'
                          ? 'bg-success/10 border-success/30 text-success'
                          : order.status === 'PROCESSING'
                          ? 'bg-periwinkle/10 border-periwinkle/30 text-periwinkle'
                          : 'bg-warn/10 border-warn/30 text-warn'
                      }`}>
                        {order.status === 'PENDING_PAYMENT' ? 'Menunggu Bayar' : order.status === 'PROCESSING' ? 'Sedang Dimasak' : 'Selesai'}
                      </span>
                      <p className="text-[11px] text-soft mt-1 font-semibold">{order.customer_name}</p>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="bg-canvas/80 rounded-xl p-3 border border-line space-y-1.5 text-xs max-h-40 overflow-y-auto">
                    {order.items?.map(it => (
                      <div key={it.id} className="flex justify-between items-center text-soft">
                        <span>
                          <strong className="text-ink">{it.quantity}x</strong> {it.menu_name}
                        </span>
                        <span className="font-semibold text-soft">
                          Rp {it.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Info */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-line/80">
                    <span className="flex items-center gap-1.5 text-soft">
                      {isCash ? <Banknote className="w-3.5 h-3.5 text-success" /> : <CreditCard className="w-3.5 h-3.5 text-periwinkle" />}
                      <span>{order.payment?.payment_method}</span>
                      <span className={`font-bold ml-1 ${order.payment?.payment_status === 'PAID' ? 'text-success' : 'text-danger'}`}>
                        ({order.payment?.payment_status})
                      </span>
                    </span>

                    <span className="text-sm font-extrabold text-accent-text">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Actions button group */}
                <div className="space-y-2 pt-2 border-t border-line">
                  {/* Action 1: Pembayaran jika UNPAID */}
                  {isUnpaid && isCash && (
                    <button
                      onClick={() => openCashModal(order)}
                      className="w-full py-2.5 px-3 rounded-xl bg-success hover:opacity-90 text-on-status font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Terima Uang Cash</span>
                    </button>
                  )}

                  {isUnpaid && !isCash && (
                    <button
                      onClick={() => handleVerifyCashless(order.payment.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verifikasi Cashless Lunas</span>
                    </button>
                  )}

                  {/* Action 2: Update status pesanan jika sudah lunas */}
                  {!isUnpaid && order.status === 'PROCESSING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="w-full py-2.5 px-3 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
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
                        className="flex-1 py-1.5 px-2 rounded-lg border border-line bg-canvas hover:bg-raised text-[11px] font-semibold text-soft hover:text-ink transition flex items-center justify-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Pindah Meja</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        className="py-1.5 px-2.5 rounded-lg border border-danger/40 bg-danger/20 hover:bg-danger/40 text-[11px] font-semibold text-danger transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-panel border border-line-strong rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-extrabold text-ink">Pembayaran Tunai (Cash)</h3>
                <p className="text-xs text-soft">Meja {cashModalOrder.table_number} • {cashModalOrder.order_code}</p>
              </div>
              <button
                onClick={() => setCashModalOrder(null)}
                className="text-soft hover:text-ink p-1"
              >
                ✕
              </button>
            </div>

            {/* Total Due */}
            <div className="p-4 bg-canvas rounded-xl border border-line text-center">
              <span className="text-xs text-soft block mb-1">Total yang Harus Dibayar:</span>
              <span className="text-3xl font-extrabold text-accent-text">
                Rp {cashModalOrder.payment.amount_due.toLocaleString('id-ID')}
              </span>
            </div>

            <form onSubmit={handleConfirmCashPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-soft mb-1.5">
                  Nominal Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Contoh: 50000"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-canvas border border-line-strong text-ink text-lg font-bold focus:outline-none focus:border-accent"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setAmountReceived(cashModalOrder.payment.amount_due.toString())}
                  className="py-1.5 rounded-lg border border-line-strong bg-raised hover:bg-raised-2 text-[11px] font-bold text-accent-text transition"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived('50000')}
                  className="py-1.5 rounded-lg border border-line-strong bg-raised hover:bg-raised-2 text-[11px] font-bold text-soft transition"
                >
                  50.000
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived('100000')}
                  className="py-1.5 rounded-lg border border-line-strong bg-raised hover:bg-raised-2 text-[11px] font-bold text-soft transition"
                >
                  100.000
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived((amountReceivedNum + 50000).toString())}
                  className="py-1.5 rounded-lg border border-line-strong bg-raised hover:bg-raised-2 text-[11px] font-bold text-soft transition"
                >
                  +50k
                </button>
              </div>

              {/* Change Amount Box */}
              <div className={`p-4 rounded-xl border text-center transition ${
                isCashInsufficient
                  ? 'bg-danger/20 border-danger/50 text-danger'
                  : 'bg-success/20 border-success/50 text-success'
              }`}>
                <span className="text-xs font-bold block mb-0.5">
                  {isCashInsufficient ? 'Uang Masih Kurang' : 'Kembalian Pelanggan:'}
                </span>
                <span className="text-2xl font-extrabold ">
                  Rp {changeAmountPreview.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCashModalOrder(null)}
                  className="flex-1 py-3 rounded-xl border border-line-strong text-soft text-sm font-semibold hover:bg-raised transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={confirmingCash || isCashInsufficient}
                  className={`flex-1 py-3 rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-2 ${
                    isCashInsufficient || confirmingCash
                      ? 'bg-raised text-faint cursor-not-allowed'
                      : 'bg-success hover:opacity-90 text-on-status shadow-lg active:scale-95'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-panel border border-line-strong rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-ink">Pindahkan Meja Pesanan</h3>
            <p className="text-xs text-soft">
              Meja saat ini: <strong className="text-ink">{moveModalOrder.table_number}</strong>
            </p>

            <form onSubmit={handleConfirmMoveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-soft mb-1.5">
                  Pilih Meja Kosong Baru
                </label>
                <select
                  required
                  value={selectedNewTableId}
                  onChange={(e) => setSelectedNewTableId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-canvas border border-line-strong text-ink text-sm focus:outline-none focus:border-accent"
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
                  className="flex-1 py-2 rounded-xl border border-line-strong text-soft text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-accent text-on-accent font-bold text-xs hover:bg-accent-hover"
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
