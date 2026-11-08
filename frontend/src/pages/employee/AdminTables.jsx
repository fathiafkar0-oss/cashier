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
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Pengaturan Meja & Kapasitas</h1>
          <p className="text-soft text-sm mt-0.5">
            Kelola tata letak nomor meja, kapasitas tamu, dan status ketersediaan live.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-on-accent font-extrabold rounded-xl shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Meja Baru
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-accent-text animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-panel/60 border border-line rounded-xl p-12 text-center text-faint text-xs">
          Belum ada data meja restoran.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((tbl) => {
            const isAvailable = tbl.status === 'AVAILABLE';

            return (
              <div
                key={tbl.id}
                className={`bg-panel/80 border rounded-xl p-4 flex flex-col justify-between transition relative overflow-hidden ${
                  isAvailable 
                    ? 'border-line hover:border-accent/40' 
                    : 'border-danger/30 bg-danger/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-soft">Meja</span>
                    <button
                      onClick={() => openEditModal(tbl)}
                      className="p-1 rounded text-soft hover:text-ink hover:bg-raised transition"
                      title="Edit Meja"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-xl font-extrabold text-ink">{tbl.table_number}</h3>

                  <div className="flex items-center gap-1.5 text-soft text-xs mt-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Kapasitas: {tbl.capacity} Orang</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line/80 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                    isAvailable 
                      ? 'bg-success/10 text-success border border-success/20' 
                      : 'bg-danger/10 text-danger border border-danger/20'
                  }`}>
                    {isAvailable ? 'Kosong' : 'Terisi'}
                  </span>

                  <span className="text-[11px] text-faint">ID #{tbl.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-panel border border-line rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-soft hover:text-ink hover:bg-raised"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-ink mb-1">
              {editingTable ? `Edit Meja ${editingTable.table_number}` : 'Tambah Meja Baru'}
            </h3>
            <p className="text-soft text-xs mb-4">
              Konfigurasi nomor meja dan jumlah kursi tamu.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-soft font-bold mb-1">Nomor / Nama Meja</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meja 11 / VIP 01"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink placeholder-faint focus:outline-none focus:border-accent font-bold"
                />
              </div>

              <div>
                <label className="block text-soft font-bold mb-1">Kapasitas (Jumlah Tamu)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-raised text-soft hover:bg-raised-2 font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-extrabold shadow-lg transition"
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
