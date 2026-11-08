import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  History, 
  RefreshCw, 
  Search, 
  Calendar, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  X, 
  Tag, 
  FileText,
  Receipt,
  Eye
} from 'lucide-react';
import api from '../api';

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

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk modal rincian nota transaksi
  const [selectedItem, setSelectedItem] = useState(null);

  // State untuk modal catat pengeluaran
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('Belanja Harian');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUnifiedHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/history');
      setHistory(res.data);
    } catch (err) {
      setError('Gagal memuat data riwayat keuangan.');
      toast.error('Gagal mengambil riwayat ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnifiedHistory();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const rawAmount = parseRawInt(expenseAmount);

    if (rawAmount <= 0) {
      toast.error('Nominal pengeluaran harus lebih besar dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/expenses', {
        category: expenseCategory,
        description: expenseDescription,
        amount: rawAmount
      });
      toast.success('Pengeluaran berhasil dicatat!');
      // Reset form
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseCategory('Belanja Harian');
      setIsModalOpen(false);
      // Refresh list
      fetchUnifiedHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    const query = searchQuery.toLowerCase();
    const codeMatch = item.transaction_code ? item.transaction_code.toLowerCase().includes(query) : false;
    const methodMatch = item.payment_method ? item.payment_method.toLowerCase().includes(query) : false;
    const catLabelMatch = item.category_label ? item.category_label.toLowerCase().includes(query) : false;
    const catMatch = item.category ? item.category.toLowerCase().includes(query) : false;
    const descMatch = item.description ? item.description.toLowerCase().includes(query) : false;
    const customerMatch = item.customer_name ? item.customer_name.toLowerCase().includes(query) : false;

    return codeMatch || methodMatch || catLabelMatch || catMatch || descMatch || customerMatch;
  });

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
              <History className="mr-3 text-[#F4F3ED] drop-shadow-[0_0_8px_rgba(244,243,237,0.4)]" size={28} />
              Buku Kas Utama
            </h1>
            <p className="text-xs text-white/40 font-bold uppercase mt-1 tracking-wider">
              Arus Kas Masuk (Penjualan & Pembayaran Kasbon) & Kas Keluar Terpadu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#F4F3ED] text-[#1E1E1E] hover:bg-white font-bold text-xs flex items-center justify-center space-x-2 transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] active:scale-95"
          >
            <Plus size={14} />
            <span>Catat Pengeluaran</span>
          </button>

          <button
            onClick={fetchUnifiedHistory}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.15)] disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Glassmorphic Ledger Container */}
      <div className="bg-[#2A2A2A]/40 backdrop-blur-3xl p-6 md:p-8 rounded-[2.5rem] border border-white/15 shadow-xl space-y-6">
        
        {/* Search Bar (3D Inset Style) */}
        <div className="relative max-w-md bg-[#1a1816]/60 border border-white/5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] p-1 flex items-center">
          <Search size={16} className="text-white/30 ml-3.5" />
          <input
            type="text"
            placeholder="Cari kode transaksi, deskripsi, metode, pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs text-white/80 placeholder-white/20 px-3 py-2.5 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-white/40 hover:text-white px-2 py-1 rounded-md mr-1.5 cursor-pointer font-bold uppercase"
            >
              Clear
            </button>
          )}
        </div>

        {/* Unified Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4F3ED]"></div>
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Memuat riwayat kas...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400 font-semibold text-sm">
              {error}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-white/30 italic text-xs">
              {searchQuery ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada riwayat transaksi.'}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-4">Tanggal & Waktu</th>
                  <th className="pb-3">Arus Kas</th>
                  <th className="pb-3">Kategori / Metode</th>
                  <th className="pb-3">Pelanggan / Keterangan</th>
                  <th className="pb-3 text-right">Nominal</th>
                  <th className="pb-3 pr-4 text-center">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/80">
                {filteredHistory.map((item) => {
                  const isIncome = item.type === 'income';
                  const isKasbonDebt = item.type === 'kasbon';
                  const isExpense = item.type === 'expense';
                  const isDebtPayment = item.flow_type === 'debt_payment';

                  return (
                    <tr 
                      key={`${item.type}-${item.id}`} 
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-white/10 transition-all duration-150 group cursor-pointer active:scale-[0.99]"
                      title="Klik untuk melihat rincian barang yang dibeli / keterangan lengkap"
                    >
                      <td className="py-3.5 pl-4 font-medium text-white/60 flex items-center space-x-2">
                        <Calendar size={12} className="text-white/30 shrink-0" />
                        <span>{formatDate(item.created_at)}</span>
                      </td>
                      
                      <td className="py-3.5 font-bold tracking-wide">
                        {isDebtPayment ? (
                          <span className="flex items-center space-x-1.5 text-emerald-400 font-extrabold">
                            <ArrowUpRight size={14} className="shrink-0" />
                            <span>{item.transaction_code}</span>
                          </span>
                        ) : isIncome ? (
                          <span className="flex items-center space-x-1.5 text-green-400 font-extrabold">
                            <ArrowUpRight size={14} className="shrink-0" />
                            <span>{item.transaction_code}</span>
                          </span>
                        ) : isKasbonDebt ? (
                          <span className="flex items-center space-x-1.5 text-amber-400 font-bold">
                            <FileText size={14} className="shrink-0 text-amber-400" />
                            <span>{item.transaction_code}</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1.5 text-red-400 font-bold">
                            <ArrowDownLeft size={14} className="shrink-0" />
                            <span>PENGELUARAN</span>
                          </span>
                        )}
                      </td>
                      
                      <td className="py-3.5">
                        {isDebtPayment ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase inline-block bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Pembayaran Kasbon
                          </span>
                        ) : isIncome ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase inline-block bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.category_label || (item.payment_method === 'cash' ? 'Tunai' : 'Penjualan')}
                          </span>
                        ) : isKasbonDebt ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase inline-block bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Kasbon (Piutang)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase inline-block bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            {item.category}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 font-semibold text-white/70">
                        {item.customer_name ? (
                          <span className="flex items-center space-x-1.5">
                            <User size={12} className={isDebtPayment ? "text-emerald-400 shrink-0" : isKasbonDebt ? "text-amber-400 shrink-0" : "text-[#F4F3ED]/40 shrink-0"} />
                            <span className={`truncate max-w-[140px] ${isDebtPayment ? 'text-emerald-300 font-bold' : isKasbonDebt ? 'text-amber-300 font-bold' : 'text-white/80'}`}>
                              {item.customer_name}
                            </span>
                          </span>
                        ) : item.description ? (
                          <span className="flex items-center space-x-1.5">
                            <FileText size={12} className="text-[#F4F3ED]/40 shrink-0" />
                            <span className="truncate max-w-[180px]" title={item.description}>{item.description}</span>
                          </span>
                        ) : (
                          <span className="text-white/20 font-normal italic">-</span>
                        )}
                      </td>
                      
                      <td className={`py-3.5 text-right font-black text-sm group-hover:scale-105 transition-transform duration-150 origin-right ${
                        isDebtPayment ? 'text-emerald-400' : isIncome ? 'text-green-400' : isKasbonDebt ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {isIncome ? `+${formatRupiah(item.amount)}` : isKasbonDebt ? formatRupiah(item.amount) : `-${formatRupiah(item.amount)}`}
                      </td>

                      <td className="py-3.5 pr-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/15 text-white/40 group-hover:text-white transition shadow-sm">
                          <Eye size={13} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Ledger Metrics Summary */}
        {!isLoading && !error && filteredHistory.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-white/10 gap-4 text-xs font-bold text-white/40">
            <div>
              MENAMPILKAN <span className="text-white">{filteredHistory.length}</span> ALIRAN KAS
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Pemasukan (Cash In: Tunai + Pembayaran Kasbon) */}
              <div className="flex items-center space-x-2 bg-green-500/10 px-3.5 py-1.5 rounded-full border border-green-500/20 shadow-sm">
                <span className="text-green-400">Pemasukan (Kas Masuk):</span>
                <span className="text-emerald-300 font-black text-xs">
                  {formatRupiah(filteredHistory.filter(i => i.type === 'income').reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>

              {/* Kasbon Baru (Piutang: tidak dihitung ke kas masuk) */}
              <div className="flex items-center space-x-2 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 shadow-sm">
                <span className="text-amber-400">Kasbon (Piutang):</span>
                <span className="text-amber-300 font-black text-xs">
                  {formatRupiah(filteredHistory.filter(i => i.type === 'kasbon').reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>

              {/* Pengeluaran */}
              <div className="flex items-center space-x-2 bg-red-500/10 px-3.5 py-1.5 rounded-full border border-red-500/20 shadow-sm">
                <span className="text-red-400">Pengeluaran:</span>
                <span className="text-red-300 font-black text-xs">
                  {formatRupiah(filteredHistory.filter(i => i.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* 3D Glassmorphic Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#2A2A2A]/90 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-md w-full relative z-[1000] scale-100 transition-transform duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-white text-base">Catat Pengeluaran Baru</h3>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Input biaya operasional kas toko</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateExpense} className="space-y-4">
              {/* Category Dropdown Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Kategori</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white text-sm [&>option]:bg-slate-900 [&>option]:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
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
                  placeholder="Contoh: Beli sapu & ember pel"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1816]/60 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] placeholder-white/20 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] font-medium"
                />
              </div>

              {/* Nominal (Rp) formatted input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Nominal (Rp)</label>
                <input
                  type="text"
                  placeholder="Contoh: 75.000"
                  value={formatSeparator(expenseAmount)}
                  onChange={(e) => {
                    const raw = parseRawInt(e.target.value);
                    setExpenseAmount(raw === 0 ? '' : raw.toString());
                  }}
                  className="w-full px-4 py-3 bg-[#1a1816]/60 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] placeholder-white/20 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] font-mono font-bold"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 font-bold text-xs mr-3 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || parseRawInt(expenseAmount) <= 0}
                  className="px-5 py-2.5 rounded-xl bg-[#F4F3ED] hover:bg-white text-[#1E1E1E] font-bold text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D Glassmorphic Item Details / Receipt Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4">

          <div className="bg-[#1c1a18]/95 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),_inset_0_1px_2px_rgba(255,255,255,0.15)] max-w-lg w-full relative z-[1000] space-y-5">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  selectedItem.flow_type === 'debt_payment' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : selectedItem.type === 'income' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : selectedItem.type === 'kasbon'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {selectedItem.flow_type === 'debt_payment' 
                      ? 'Tanda Terima Pembayaran Kasbon' 
                      : selectedItem.type === 'kasbon'
                        ? 'Nota Pengambilan Kasbon (Piutang)'
                        : selectedItem.type === 'income' 
                          ? 'Nota Rincian Pembelian (Tunai)' 
                          : 'Detail Pengeluaran Kas'}
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                    {selectedItem.flow_type === 'debt_payment'
                      ? 'Arus Kas Masuk Pelunasan/Cicilan'
                      : selectedItem.type === 'kasbon'
                        ? `Piutang: ${selectedItem.transaction_code}`
                        : selectedItem.type === 'income' 
                          ? selectedItem.transaction_code 
                          : `Kategori: ${selectedItem.category}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Case 1: Pembayaran Kasbon */}
            {selectedItem.flow_type === 'debt_payment' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
                    <span className="text-[10px] text-emerald-300/60 font-bold uppercase block">Nama Pelanggan</span>
                    <span className="text-emerald-300 font-extrabold text-sm">{selectedItem.customer_name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
                    <span className="text-[10px] text-emerald-300/60 font-bold uppercase block">Waktu Pembayaran</span>
                    <span className="text-white font-medium">{formatDate(selectedItem.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-300/60 font-bold uppercase block">Status Aliran Kas</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Kas Masuk (Diterima Kasir)
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex justify-between items-center">
                  <span className="text-emerald-300 font-extrabold text-xs uppercase tracking-wider">Nominal Pembayaran Diterima</span>
                  <span className="text-emerald-400 font-black text-lg">+{formatRupiah(selectedItem.amount)}</span>
                </div>
              </div>
            ) : selectedItem.type === 'kasbon' ? (
              /* Case 2: Transaksi Penjualan Kasbon Baru (Piutang) */
              <div className="space-y-4">
                {/* Info Note */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300 leading-relaxed">
                  <strong>Catatan Piutang:</strong> Transaksi kasbon ini belum menghasilkan uang kas masuk ke toko sampai pelanggan melunasi tagihannya di menu Buku Kasbon.
                </div>

                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Waktu Kasbon</span>
                    <span className="text-white font-medium">{formatDate(selectedItem.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Pelanggan Berhutang</span>
                    <span className="text-amber-300 font-bold">{selectedItem.customer_name}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-wider px-1">
                    <span>Barang yang Diambil:</span>
                    <span>{(selectedItem.details || []).length} Item</span>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {selectedItem.details && selectedItem.details.length > 0 ? (
                      selectedItem.details.map((detail, idx) => (
                        <div key={idx} className="p-3 bg-[#121110]/60 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-3">
                            <p className="font-bold text-white truncate">{detail.product_name}</p>
                            <p className="text-[10px] text-white/40 mt-0.5 font-medium">
                              {detail.quantity} × {formatRupiah(detail.price)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-amber-300">
                              {formatRupiah(detail.quantity * detail.price)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-xs text-white/30 italic bg-white/5 rounded-xl border border-white/5">
                        Rincian item kasbon tidak tersedia.
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Kasbon */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex justify-between items-center">
                  <span className="text-amber-300 font-bold uppercase tracking-wide text-xs">Total Piutang Kasbon</span>
                  <span className="text-amber-400 font-black text-base">{formatRupiah(selectedItem.amount)}</span>
                </div>
              </div>
            ) : selectedItem.type === 'income' ? (
              /* Case 3: Penjualan Tunai Kasir */
              <div className="space-y-4">
                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Waktu Transaksi</span>
                    <span className="text-white font-medium">{formatDate(selectedItem.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Metode Pembayaran</span>
                    <span className="text-blue-400 font-bold uppercase">
                      💵 {selectedItem.category_label || 'Tunai'}
                    </span>
                  </div>
                  {selectedItem.customer_name && (
                    <div className="col-span-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-white/40 font-bold uppercase block">Nama Pelanggan</span>
                      <span className="text-[#F4F3ED] font-bold">{selectedItem.customer_name}</span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-wider px-1">
                    <span>Daftar Barang yang Dibeli</span>
                    <span>{(selectedItem.details || []).length} Jenis Barang</span>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {selectedItem.details && selectedItem.details.length > 0 ? (
                      selectedItem.details.map((detail, idx) => (
                        <div key={idx} className="p-3 bg-[#121110]/60 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-3">
                            <p className="font-bold text-white truncate">{detail.product_name}</p>
                            <p className="text-[10px] text-white/40 mt-0.5 font-medium">
                              {detail.quantity} × {formatRupiah(detail.price)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-white">
                              {formatRupiah(detail.quantity * detail.price)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-xs text-white/30 italic bg-white/5 rounded-xl border border-white/5">
                        Item transaksi diproses sebelum pembaruan sistem.
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-sm font-black">
                    <span className="text-green-400 uppercase tracking-wide text-xs">Total Pembelian</span>
                    <span className="text-green-400 text-base">{formatRupiah(selectedItem.amount)}</span>
                  </div>
                  
                  {selectedItem.payment_method === 'cash' && selectedItem.amount_paid != null && (
                    <div className="pt-2 border-t border-green-500/20 flex justify-between items-center text-xs text-white/70">
                      <span>Uang Diterima:</span>
                      <span className="font-bold text-white">{formatRupiah(selectedItem.amount_paid)}</span>
                    </div>
                  )}
                  {selectedItem.payment_method === 'cash' && selectedItem.change_amount != null && (
                    <div className="flex justify-between items-center text-xs text-white/70">
                      <span>Kembalian:</span>
                      <span className="font-bold text-white">{formatRupiah(selectedItem.change_amount)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Case 4: Pengeluaran */
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Waktu Pencatatan</span>
                    <span className="text-white font-medium">{formatDate(selectedItem.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Kategori Pengeluaran</span>
                    <span className="text-orange-400 font-bold">{selectedItem.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase block">Keterangan / Catatan</span>
                    <p className="text-[#F4F3ED] font-medium mt-0.5 whitespace-pre-wrap">{selectedItem.description || '-'}</p>
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex justify-between items-center">
                  <span className="text-red-400 font-bold text-xs uppercase">Nominal Biaya</span>
                  <span className="text-red-400 font-black text-base">{formatRupiah(selectedItem.amount)}</span>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-2.5 rounded-xl bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold text-xs transition cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.25)] active:scale-95"
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

