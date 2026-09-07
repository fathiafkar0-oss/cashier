import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Search, Plus, CreditCard, X, History, ShoppingBag, 
  Calendar, Clock, CheckCircle2, AlertCircle, ArrowDownRight, 
  ArrowUpRight, Receipt, Loader2, ChevronRight
} from 'lucide-react';
import api from '../api';
import { formatRupiah } from './Dashboard';

export default function Kasbon() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // State Modal Bayar Kasbon
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // State Tambah Pelanggan Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // State Detail & Riwayat Kasbon Pelanggan
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data);
    } catch (err) {
      toast.error('Gagal memuat daftar kasbon');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openPayModal = (customer) => {
    setSelectedCustomer(customer);
    setPayAmount(customer.total_debt.toString()); // Default: isi penuh sisa utang
    setShowPayModal(true);
  };

  const openHistoryModal = async (customer) => {
    setHistoryCustomer(customer);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setHistoryData(null);
    try {
      const res = await api.get(`/api/customers/${customer.id}/history`);
      setHistoryData(res.data);
    } catch (err) {
      toast.error('Gagal memuat rincian riwayat kasbon');
    } finally {
      setLoadingHistory(false);
    }
  };


  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || parseInt(payAmount) <= 0) {
      toast.error('Nominal cicilan/pelunasan tidak valid.');
      return;
    }

    const amount = parseInt(payAmount);
    if (amount > selectedCustomer.total_debt) {
      toast.error(`Jumlah bayar melebihi total sisa kasbon (${formatRupiah(selectedCustomer.total_debt)})`);
      return;
    }

    setSubmittingPay(true);
    try {
      await api.post(`/api/customers/${selectedCustomer.id}/pay-debt`, { amount });
      toast.success(`Pembayaran kasbon untuk ${selectedCustomer.name} berhasil dicatat.`);
      setShowPayModal(false);
      setPayAmount('');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memproses pembayaran kasbon');
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      toast.error('Nama pelanggan wajib diisi.');
      return;
    }

    setSubmittingAdd(true);
    try {
      await api.post('/api/customers', { name: newCustName.trim() });
      toast.success(`Pelanggan "${newCustName.trim()}" berhasil ditambahkan.`);
      setShowAddModal(false);
      setNewCustName('');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menambah pelanggan baru');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mr-3"></div>
        <p className="text-slate-400 font-semibold">Memuat modul kasbon...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative z-10">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-[#1a1816]/60 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] placeholder-white/25 transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),_0_1px_1px_rgba(255,255,255,0.05)] text-sm"
            placeholder="Cari nama pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3.5 top-3.5 text-white/40" size={16} />
        </div>
        
        {/* Info & Add Button */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Stats 1 */}
          <div className="bg-[#2A2A2A]/40 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 shadow-md flex items-center space-x-2">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Total Pelanggan:</span>
            <span className="text-sm font-extrabold text-white">{customers.length}</span>
          </div>

          {/* Stats 2 */}
          <div className="bg-[#2A2A2A]/40 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 shadow-md flex items-center space-x-2">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Pelanggan Berutang:</span>
            <span className="text-sm font-extrabold text-amber-400">{customers.filter(c => c.total_debt > 0).length}</span>
          </div>

          {/* Add Customer Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-full px-5 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] transition duration-200 active:scale-95 flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <Plus size={14} />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-[#2A2A2A]/30 backdrop-blur-md border border-white/10 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-white/30 italic">
              Daftar pelanggan kosong.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/15 border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-white/40">
                  <th className="px-6 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4 text-right">Saldo Kasbon</th>
                  <th className="px-6 py-4 text-center">Tanggal Didaftarkan</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredCustomers.map((customer) => {
                  const hasDebt = customer.total_debt > 0;

                  return (
                    <tr key={customer.id} className="hover:bg-white/5 transition-colors duration-150">
                      <td className="px-6 py-4 font-semibold text-white">{customer.name}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-[#F4F3ED]">
                        {formatRupiah(customer.total_debt)}
                      </td>
                      <td className="px-6 py-4 text-center text-white/40">
                        {new Date(customer.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          hasDebt 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' 
                            : 'bg-green-500/20 text-green-400 border-green-500/20'
                        }`}>
                          {hasDebt ? 'Berutang' : 'Lunas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Tombol Lihat Riwayat Detail */}
                          <button
                            onClick={() => openHistoryModal(customer)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold rounded-full text-xs border border-white/10 transition duration-150 cursor-pointer"
                            title="Lihat Rincian Riwayat Kasbon"
                          >
                            <History size={12} className="text-[#F4F3ED]" />
                            <span>Riwayat</span>
                          </button>

                          {/* Tombol Bayar Kasbon */}
                          {hasDebt && (
                            <button
                              onClick={() => openPayModal(customer)}
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-full text-xs shadow-[0_2px_8px_rgba(0,0,0,0.15),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer transition duration-150 active:scale-95"
                            >
                              <CreditCard size={12} />
                              <span>Bayar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Tambah Pelanggan Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#1e1c1a] border border-white/15 rounded-[2.5rem] p-8 shadow-2xl relative max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-extrabold text-white mb-6">Tambah Pelanggan Baru</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Nama Lengkap Pelanggan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Budi RT 02"
                  className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  disabled={submittingAdd}
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white rounded-full font-bold transition duration-200 cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-full transition duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer active:scale-95 text-xs"
                  disabled={submittingAdd}
                >
                  {submittingAdd ? 'Menyimpan...' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bayar Kasbon */}
      {showPayModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1c1a] border border-white/15 rounded-[2.5rem] p-8 shadow-2xl relative max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-extrabold text-white mb-6">Catat Pembayaran Kasbon</h3>
            
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Nama Pelanggan</span>
                <span className="text-base font-extrabold text-white block mt-1">{selectedCustomer.name}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Sisa Utang Aktif</span>
                <span className="text-2xl font-black text-amber-400 block mt-1 drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]">{formatRupiah(selectedCustomer.total_debt)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white font-extrabold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  disabled={submittingPay}
                />
                <span className="text-[10px] text-white/40 mt-2 block leading-relaxed">
                  Ubah angka di atas jika pelanggan melakukan pembayaran cicil (sebagian).
                </span>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white rounded-full font-bold transition duration-200 cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-full transition duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer active:scale-95 text-xs"
                  disabled={submittingPay}
                >
                  {submittingPay ? 'Mencatat...' : 'Konfirmasi Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Riwayat Kasbon Pelanggan */}
      {showHistoryModal && historyCustomer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#181615]/95 border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9),_inset_0_1px_1px_rgba(255,255,255,0.15)] relative max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Rincian Riwayat Kasbon</h3>
                  <p className="text-xs text-white/50">
                    Pelanggan: <strong className="text-white font-bold">{historyCustomer.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 shrink-0">
              {/* Sisa Kasbon */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Sisa Tagihan</span>
                <span className={`text-lg font-black block mt-0.5 ${
                  (historyData?.total_debt ?? historyCustomer.total_debt) > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatRupiah(historyData?.total_debt ?? historyCustomer.total_debt)}
                </span>
              </div>

              {/* Total Kasbon Baru */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Total Transaksi Kasbon</span>
                <span className="text-lg font-black text-white block mt-0.5">
                  {historyData?.transaction_count ?? 0} Transaksi
                </span>
              </div>

              {/* Total Pembayaran */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Riwayat Pembayaran</span>
                <span className="text-lg font-black text-emerald-400 block mt-0.5">
                  {historyData?.payment_count ?? 0} Kali Bayar
                </span>
              </div>
            </div>

            {/* Timeline List Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {loadingHistory ? (
                <div className="py-16 text-center">
                  <Loader2 size={32} className="animate-spin mx-auto text-amber-400 mb-3" />
                  <p className="text-xs text-white/40 font-semibold">Memuat riwayat transaksi kasbon...</p>
                </div>
              ) : !historyData || historyData.timeline.length === 0 ? (
                <div className="py-16 text-center bg-white/5 rounded-2xl border border-white/5 p-6">
                  <Receipt size={36} className="mx-auto text-white/20 mb-2" />
                  <p className="text-sm font-bold text-white mb-1">Belum Ada Riwayat Kasbon</p>
                  <p className="text-xs text-white/40">
                    Pelanggan ini belum memiliki catatan pengambilan kasbon atau pembayaran cicilan.
                  </p>
                </div>
              ) : (
                historyData.timeline.map((item) => {
                  const isDebt = item.type === 'debt';
                  const dateObj = new Date(item.created_at);
                  const formattedDate = dateObj.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border transition ${
                        isDebt 
                          ? 'bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30' 
                          : 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30'
                      }`}
                    >
                      {/* Item Top Bar */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${
                            isDebt ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {isDebt ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                isDebt ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                {isDebt ? 'Kasbon Baru' : 'Pembayaran Kasbon'}
                              </span>
                              {item.transaction_code && (
                                <span className="text-[11px] font-mono text-white/40 font-bold">
                                  #{item.transaction_code}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {formattedDate}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {formattedTime} WIB
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Nominal */}
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-white/40 block">
                            {isDebt ? 'Nominal Hutang' : 'Dibayarkan'}
                          </span>
                          <span className={`text-base font-black ${
                            isDebt ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {isDebt ? `+${formatRupiah(item.amount)}` : `-${formatRupiah(item.amount)}`}
                          </span>
                        </div>
                      </div>

                      {/* Rincian Barang untuk Kasbon */}
                      {isDebt && item.items && item.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 bg-black/20 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                            <ShoppingBag size={12} className="text-[#F4F3ED]" /> Barang yang Diambil:
                          </span>
                          <div className="space-y-1.5">
                            {item.items.map((prod, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-white/80">
                                <div className="truncate pr-2">
                                  <span className="font-semibold text-white">{prod.product_name}</span>
                                  <span className="text-white/40 text-[11px] ml-1.5">({prod.quantity}x @{formatRupiah(prod.price)})</span>
                                </div>
                                <span className="font-bold text-white shrink-0">
                                  {formatRupiah(prod.subtotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between shrink-0">
              <span className="text-xs text-white/40">
                Total {historyData?.timeline?.length || 0} catatan riwayat
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition border border-white/5 cursor-pointer"
                >
                  Tutup
                </button>

                {(historyCustomer.total_debt > 0 || (historyData?.total_debt > 0)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHistoryModal(false);
                      openPayModal(historyCustomer);
                    }}
                    className="px-5 py-2.5 bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-full transition duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer active:scale-95 text-xs flex items-center gap-1.5"
                  >
                    <CreditCard size={14} />
                    <span>Bayar Kasbon Sekarang</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

