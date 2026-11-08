import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api';
import { 
  Receipt, 
  Calendar, 
  Filter, 
  Search, 
  Download, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  CreditCard, 
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (paymentMethod) params.payment_method = paymentMethod;

      const [sumRes, txRes] = await Promise.all([
        employeeApi.get('/admin/reports/summary', { params }),
        employeeApi.get('/admin/transactions', { params })
      ]);

      if (sumRes.data.success) {
        setSummary(sumRes.data.data);
      }
      if (txRes.data.success) {
        setTransactions(txRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil laporan transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [paymentMethod]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setPaymentMethod('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Laporan Keuangan & Transaksi</h1>
          <p className="text-soft text-sm mt-0.5">
            Audit rincian omzet, HPP, laba bersih, serta status pembayaran pesanan.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleApplyFilter} className="bg-panel/60 p-4 rounded-xl border border-line flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-soft" />
          <span className="text-soft font-bold">Dari:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-soft font-bold">Sampai:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-soft" />
          <span className="text-soft font-bold">Metode:</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-1.5 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent font-medium"
          >
            <option value="">Semua Metode</option>
            <option value="CASH">Hanya Cash</option>
            <option value="CASHLESS">Hanya Cashless</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="submit"
            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-on-accent font-bold rounded-xl transition"
          >
            Terapkan Filter
          </button>
          {(startDate || endDate || paymentMethod) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-1.5 bg-raised hover:bg-raised-2 text-soft font-medium rounded-xl transition"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-panel/80 border border-line p-5 rounded-xl">
          <div className="flex items-center justify-between text-soft mb-2">
            <span className="text-xs font-bold">Omzet Terverifikasi</span>
            <div className="p-2 bg-accent/10 rounded-xl text-accent-text">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink">
            Rp {(summary?.total_omzet || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-soft mt-1">Total pendapatan bersih masuk</p>
        </div>

        <div className="bg-panel/80 border border-line p-5 rounded-xl">
          <div className="flex items-center justify-between text-soft mb-2">
            <span className="text-xs font-bold">Total Modal / HPP</span>
            <div className="p-2 bg-periwinkle/10 rounded-xl text-periwinkle">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-periwinkle">
            Rp {(summary?.total_cost || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-soft mt-1">Snapshot modal dari order lunas</p>
        </div>

        <div className="bg-panel/80 border border-line p-5 rounded-xl">
          <div className="flex items-center justify-between text-soft mb-2">
            <span className="text-xs font-bold">Laba / Profit Bersih</span>
            <div className="p-2 bg-success/10 rounded-xl text-success">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-success">
            Rp {(summary?.total_profit || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-soft mt-1">
            Margin: {summary?.total_omzet ? Math.round((summary.total_profit / summary.total_omzet) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-accent-text animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-panel/60 border border-line rounded-xl p-12 text-center text-faint">
          Tidak ada riwayat transaksi pada rentang filter ini.
        </div>
      ) : (
        <div className="bg-panel/80 border border-line rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-soft font-bold bg-canvas/40">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Meja & Pemesan</th>
                  <th className="py-3 px-3 text-right">Omzet</th>
                  <th className="py-3 px-3 text-right">Modal</th>
                  <th className="py-3 px-3 text-right">Profit</th>
                  <th className="py-3 px-3 text-center">Metode</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {transactions.map((tx) => {
                  const profit = tx.total_amount - (tx.total_cost || 0);
                  const isPaid = tx.payment && tx.payment.payment_status === 'PAID';

                  return (
                    <tr key={tx.id} className="hover:bg-raised/30 transition">
                      <td className="py-3 px-4 font-bold text-ink">#{tx.id}</td>
                      <td className="py-3 px-3 text-soft">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-accent-text block">{tx.table_number_snapshot}</span>
                        <span className="text-[11px] text-soft">{tx.customer_name || 'Pelanggan'}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-ink">
                        Rp {tx.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right text-periwinkle font-medium">
                        Rp {(tx.total_cost || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-success">
                        {isPaid ? `Rp ${profit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                          tx.payment?.payment_method === 'CASH' 
                            ? 'bg-accent/10 text-accent-text border border-accent/20' 
                            : 'bg-success/10 text-success border border-success/20'
                        }`}>
                          {tx.payment?.payment_method || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          tx.status === 'COMPLETED' 
                            ? 'bg-success/10 text-success' 
                            : tx.status === 'PROCESSING' 
                            ? 'bg-periwinkle/10 text-periwinkle' 
                            : 'bg-raised-2 text-soft'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(tx)}
                          className="p-1.5 rounded-lg bg-raised hover:bg-raised-2 text-soft hover:text-ink transition"
                          title="Lihat Detail Transaksi"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* Transaction Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-panel border border-line rounded-xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-soft hover:text-ink hover:bg-raised"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-ink mb-1">
              Rincian Transaksi #{selectedOrder.id}
            </h3>
            <p className="text-soft text-xs mb-4">
              {selectedOrder.table_number_snapshot} • {selectedOrder.customer_name || 'Pelanggan'} • {new Date(selectedOrder.created_at).toLocaleString('id-ID')}
            </p>

            <div className="space-y-4 text-xs">
              <div className="bg-canvas/60 rounded-xl p-3 border border-line/80">
                <span className="text-soft text-[11px] font-bold block mb-2">Item Dipesan:</span>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-ink">{item.menu_name_snapshot}</span>
                        <span className="text-soft ml-1.5">x{item.quantity}</span>
                        {item.notes && <p className="text-[11px] text-accent-text italic">Catatan: {item.notes}</p>}
                      </div>
                      <span className="font-bold text-ink">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-canvas/40 rounded-xl p-3 border border-line/60 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-soft">Total Omzet:</span>
                  <span className="font-bold text-ink">Rp {selectedOrder.total_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soft">Total Modal (HPP):</span>
                  <span className="font-bold text-periwinkle">Rp {(selectedOrder.total_cost || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-1.5">
                  <span className="text-soft font-bold">Laba Bersih:</span>
                  <span className="font-extrabold text-success">
                    Rp {(selectedOrder.total_amount - (selectedOrder.total_cost || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {selectedOrder.payment && (
                <div className="bg-accent/5 rounded-xl p-3 border border-accent/20 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-soft">Metode Bayar:</span>
                    <span className="font-bold text-accent-text">{selectedOrder.payment.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-soft">Status Bayar:</span>
                    <span className="font-bold text-success">{selectedOrder.payment.payment_status}</span>
                  </div>
                  {selectedOrder.payment.amount_received > 0 && (
                    <div className="flex justify-between">
                      <span className="text-soft">Uang Diterima:</span>
                      <span className="font-bold text-ink">Rp {selectedOrder.payment.amount_received.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {selectedOrder.payment.change_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-soft">Kembalian:</span>
                      <span className="font-bold text-success">Rp {selectedOrder.payment.change_amount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-right pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-raised hover:bg-raised-2 text-ink rounded-xl font-bold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
