import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../api';
import toast from 'react-hot-toast';
import { Users, AlertTriangle, CheckCircle, ArrowRight, Utensils, RefreshCw } from 'lucide-react';

export default function TableSelection() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await customerApi.get('/tables');
      if (res.data.success) {
        setTables(res.data.data);
      }
    } catch (err) {
      toast.error('Gagal memuat daftar meja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSelectTable = (table) => {
    if (table.status !== 'AVAILABLE') {
      toast.error(`Meja ${table.table_number} sedang digunakan.`);
      return;
    }
    setSelectedTable(table);
    setConfirmed(false);
    setIsModalOpen(true);
  };

  const handleProceedToMenu = () => {
    if (!confirmed) {
      toast.error('Anda wajib menyetujui pernyataan konfirmasi meja.');
      return;
    }
    localStorage.setItem('selected_table', JSON.stringify(selectedTable));
    setIsModalOpen(false);
    toast.success(`Meja ${selectedTable.table_number} dipilih. Selamat memesan!`);
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-stone-800 bg-stone-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Resto Self-Order</h1>
            <p className="text-xs text-stone-400">Pilih nomor meja tempat Anda duduk</p>
          </div>
        </div>

        <button 
          onClick={fetchTables} 
          className="p-2 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white transition"
          title="Segarkan Meja"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </header>

      {/* Main Grid Meja */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Daftar Meja Makan</h2>
            <p className="text-sm text-stone-400">Silakan pilih meja yang sedang Anda tempati</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Tersedia
            </span>
            <span className="flex items-center gap-1.5 text-stone-500">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-600"></span>
              Terisi
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-stone-900 animate-pulse border border-stone-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {tables.map((table) => {
              const isAvailable = table.status === 'AVAILABLE';
              return (
                <button
                  key={table.id}
                  disabled={!isAvailable}
                  onClick={() => handleSelectTable(table)}
                  className={`relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-36 ${
                    isAvailable
                      ? 'bg-stone-900/90 border-stone-700/80 hover:border-amber-500/80 hover:bg-stone-850 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer active:scale-95'
                      : 'bg-stone-900/30 border-stone-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl font-extrabold text-white">
                      {table.table_number}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        isAvailable
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-stone-800 border-stone-700 text-stone-400'
                      }`}
                    >
                      {isAvailable ? 'Kosong' : 'Terisi'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>Kapasitas {table.capacity} Orang</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Dialog Konfirmasi Table Lock (Wajib Persyaratan Rubrik POS) */}
      {isModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">PERHATIAN</h3>
                <p className="text-xs text-amber-400/80">Konfirmasi Meja {selectedTable.table_number}</p>
              </div>
            </div>

            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 text-sm text-stone-300 leading-relaxed mb-5">
              <p className="mb-2">
                Pastikan Anda sudah berada di meja yang benar yaitu <strong>{selectedTable.table_number}</strong>.
              </p>
              <p className="text-stone-400 text-xs">
                Setelah transaksi dibuat, Anda <strong className="text-amber-400">tidak diperbolehkan berpindah meja</strong> selama transaksi berlangsung agar pesanan diantar dengan tepat.
              </p>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-700 bg-stone-850 hover:bg-stone-800/80 cursor-pointer transition select-none mb-6">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-stone-600 text-amber-500 focus:ring-amber-500 bg-stone-900"
              />
              <span className="text-xs text-stone-200 leading-normal">
                Saya sudah memastikan nomor meja saya benar dan tidak akan berpindah meja selama transaksi berlangsung.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-700 text-stone-300 font-semibold text-sm hover:bg-stone-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!confirmed}
                onClick={handleProceedToMenu}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                  confirmed
                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-95'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
