import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Wallet, 
  RefreshCw, 
  Plus, 
  Calendar, 
  Tag, 
  FileText, 
  DollarSign,
  Calculator,
  Delete,
  Check,
  X
} from 'lucide-react';
import api from '../api';
import QuickCalculator from '../components/QuickCalculator';

const formatRupiah = (val) => {
  const number = typeof val === 'number' ? val : parseInt(val || 0);
  return 'Rp ' + number.toLocaleString('id-ID');
};

const formatSeparator = (val) => {
  if (!val && val !== 0) return '';
  const cleanStr = val.toString().replace(/\D/g, '');
  if (!cleanStr) return '';
  const num = parseInt(cleanStr);
  return num.toLocaleString('id-ID');
};

const parseRawInt = (valStr) => {
  if (!valStr) return 0;
  const cleanStr = valStr.toString().replace(/\D/g, '');
  return cleanStr ? parseInt(cleanStr) : 0;
};

export default function ExpensePage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [category, setCategory] = useState('Kue-kue');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // State Kalkulator
  const [showCalculator, setShowCalculator] = useState(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/expenses');
      setExpenses(res.data);
    } catch (err) {
      setError('Gagal memuat data pengeluaran.');
      toast.error('Gagal mengambil riwayat pengeluaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawAmount = parseRawInt(amount);

    if (!category) {
      toast.error('Pilih kategori pengeluaran');
      return;
    }
    if (rawAmount <= 0) {
      toast.error('Nominal pengeluaran harus lebih besar dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/expenses', {
        category,
        description,
        amount: rawAmount
      });
      toast.success('Pengeluaran berhasil dicatat!');
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('Kue-kue');
      // Refresh list
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoStr) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12 relative z-10">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
              <Wallet className="mr-3 text-[#F4F3ED] drop-shadow-[0_0_8px_rgba(244,243,237,0.4)]" size={28} />
              Pengeluaran Operasional
            </h1>
            <p className="text-xs text-white/40 font-bold uppercase mt-1 tracking-wider">
              Pencatatan biaya harian, titipan kue, dan kas kecil toko ritel
            </p>
          </div>
        </div>

        <button
          onClick={fetchExpenses}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-full bg-[#F4F3ED] text-[#1E1E1E] hover:bg-white font-bold text-xs flex items-center justify-center space-x-2 transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Grid Layout: Form, Calculator, and Table History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Input Form Container & Calculator */}
        <div className="space-y-6">
          <div className="bg-[#2A2A2A]/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/15 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Catat Pengeluaran Baru</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Input detail biaya operasional</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className={`p-2 rounded-xl border transition-all duration-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  showCalculator 
                    ? 'bg-[#F4F3ED] text-[#1E1E1E] border-white shadow-[0_0_12px_rgba(244,243,237,0.3)]' 
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                }`}
                title="Buka / Tutup Kalkulator"
              >
                <Calculator size={15} />
                <span>Kalkulator</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Dropdown Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white text-sm [&>option]:bg-slate-900 [&>option]:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] font-medium"
                >
                  <option value="Kue-kue">🧁 Kue-kue (Titipan / Kulakan)</option>
                  <option value="Belanja Harian">🛒 Belanja Harian</option>
                  <option value="Makan Karyawan">🍱 Makan Karyawan</option>
                  <option value="Konsumsi Tamu">☕ Konsumsi Tamu</option>
                  <option value="Lain-lain">📦 Lain-lain</option>
                </select>
              </div>

              {/* Description/Catatan */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Titipan kue basah Bu Sri (20 pcs)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1816]/60 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] placeholder-white/20 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] font-medium"
                />
              </div>

              {/* Nominal (Rp) formatted input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nominal (Rp)</label>
                  {!showCalculator && (
                    <button
                      type="button"
                      onClick={() => setShowCalculator(true)}
                      className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Calculator size={11} /> Hitung
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Contoh: 50.000"
                  value={formatSeparator(amount)}
                  onChange={(e) => {
                    const raw = parseRawInt(e.target.value);
                    setAmount(raw === 0 ? '' : raw.toString());
                  }}
                  className="w-full px-4 py-3 bg-[#1a1816]/60 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] placeholder-white/20 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] font-mono font-bold"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || parseRawInt(amount) <= 0}
                className="w-full py-3.5 mt-4 bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-2xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-center shadow-[0_4px_15px_rgba(0,0,0,0.3),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98]"
              >
                <Plus size={16} />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Quick Calculator Modal */}
        <QuickCalculator
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          onApply={(val) => {
            setAmount(val.toString());
            toast.success(`Rp ${val.toLocaleString('id-ID')} diterapkan ke nominal!`);
          }}
          applyLabel="Terapkan ke Nominal"
          title="Kalkulator Biaya & Nota"
        />

        {/* Right Side: History List Table */}
        <div className="lg:col-span-2 bg-[#2A2A2A]/40 backdrop-blur-3xl p-6 md:p-8 rounded-[2.5rem] border border-white/15 shadow-xl space-y-6">
          <div>
            <h3 className="font-bold text-white text-base">Riwayat Pengeluaran</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Daftar arus kas keluar teratur</p>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4F3ED]"></div>
                <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Memuat riwayat pengeluaran...</span>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-400 font-semibold text-sm">
                {error}
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-12 text-center text-white/30 italic text-xs">
                Belum ada catatan pengeluaran operasional.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-4">Waktu</th>
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3">Catatan</th>
                    <th className="pb-3 pr-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white/80">
                  {expenses.map((e) => (
                    <tr 
                      key={e.id} 
                      className="hover:bg-white/5 transition duration-150 group"
                    >
                      <td className="py-3.5 pl-4 font-medium text-white/60 flex items-center space-x-2">
                        <Calendar size={12} className="text-white/30 shrink-0" />
                        <span>{formatDate(e.created_at)}</span>
                      </td>
                      <td className="py-3.5 font-bold text-white">
                        <span className="flex items-center space-x-1.5">
                          <Tag size={12} className="text-white/30 shrink-0" />
                          <span>{e.category}</span>
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-white/50">
                        {e.description ? (
                          <span className="flex items-center space-x-1.5">
                            <FileText size={12} className="text-white/20 shrink-0" />
                            <span className="truncate max-w-[200px]" title={e.description}>
                              {e.description}
                            </span>
                          </span>
                        ) : (
                          <span className="text-white/10 italic font-normal">-</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-right font-black text-[#F4F3ED] text-sm group-hover:scale-105 transition-transform duration-150 origin-right">
                        {formatRupiah(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table summary */}
          {!isLoading && !error && expenses.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-white/10 gap-4 text-xs font-bold text-white/40">
              <div>
                JUMLAH TRANSAKSI: <span className="text-white">{expenses.length}</span> KALI
              </div>
              <div className="flex items-center space-x-2 bg-[#1a1816]/40 px-4 py-2.5 rounded-full border border-white/5">
                <DollarSign size={14} className="text-red-400 shrink-0" />
                <span>AKUMULASI PENGELUARAN:</span>
                <span className="text-white font-extrabold text-sm">
                  {formatRupiah(expenses.reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
