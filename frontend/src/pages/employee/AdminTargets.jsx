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
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Target Penjualan Bulanan</h1>
        <p className="text-soft text-sm mt-0.5">
          Tentukan target omzet bulanan dan pantau persentase pencapaian dari transaksi yang sah.
        </p>
      </div>

      {/* Target Setting Form */}
      <div className="bg-panel/80 border border-line rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-accent/10 text-accent-text rounded-xl">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-ink">Tetapkan / Perbarui Target Omzet</h2>
        </div>

        <form onSubmit={handleSetTarget} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-soft font-bold mb-1">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent font-medium"
            >
              {months.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-soft font-bold mb-1">Tahun</label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent font-bold"
            />
          </div>

          <div>
            <label className="block text-soft font-bold mb-1">Target Omzet (Rp)</label>
            <input
              type="number"
              min="10000"
              required
              placeholder="Contoh: 50000000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent font-bold"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-on-accent font-extrabold rounded-xl shadow-lg transition"
            >
              {saving ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </div>
        </form>
      </div>

      {/* Target History List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-ink">
          Daftar Pencapaian Target Restoran
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-accent-text animate-spin" />
          </div>
        ) : targets.length === 0 ? (
          <div className="bg-panel/60 border border-line rounded-xl p-12 text-center text-faint text-xs">
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
                  className={`bg-panel/80 border p-5 rounded-xl transition shadow-xl ${
                    isAchieved ? 'border-success/30' : 'border-line'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-soft" />
                      <span className="font-extrabold text-ink text-base">
                        {monthName} {t.year}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                      isAchieved 
                        ? 'bg-success/10 text-success border border-success/30' 
                        : 'bg-warn/10 text-warn border border-warn/30'
                    }`}>
                      {pct}% Tercapai
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-soft">Target Omzet:</span>
                      <span className="font-bold text-ink">Rp {t.target_amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-soft">Realisasi Omzet:</span>
                      <span className="font-extrabold text-accent-text">Rp {(t.actual_omzet || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-raised rounded-full h-2.5 mt-4 overflow-hidden border border-line-strong/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isAchieved 
                          ? 'bg-success' 
                          : 'bg-periwinkle'
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
