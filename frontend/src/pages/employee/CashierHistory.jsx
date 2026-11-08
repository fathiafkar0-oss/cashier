import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api';
import { 
  History, 
  Search, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  X, 
  RefreshCw,
  Wallet,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CashierHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('COMPLETED');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await employeeApi.get('/cashier/orders', { params });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil riwayat pesanan kasir');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const filteredOrders = orders.filter((o) => {
    const matchSearch = 
      o.id.toString().includes(search) || 
      (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.table_number_snapshot && o.table_number_snapshot.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Riwayat Transaksi Kasir</h1>
          <p className="text-soft text-sm mt-0.5">
            Daftar pesanan yang telah selesai disajikan atau ditutup pembayarannya.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panel/60 p-4 rounded-xl border border-line">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'COMPLETED'
                ? 'bg-accent text-on-accent'
                : 'bg-raised text-soft hover:bg-raised-2'
            }`}
          >
            Selesai (Completed)
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'CANCELLED'
                ? 'bg-accent text-on-accent'
                : 'bg-raised text-soft hover:bg-raised-2'
            }`}
          >
            Dibatalkan (Cancelled)
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === ''
                ? 'bg-accent text-on-accent'
                : 'bg-raised text-soft hover:bg-raised-2'
            }`}
          >
            Semua
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-soft absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID, nama pemesan, nomor meja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-raised border border-line-strong rounded-xl text-xs text-ink placeholder-faint focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-accent-text animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-panel/60 border border-line rounded-xl p-12 text-center text-faint text-xs">
          Tidak ada riwayat transaksi yang cocok dengan kriteria.
        </div>
      ) : (
        <div className="bg-panel/80 border border-line rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-soft font-bold bg-canvas/40">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Meja</th>
                  <th className="py-3 px-3">Pelanggan</th>
                  <th className="py-3 px-3">Item Dipesan</th>
                  <th className="py-3 px-3 text-right">Total Bayar</th>
                  <th className="py-3 px-3 text-center">Metode</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {filteredOrders.map((ord) => {
                  const itemCount = ord.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

                  return (
                    <tr key={ord.id} className="hover:bg-raised/30 transition">
                      <td className="py-3 px-4 font-bold text-ink">#{ord.id}</td>
                      <td className="py-3 px-3 text-soft">
                        {ord.created_at ? new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-3 font-bold text-accent-text">{ord.table_number_snapshot}</td>
                      <td className="py-3 px-3 text-ink">{ord.customer_name || 'Pelanggan'}</td>
                      <td className="py-3 px-3 text-soft">
                        {itemCount} Porsi ({ord.items?.length || 0} menu)
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-ink">
                        Rp {ord.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          ord.payment?.payment_method === 'CASH'
                            ? 'bg-accent/10 text-accent-text border border-accent/20'
                            : 'bg-success/10 text-success border border-success/20'
                        }`}>
                          {ord.payment?.payment_method || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          ord.status === 'COMPLETED'
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-raised hover:bg-raised-2 text-ink ml-auto transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Struk / Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="theme-light bg-white text-abyss rounded-xl w-full max-w-sm p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-3 top-3 p-1 rounded-lg text-soft hover:text-abyss print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-line pb-3 mb-3">
              <h2 className="text-base font-extrabold uppercase">RESTORAN RITEL & POS</h2>
              <p className="text-[11px] text-faint">Jl. Kuliner No. 88, Jakarta</p>
              <p className="text-[11px] text-faint">Telp: 0812-3456-7890</p>
            </div>

            {/* Order Info */}
            <div className="space-y-1 border-b border-dashed border-line pb-3 mb-3 text-[11px]">
              <div className="flex justify-between">
                <span>No. Pesanan:</span>
                <span className="font-bold">#{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Meja:</span>
                <span className="font-bold">{selectedOrder.table_number_snapshot}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{selectedOrder.customer_name || 'Tamu'}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{new Date(selectedOrder.created_at).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 border-b border-dashed border-line pb-3 mb-3">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="max-w-[180px]">
                    <span className="block font-bold">{item.menu_name_snapshot}</span>
                    <span className="text-[11px] text-faint">
                      {item.quantity} x Rp {item.price_snapshot.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            {/* Totals & Payments */}
            <div className="space-y-1 border-b border-dashed border-line pb-3 mb-3">
              <div className="flex justify-between text-sm font-extrabold">
                <span>TOTAL:</span>
                <span>Rp {selectedOrder.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Metode Pembayaran:</span>
                <span>{selectedOrder.payment?.payment_method || 'CASH'}</span>
              </div>
              {selectedOrder.payment?.amount_received > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>Tunai Diterima:</span>
                  <span>Rp {selectedOrder.payment.amount_received.toLocaleString('id-ID')}</span>
                </div>
              )}
              {selectedOrder.payment?.change_amount > 0 && (
                <div className="flex justify-between text-[11px] font-bold">
                  <span>Kembalian:</span>
                  <span>Rp {selectedOrder.payment.change_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-[11px] text-faint mb-4">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Semoga menikmati hidangan kami</p>
            </div>

            {/* Print Button */}
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-panel hover:bg-raised text-ink font-bold rounded-xl transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-line text-faint hover:bg-raised font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
