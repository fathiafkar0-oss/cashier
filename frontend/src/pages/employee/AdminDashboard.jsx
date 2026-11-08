import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  Wallet, 
  Target, 
  ArrowUpRight, 
  AlertCircle,
  RefreshCw,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [dailyProfit, setDailyProfit] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, dailyRes] = await Promise.all([
        employeeApi.get('/admin/reports/summary'),
        employeeApi.get('/admin/reports/profit-daily')
      ]);

      if (sumRes.data.success) {
        setSummary(sumRes.data.data);
      }
      if (dailyRes.data.success) {
        setDailyProfit(dailyRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-accent-text animate-spin" />
          <span className="text-soft font-medium">Memuat data metrik restoran...</span>
        </div>
      </div>
    );
  }

  const target = summary?.monthly_target;
  const targetPct = target?.achievement_percentage || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Ringkasan Bisnis Restoran</h1>
          <p className="text-soft text-sm mt-0.5">Pantau omzet, profit bersih, realisasi target penjualan, dan metode bayar.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-raised hover:bg-raised-2 text-ink rounded-xl text-xs font-bold border border-line-strong transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan Data
        </button>
      </div>

      {/* Target Bulanan Banner */}
      {target && (
        <div className="bg-panel border border-line rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-accent-text font-bold text-xs mb-1">
                <Target className="w-4 h-4" />
                Target Penjualan Bulan Ini (Bulan {target.month} / {target.year})
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-ink mt-1">
                Rp {target.current_month_omzet.toLocaleString('id-ID')}{' '}
                <span className="text-soft text-sm font-normal">
                  / Rp {target.target_amount.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-soft text-xs mt-1">
                {targetPct >= 100 
                  ? '🎉 Selamat! Target penjualan bulan ini telah tercapai.' 
                  : `Kurang Rp ${(Math.max(0, target.target_amount - target.current_month_omzet)).toLocaleString('id-ID')} lagi untuk mencapai target.`}
              </p>
            </div>

            <div className="text-right">
              <span className={`text-3xl md:text-4xl font-extrabold ${targetPct >= 100 ? 'text-success' : 'text-accent-text'}`}>
                {targetPct}%
              </span>
              <span className="text-xs text-soft block font-semibold">Tercapai</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-raised rounded-full h-3.5 mt-5 overflow-hidden border border-line-strong/60">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                targetPct >= 100 
                  ? 'bg-success' 
                  : 'bg-periwinkle'
              }`}
              style={{ width: `${Math.min(100, targetPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="bg-panel/80 border border-line p-5 rounded-xl relative overflow-hidden group hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-soft mb-2">
            <span className="text-xs font-bold">Total Omzet</span>
            <div className="p-2 bg-accent/10 rounded-xl text-accent-text">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink">
            Rp {(summary?.total_omzet || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-soft mt-2 font-medium">Dari pesanan berstatus PAID</p>
        </div>

        {/* Total Modal/HPP */}
        <div className="bg-panel/80 border border-line p-5 rounded-xl relative overflow-hidden group hover:border-danger/40 transition">
          <div className="flex items-center justify-between text-soft mb-2">
            <span className="text-xs font-bold">Total Modal (HPP)</span>
            <div className="p-2 bg-periwinkle/10 rounded-xl text-periwinkle">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-periwinkle">
            Rp {(summary?.total_cost || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-soft mt-2 font-medium">Berdasarkan snapshot modal saat beli</p>
        </div>

        {/* Total Profit Bersih */}
        <div className="bg-panel/80 border border-line p-5 rounded-xl relative overflow-hidden group hover:border-success/40 transition">
          <div className="flex items-center justify-between text-soft mb-2">
            <span className="text-xs font-bold">Profit Bersih</span>
            <div className="p-2 bg-success/10 rounded-xl text-success">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-success">
            Rp {(summary?.total_profit || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-soft mt-2 font-medium">
            Margin: {summary?.total_omzet ? Math.round((summary.total_profit / summary.total_omzet) * 100) : 0}%
          </p>
        </div>

        {/* Total Transaksi */}
        <div className="bg-panel/80 border border-line p-5 rounded-xl relative overflow-hidden group hover:border-periwinkle/40 transition">
          <div className="flex items-center justify-between text-soft mb-2">
            <span className="text-xs font-bold">Total Transaksi</span>
            <div className="p-2 bg-periwinkle/10 rounded-xl text-periwinkle">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink">
            {summary?.total_transactions || 0}
          </div>
          <p className="text-[11px] text-soft mt-2 font-medium">Pesanan lunas selesai</p>
        </div>
      </div>

      {/* Cash vs Cashless Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-panel/80 border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-accent/10 text-accent-text rounded-xl">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-ink">Pembayaran Tunai (Cash)</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-raised text-soft font-bold">
              {summary?.cash?.count || 0} Transaksi
            </span>
          </div>
          <div className="text-2xl font-extrabold text-accent-text">
            Rp {(summary?.cash?.omzet || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-soft mt-1">Uang fisik langsung masuk ke laci kasir.</p>
        </div>

        <div className="bg-panel/80 border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-success/10 text-success rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-ink">Pembayaran Cashless (QRIS / Transfer)</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-raised text-soft font-bold">
              {summary?.cashless?.count || 0} Transaksi
            </span>
          </div>
          <div className="text-2xl font-extrabold text-success">
            Rp {(summary?.cashless?.omzet || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-soft mt-1">Masuk ke rekening digital / settlement payment gateway.</p>
        </div>
      </div>

      {/* Profit Harian Breakdown Table */}
      <div className="bg-panel/80 border border-line rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-raised text-soft rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Riwayat Profit Harian</h3>
              <p className="text-xs text-soft">Performa penjualan berdasarkan tanggal transaksi</p>
            </div>
          </div>
        </div>

        {dailyProfit.length === 0 ? (
          <div className="text-center py-8 text-faint text-sm">
            Belum ada data transaksi lunas untuk ditampilkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-soft font-bold">
                  <th className="pb-3 px-3">Tanggal</th>
                  <th className="pb-3 px-3">Pesanan</th>
                  <th className="pb-3 px-3 text-right">Omzet</th>
                  <th className="pb-3 px-3 text-right">HPP (Modal)</th>
                  <th className="pb-3 px-3 text-right">Profit Bersih</th>
                  <th className="pb-3 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {dailyProfit.map((row) => {
                  const marginPct = row.omzet > 0 ? Math.round((row.profit / row.omzet) * 100) : 0;
                  return (
                    <tr key={row.date} className="hover:bg-raised/30 transition">
                      <td className="py-3 px-3 font-bold text-ink">{row.date}</td>
                      <td className="py-3 px-3 text-soft">{row.count} transaksi</td>
                      <td className="py-3 px-3 text-right font-bold text-ink">
                        Rp {row.omzet.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right text-periwinkle font-medium">
                        Rp {row.cost.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-success">
                        Rp {row.profit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-accent-text">
                        {marginPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
