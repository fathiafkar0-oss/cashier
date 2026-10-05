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
          <h1 className="text-2xl font-black text-white tracking-wide">Riwayat Transaksi Kasir</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Daftar pesanan yang telah selesai disajikan atau ditutup pembayarannya.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'COMPLETED'
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Selesai (Completed)
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'CANCELLED'
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Dibatalkan (Cancelled)
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === ''
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Semua
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID, nama pemesan, nomor meja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-12 text-center text-stone-500 text-xs">
          Tidak ada riwayat transaksi yang cocok dengan kriteria.
        </div>
      ) : (
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider bg-stone-950/40">
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
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {filteredOrders.map((ord) => {
                  const itemCount = ord.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

                  return (
                    <tr key={ord.id} className="hover:bg-stone-800/30 transition">
                      <td className="py-3 px-4 font-bold text-white">#{ord.id}</td>
                      <td className="py-3 px-3 text-stone-400">
                        {ord.created_at ? new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-400">{ord.table_number_snapshot}</td>
                      <td className="py-3 px-3 text-stone-200">{ord.customer_name || 'Pelanggan'}</td>
                      <td className="py-3 px-3 text-stone-300">
                        {itemCount} Porsi ({ord.items?.length || 0} menu)
                      </td>
                      <td className="py-3 px-3 text-right font-black text-white">
                        Rp {ord.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.payment?.payment_method === 'CASH'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        }`}>
                          {ord.payment?.payment_method || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 ml-auto transition"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative font-mono text-xs">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-3 top-3 p-1 rounded-lg text-stone-400 hover:text-stone-900 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-stone-300 pb-3 mb-3">
              <h2 className="text-base font-black uppercase">RESTORAN RITEL & POS</h2>
              <p className="text-[10px] text-stone-500">Jl. Kuliner No. 88, Jakarta</p>
              <p className="text-[10px] text-stone-500">Telp: 0812-3456-7890</p>
            </div>

            {/* Order Info */}
            <div className="space-y-1 border-b border-dashed border-stone-300 pb-3 mb-3 text-[11px]">
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
            <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-3 mb-3">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="max-w-[180px]">
                    <span className="block font-bold">{item.menu_name_snapshot}</span>
                    <span className="text-[10px] text-stone-500">
                      {item.quantity} x Rp {item.price_snapshot.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            {/* Totals & Payments */}
            <div className="space-y-1 border-b border-dashed border-stone-300 pb-3 mb-3">
              <div className="flex justify-between text-sm font-black">
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
            <div className="text-center text-[10px] text-stone-500 mb-4">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Semoga menikmati hidangan kami</p>
            </div>

            {/* Print Button */}
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold rounded-xl transition"
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
