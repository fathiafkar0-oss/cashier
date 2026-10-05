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
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-stone-400 font-medium">Memuat data metrik restoran...</span>
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
          <h1 className="text-2xl font-black text-white tracking-wide">Ringkasan Bisnis Restoran</h1>
          <p className="text-stone-400 text-sm mt-0.5">Pantau omzet, profit bersih, realisasi target penjualan, dan metode bayar.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold border border-stone-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan Data
        </button>
      </div>

      {/* Target Bulanan Banner */}
      {target && (
        <div className="bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Target className="w-4 h-4" />
                Target Penjualan Bulan Ini (Bulan {target.month} / {target.year})
              </div>
              <div className="text-2xl md:text-3xl font-black text-white mt-1">
                Rp {target.current_month_omzet.toLocaleString('id-ID')}{' '}
                <span className="text-stone-400 text-sm font-normal">
                  / Rp {target.target_amount.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-stone-400 text-xs mt-1">
                {targetPct >= 100 
                  ? '🎉 Selamat! Target penjualan bulan ini telah tercapai.' 
                  : `Kurang Rp ${(Math.max(0, target.target_amount - target.current_month_omzet)).toLocaleString('id-ID')} lagi untuk mencapai target.`}
              </p>
            </div>

            <div className="text-right">
              <span className={`text-3xl md:text-4xl font-black ${targetPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {targetPct}%
              </span>
              <span className="text-xs text-stone-400 block font-semibold">Tercapai</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-800 rounded-full h-3.5 mt-5 overflow-hidden border border-stone-700/60">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                targetPct >= 100 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${Math.min(100, targetPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Omzet</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            Rp {(summary?.total_omzet || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-stone-400 mt-2 font-medium">Dari pesanan berstatus PAID</p>
        </div>

        {/* Total Modal/HPP */}
        <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl relative overflow-hidden group hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Modal (HPP)</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">
            Rp {(summary?.total_cost || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-stone-400 mt-2 font-medium">Berdasarkan snapshot modal saat beli</p>
        </div>

        {/* Total Profit Bersih */}
        <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Profit Bersih</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            Rp {(summary?.total_profit || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-stone-400 mt-2 font-medium">
            Margin: {summary?.total_omzet ? Math.round((summary.total_profit / summary.total_omzet) * 100) : 0}%
          </p>
        </div>

        {/* Total Transaksi */}
        <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Transaksi</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {summary?.total_transactions || 0}
          </div>
          <p className="text-[11px] text-stone-400 mt-2 font-medium">Pesanan lunas selesai</p>
        </div>
      </div>

      {/* Cash vs Cashless Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Pembayaran Tunai (Cash)</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-bold">
              {summary?.cash?.count || 0} Transaksi
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400">
            Rp {(summary?.cash?.omzet || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-stone-400 mt-1">Uang fisik langsung masuk ke laci kasir.</p>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Pembayaran Cashless (QRIS / Transfer)</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-bold">
              {summary?.cashless?.count || 0} Transaksi
            </span>
          </div>
          <div className="text-2xl font-black text-teal-400">
            Rp {(summary?.cashless?.omzet || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-stone-400 mt-1">Masuk ke rekening digital / settlement payment gateway.</p>
        </div>
      </div>

      {/* Profit Harian Breakdown Table */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-800 text-stone-300 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Riwayat Profit Harian</h3>
              <p className="text-xs text-stone-400">Performa penjualan berdasarkan tanggal transaksi</p>
            </div>
          </div>
        </div>

        {dailyProfit.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-sm">
            Belum ada data transaksi lunas untuk ditampilkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Tanggal</th>
                  <th className="pb-3 px-3">Pesanan</th>
                  <th className="pb-3 px-3 text-right">Omzet</th>
                  <th className="pb-3 px-3 text-right">HPP (Modal)</th>
                  <th className="pb-3 px-3 text-right">Profit Bersih</th>
                  <th className="pb-3 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {dailyProfit.map((row) => {
                  const marginPct = row.omzet > 0 ? Math.round((row.profit / row.omzet) * 100) : 0;
                  return (
                    <tr key={row.date} className="hover:bg-stone-800/30 transition">
                      <td className="py-3 px-3 font-bold text-white">{row.date}</td>
                      <td className="py-3 px-3 text-stone-300">{row.count} transaksi</td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        Rp {row.omzet.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-400 font-medium">
                        Rp {row.cost.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-400">
                        Rp {row.profit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-400">
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
