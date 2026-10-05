import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api';
import { 
  Table2, 
  Plus, 
  Users, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  X, 
  RefreshCw,
  QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [saving, setSaving] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.get('/admin/tables');
      if (res.data.success) {
        setTables(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar meja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openCreateModal = () => {
    setEditingTable(null);
    setTableNumber('');
    setCapacity('4');
    setIsModalOpen(true);
  };

  const openEditModal = (tbl) => {
    setEditingTable(tbl);
    setTableNumber(tbl.table_number);
    setCapacity(tbl.capacity.toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      toast.error('Nomor meja wajib diisi');
      return;
    }

    try {
      setSaving(true);
      if (editingTable) {
        const res = await employeeApi.put(`/admin/tables/${editingTable.id}`, {
          table_number: tableNumber.trim(),
          capacity: parseInt(capacity)
        });
        if (res.data.success) {
          toast.success(res.data.message);
          setIsModalOpen(false);
          fetchTables();
        }
      } else {
        const res = await employeeApi.post('/admin/tables', {
          table_number: tableNumber.trim(),
          capacity: parseInt(capacity)
        });
        if (res.data.success) {
          toast.success(res.data.message);
          setIsModalOpen(false);
          fetchTables();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan meja');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">Pengaturan Meja & Kapasitas</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Kelola tata letak nomor meja, kapasitas tamu, dan status ketersediaan live.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-lg shadow-amber-500/10 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Meja Baru
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-12 text-center text-stone-500 text-xs">
          Belum ada data meja restoran.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((tbl) => {
            const isAvailable = tbl.status === 'AVAILABLE';

            return (
              <div
                key={tbl.id}
                className={`bg-stone-900/80 border rounded-2xl p-4 flex flex-col justify-between transition relative overflow-hidden ${
                  isAvailable 
                    ? 'border-stone-800 hover:border-amber-500/40' 
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-400">Meja</span>
                    <button
                      onClick={() => openEditModal(tbl)}
                      className="p-1 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition"
                      title="Edit Meja"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-xl font-black text-white">{tbl.table_number}</h3>

                  <div className="flex items-center gap-1.5 text-stone-400 text-xs mt-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Kapasitas: {tbl.capacity} Orang</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isAvailable 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {isAvailable ? 'Kosong' : 'Terisi'}
                  </span>

                  <span className="text-[10px] text-stone-500">ID #{tbl.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-1">
              {editingTable ? `Edit Meja ${editingTable.table_number}` : 'Tambah Meja Baru'}
            </h3>
            <p className="text-stone-400 text-xs mb-4">
              Konfigurasi nomor meja dan jumlah kursi tamu.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">Nomor / Nama Meja</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meja 11 / VIP 01"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Kapasitas (Jumlah Tamu)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-lg shadow-amber-500/10 transition"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
