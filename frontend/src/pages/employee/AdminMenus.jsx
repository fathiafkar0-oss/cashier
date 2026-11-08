import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminMenus() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan',
    price: '',
    cost_price: '',
    description: '',
    image_url: '',
    is_available: true
  });
  const [saving, setSaving] = useState(false);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.get('/admin/menus?include_inactive=true');
      if (res.data.success) {
        setMenus(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const openCreateModal = () => {
    setEditingMenu(null);
    setFormData({
      name: '',
      category: 'Makanan',
      price: '',
      cost_price: '',
      description: '',
      image_url: '',
      is_available: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      category: menu.category,
      price: menu.price,
      cost_price: menu.cost_price,
      description: menu.description || '',
      image_url: menu.images && menu.images.length > 0 ? menu.images[0].image_url : '',
      is_available: menu.is_available
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price === '' || formData.cost_price === '') {
      toast.error('Nama, Harga Jual, dan Modal (HPP) wajib diisi');
      return;
    }

    try {
      setSaving(true);
      if (editingMenu) {
        // Update
        const res = await employeeApi.put(`/admin/menus/${editingMenu.id}`, formData);
        if (res.data.success) {
          toast.success('Menu berhasil diperbarui');
          setIsModalOpen(false);
          fetchMenus();
        }
      } else {
        // Create
        const res = await employeeApi.post('/admin/menus', formData);
        if (res.data.success) {
          toast.success('Menu baru berhasil ditambahkan');
          setIsModalOpen(false);
          fetchMenus();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan menu');
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async (menu) => {
    if (!window.confirm(`Yakin ingin menonaktifkan menu "${menu.name}"? Riwayat transaksi lama tetap aman.`)) {
      return;
    }

    try {
      const res = await employeeApi.delete(`/admin/menus/${menu.id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMenus();
      }
    } catch (err) {
      toast.error('Gagal menonaktifkan menu');
    }
  };

  const handleToggleAvailability = async (menu) => {
    try {
      const res = await employeeApi.patch(`/menus/${menu.id}/toggle-availability`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMenus();
      }
    } catch (err) {
      toast.error('Gagal memperbarui status ketersediaan');
    }
  };

  // Filter
  const categories = ['ALL', 'Makanan', 'Minuman', 'Camilan'];
  const filteredMenus = menus.filter((m) => {
    const matchCat = selectedCategory === 'ALL' || m.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Katalog Menu & Kontrol HPP</h1>
          <p className="text-soft text-sm mt-0.5">
            Atur harga jual, modal/HPP, margin kotor, dan ketersediaan menu secara akurat.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-on-accent font-extrabold rounded-xl shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Menu Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-panel/60 p-4 rounded-xl border border-line">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-accent text-on-accent'
                  : 'bg-raised text-soft hover:bg-raised-2'
              }`}
            >
              {cat === 'ALL' ? 'Semua Menu' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-soft absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-raised border border-line-strong rounded-xl text-xs text-ink placeholder-faint focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Menus Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-accent-text animate-spin" />
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="bg-panel/60 border border-line rounded-xl p-12 text-center text-faint">
          Tidak ada menu ditemukan.
        </div>
      ) : (
        <div className="bg-panel/80 border border-line rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-soft font-bold bg-canvas/40">
                  <th className="py-3 px-4">Menu</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Harga Jual</th>
                  <th className="py-3 px-3 text-right">Modal (HPP)</th>
                  <th className="py-3 px-3 text-right">Gross Margin</th>
                  <th className="py-3 px-3 text-center">Tersedia</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {filteredMenus.map((menu) => {
                  const marginRp = menu.price - menu.cost_price;
                  const marginPct = menu.price > 0 ? Math.round((marginRp / menu.price) * 100) : 0;
                  const primaryImg = menu.images && menu.images.length > 0 ? menu.images[0].image_url : null;

                  return (
                    <tr 
                      key={menu.id} 
                      className={`hover:bg-raised/30 transition ${!menu.is_active ? 'opacity-50 bg-canvas/20' : ''}`}
                    >
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-raised border border-line-strong flex-shrink-0 flex items-center justify-center">
                            {primaryImg ? (
                              <img src={primaryImg} alt={menu.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-faint" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-ink text-sm block">{menu.name}</span>
                            <span className="text-[11px] text-soft line-clamp-1">
                              {menu.description || 'Tidak ada deskripsi'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-soft font-semibold">{menu.category}</td>

                      {/* Harga Jual */}
                      <td className="py-3 px-3 text-right font-bold text-ink">
                        Rp {menu.price.toLocaleString('id-ID')}
                      </td>

                      {/* Modal / HPP */}
                      <td className="py-3 px-3 text-right font-medium text-periwinkle">
                        Rp {menu.cost_price.toLocaleString('id-ID')}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-success block">
                          Rp {marginRp.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-soft">({marginPct}%)</span>
                      </td>

                      {/* Tersedia Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleAvailability(menu)}
                          disabled={!menu.is_active}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                            menu.is_available
                              ? 'bg-success/10 border border-success/30 text-success hover:bg-success/20'
                              : 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20'
                          }`}
                        >
                          {menu.is_available ? 'Tersedia' : 'Habis'}
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-3 text-center">
                        {menu.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-faint">
                            <span className="w-1.5 h-1.5 rounded-full bg-faint" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(menu)}
                            className="p-1.5 rounded-lg bg-raised hover:bg-raised-2 text-soft hover:text-ink transition"
                            title="Edit Menu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {menu.is_active && (
                            <button
                              onClick={() => handleSoftDelete(menu)}
                              className="p-1.5 rounded-lg bg-raised hover:bg-danger/20 text-soft hover:text-danger transition"
                              title="Nonaktifkan Menu (Soft-Delete)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-panel border border-line rounded-xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-soft hover:text-ink hover:bg-raised"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-ink mb-1">
              {editingMenu ? `Edit Menu: ${editingMenu.name}` : 'Tambah Menu Baru'}
            </h3>
            <p className="text-soft text-xs mb-5">
              Tentukan harga jual dan HPP secara transparan untuk pelaporan profit.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-soft font-bold mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Nasi Goreng Spesial"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink placeholder-faint focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-soft font-bold mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Camilan">Camilan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-soft font-bold mb-1">URL Foto (Opsional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink placeholder-faint focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-soft font-bold mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="25000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent font-bold"
                  />
                </div>

                <div>
                  <label className="block text-soft font-bold mb-1">Modal / HPP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="12000"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink focus:outline-none focus:border-accent font-bold"
                  />
                </div>
              </div>

              {/* Profit preview */}
              {formData.price && formData.cost_price && (
                <div className="bg-canvas/60 p-3 rounded-xl border border-line flex justify-between items-center text-xs">
                  <span className="text-soft">Estimasi Gross Profit per Porsi:</span>
                  <span className="font-extrabold text-success">
                    Rp {(formData.price - formData.cost_price).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-soft font-bold mb-1">Deskripsi Singkat</label>
                <textarea
                  rows="2"
                  placeholder="Keterangan rasa, bumbu, atau porsi..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-raised border border-line-strong rounded-xl text-ink placeholder-faint focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  {saving ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
