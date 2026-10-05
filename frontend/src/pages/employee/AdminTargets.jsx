import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTargets() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [targetAmount, setTargetAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.get('/admin/targets');
      if (res.data.success) {
        setTargets(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data target omzet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleSetTarget = async (e) => {
    e.preventDefault();
    if (!targetAmount || Number(targetAmount) <= 0) {
      toast.error('Masukkan target omzet yang valid (lebih dari 0)');
      return;
    }

    try {
      setSaving(true);
      const res = await employeeApi.post('/admin/targets', {
        month: parseInt(month),
        year: parseInt(year),
        target_amount: parseInt(targetAmount)
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setTargetAmount('');
        fetchTargets();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan target');
    } finally {
      setSaving(false);
    }
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide">Target Penjualan Bulanan</h1>
        <p className="text-stone-400 text-sm mt-0.5">
          Tentukan target omzet bulanan dan pantau persentase pencapaian dari transaksi yang sah.
        </p>
      </div>

      {/* Target Setting Form */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Tetapkan / Perbarui Target Omzet</h2>
        </div>

        <form onSubmit={handleSetTarget} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-stone-300 font-bold mb-1">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              {months.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-stone-300 font-bold mb-1">Tahun</label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-stone-300 font-bold mb-1">Target Omzet (Rp)</label>
            <input
              type="number"
              min="10000"
              required
              placeholder="Contoh: 50000000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-lg shadow-amber-500/10 transition"
            >
              {saving ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </div>
        </form>
      </div>

      {/* Target History List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Daftar Pencapaian Target Restoran
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : targets.length === 0 ? (
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-12 text-center text-stone-500 text-xs">
            Belum ada target omzet yang ditetapkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {targets.map((t) => {
              const monthName = months[t.month - 1];
              const pct = t.achievement_percentage || 0;
              const isAchieved = pct >= 100;

              return (
                <div 
                  key={t.id} 
                  className={`bg-stone-900/80 border p-5 rounded-2xl transition shadow-xl ${
                    isAchieved ? 'border-emerald-500/30' : 'border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span className="font-extrabold text-white text-base">
                        {monthName} {t.year}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      isAchieved 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {pct}% Tercapai
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Target Omzet:</span>
                      <span className="font-bold text-white">Rp {t.target_amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Realisasi Omzet:</span>
                      <span className="font-black text-amber-400">Rp {(t.actual_omzet || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-stone-800 rounded-full h-2.5 mt-4 overflow-hidden border border-stone-700/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isAchieved 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
