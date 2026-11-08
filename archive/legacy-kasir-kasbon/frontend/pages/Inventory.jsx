import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, X, AlertTriangle, Calculator } from 'lucide-react';
import api from '../api';
import { formatRupiah } from './Dashboard';
import QuickCalculator from '../components/QuickCalculator';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // State Modal (Add/Edit)
  const [showModal, setShowModal] = useState(false);
  const [showInventoryCalc, setShowInventoryCalc] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    cost_price: '',
    price: '',
    stock: '0',
    min_stock: '5',
    category: 'Lainnya',
    is_retail: false,
    retail_group: 'A',
    half_pack_price: '',
    pack_size: '16'
  });

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (err) {
      toast.error('Gagal memuat daftar inventaris');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      sku: '',
      name: '',
      cost_price: '',
      price: '',
      stock: '0',
      min_stock: '5',
      category: 'Lainnya',
      is_retail: false,
      retail_group: 'A',
      half_pack_price: '',
      pack_size: '16'
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditId(product.id);
    const packSize = product.pack_size || 16;
    const displayStock = product.is_retail 
      ? Math.floor(product.stock / packSize).toString() 
      : product.stock.toString();
    const displayMinStock = product.is_retail
      ? Math.floor(product.min_stock / packSize).toString()
      : product.min_stock.toString();

    setFormData({
      sku: product.sku || '',
      name: product.name,
      cost_price: product.cost_price.toString(),
      price: product.price.toString(),
      stock: displayStock,
      min_stock: displayMinStock,
      category: product.category || 'Lainnya',
      is_retail: product.is_retail || false,
      retail_group: product.retail_group || 'A',
      half_pack_price: product.half_pack_price ? product.half_pack_price.toString() : '',
      pack_size: packSize.toString()
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, price, cost_price } = formData;
    if (!name || !price || !cost_price) {
      toast.error('Kolom nama, harga jual, dan harga modal wajib diisi.');
      return;
    }

    try {
      const isRetail = formData.is_retail;
      const packSize = parseInt(formData.pack_size || 16);
      const rawStock = parseInt(formData.stock || 0);
      const rawMinStock = parseInt(formData.min_stock || 5);
      
      const stock = isRetail ? rawStock * packSize : rawStock;
      const minStock = isRetail ? rawMinStock * packSize : rawMinStock;

      const payload = {
        sku: formData.sku.trim() || null,
        name: formData.name.trim(),
        cost_price: parseInt(formData.cost_price),
        price: parseInt(formData.price),
        stock: stock,
        min_stock: minStock,
        category: formData.category,
        is_retail: isRetail,
        retail_group: isRetail ? formData.retail_group : null,
        half_pack_price: isRetail && formData.half_pack_price ? parseInt(formData.half_pack_price) : null,
        pack_size: isRetail ? packSize : null
      };

      if (editId) {
        await api.put(`/api/products/${editId}`, payload);
        toast.success('Produk berhasil diperbarui.');
      } else {
        await api.post('/api/products', payload);
        toast.success('Produk baru berhasil didaftarkan.');
      }

      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data produk');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini dari katalog?')) return;

    try {
      await api.delete(`/api/products/${productId}`);
      toast.success('Produk berhasil dihapus dari katalog.');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus produk');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mr-3"></div>
        <p className="text-slate-400 font-semibold">Memuat modul inventaris...</p>
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
            placeholder="Cari nama barang atau barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3.5 top-3.5 text-white/40" size={16} />
        </div>

        {/* Info & Add Button */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Stats 1 */}
          <div className="bg-[#2A2A2A]/40 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 shadow-md flex items-center space-x-2">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Total Jenis:</span>
            <span className="text-sm font-extrabold text-white">{products.length}</span>
          </div>

          {/* Stats 2 */}
          {products.filter(p => p.stock < p.min_stock).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-4 py-2 shadow-md flex items-center space-x-2 animate-pulse">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Stok Kritis:</span>
              <span className="text-sm font-extrabold">
                {products.filter(p => p.stock < p.min_stock).length}
              </span>
            </div>
          )}

          {/* Quick Calculator Button */}
          <button
            onClick={() => setShowInventoryCalc(true)}
            className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 font-bold rounded-full px-4 py-2.5 transition duration-200 active:scale-95 flex items-center space-x-1.5 cursor-pointer text-xs"
            title="Kalkulator Modal / Mark-up"
          >
            <Calculator size={14} />
            <span>Kalkulator</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={openAddModal}
            className="bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-full px-5 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] transition duration-200 active:scale-95 flex items-center space-x-1.5 cursor-pointer text-xs"
          >
            <Plus size={14} />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#2A2A2A]/30 backdrop-blur-md border border-white/10 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/15 border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-white/40">
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">SKU/Barcode</th>
                <th className="px-6 py-4 text-right">Harga Modal</th>
                <th className="px-6 py-4 text-right">Harga Jual</th>
                <th className="px-6 py-4 text-center">Stok</th>
                <th className="px-6 py-4 text-center">Stok Min</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock < product.min_stock;
                return (
                  <tr 
                    key={product.id} 
                    className="hover:bg-white/5 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-semibold text-white">{product.name}</td>
                    <td className="px-6 py-4 text-white/60 text-xs">
                      <span className="px-2 py-1 rounded-lg bg-white/5 text-white/80 border border-white/5 font-medium text-[11px]">
                        {product.category || 'Lainnya'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60 font-mono text-xs">{product.sku || '-'}</td>
                    <td className="px-6 py-4 text-right text-white/40">{formatRupiah(product.cost_price)}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#F4F3ED]">{formatRupiah(product.price)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                        isOutOfStock 
                          ? 'bg-red-500/20 text-red-400 border-red-500/20' 
                          : isLowStock 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' 
                            : 'bg-white/5 text-[#F4F3ED] border-white/10'
                      }`}>
                        {product.is_retail ? (
                          `${Math.floor(product.stock / (product.pack_size || 16))} bks (${product.stock} btg)`
                        ) : (
                          `${product.stock} pcs`
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-white/40">
                      {product.is_retail ? (
                        `${Math.floor(product.min_stock / (product.pack_size || 16))} bks`
                      ) : (
                        `${product.min_stock} pcs`
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition cursor-pointer"
                          title="Edit Barang"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-400/60 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-xl transition cursor-pointer"
                          title="Hapus Barang"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-white/30 italic">
                    Belum ada data barang atau hasil pencarian nihil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#1e1c1a] border border-white/15 rounded-[2.5rem] p-8 shadow-2xl relative max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] scrollbar-thin">
            <h3 className="text-xl font-extrabold text-white mb-6">
              {editId ? 'Perbarui Produk' : 'Tambah Produk Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Pilih Kategori Produk</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Makanan', 'Minuman', 'Rokok', 'Sembako', 'Kue / Titipan', 'Lainnya'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        formData.category === cat
                          ? 'bg-[#F4F3ED] border-white/20 text-[#1E1E1E] shadow-md'
                          : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Nama Barang</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  placeholder="Contoh: Kopi Bubuk Kasar"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Barcode / SKU</label>
                  <input
                    type="text"
                    name="sku"
                    className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                    placeholder="Barcode SKU"
                    value={formData.sku}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">
                    {formData.is_retail ? 'Stok (Bungkus)' : 'Jumlah Stok'}
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                    placeholder={formData.is_retail ? "Contoh: 10" : "Stok saat ini"}
                    value={formData.stock}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {formData.category === 'Rokok' && (
                <div className="space-y-4 p-4 rounded-3xl border border-white/5 bg-black/20">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_retail"
                      checked={formData.is_retail}
                      onChange={handleInputChange}
                      className="rounded border-white/10 bg-[#1a1816] text-[#F4F3ED] focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-xs font-bold text-[#F4F3ED]">Barang ini dijual eceran (Khusus Rokok / Ketengan)</span>
                  </label>

                  {formData.is_retail && (
                    <div className="space-y-4 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Pilih Kelompok Tarif Ketengan (Hitung Otomatis)</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'A', name: 'Kelompok A (Premium)', desc: '1 btg: 3rb | 2 btg: 5rb\n3 btg: 7rb | 4 btg: 10rb' },
                            { id: 'B', name: 'Kelompok B (Promo)', desc: '1 btg: 2rb | 2 btg: 4rb\n3 btg: 5rb | 4 btg: 7rb' },
                            { id: 'C', name: 'Kelompok C (Flat)', desc: '1 btg: 2rb | 2 btg: 4rb\nN btg: N x 2rb' },
                          ].map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, retail_group: g.id })}
                              className={`p-2.5 rounded-2xl text-left transition border cursor-pointer flex flex-col justify-between h-24 ${
                                formData.retail_group === g.id
                                  ? 'bg-[#F4F3ED] border-white/20 text-[#1E1E1E] shadow-md'
                                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                              }`}
                            >
                              <span className="text-[10px] font-black block leading-tight">{g.name}</span>
                              <span className={`text-[8px] leading-tight whitespace-pre-line ${formData.retail_group === g.id ? 'text-black/60' : 'text-white/30'}`}>{g.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Harga Jual 1/2 Bungkus</label>
                          <input
                            type="number"
                            name="half_pack_price"
                            className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                            placeholder="Contoh: 14000 (Opsional)"
                            value={formData.half_pack_price}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Isi Batang per Bungkus</label>
                          <input
                            type="number"
                            name="pack_size"
                            required={formData.is_retail}
                            className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                            placeholder="Contoh: 16"
                            value={formData.pack_size}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest">Harga Modal</label>
                    <button
                      type="button"
                      onClick={() => setShowInventoryCalc(true)}
                      className="text-[10px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 font-medium transition cursor-pointer"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Hitung</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    name="cost_price"
                    required
                    className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                    placeholder="Harga beli"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest">Harga Jual</label>
                    <button
                      type="button"
                      onClick={() => setShowInventoryCalc(true)}
                      className="text-[10px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 font-medium transition cursor-pointer"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Hitung</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    name="price"
                    required
                    className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                    placeholder="Harga jual"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  {formData.is_retail ? 'Stok Minimum Peringatan (Bungkus)' : 'Stok Minimum Peringatan'}
                </label>
                <input
                  type="number"
                  name="min_stock"
                  required
                  className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  placeholder="Contoh: 5"
                  value={formData.min_stock}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white rounded-full font-bold transition duration-200 cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-full transition duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer active:scale-95 text-xs"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Calculator Modal for Inventory */}
      <QuickCalculator
        isOpen={showInventoryCalc}
        onClose={() => setShowInventoryCalc(false)}
        onApply={(val) => {
          setFormData(prev => ({ ...prev, cost_price: val.toString() }));
          toast.success(`Rp ${val.toLocaleString('id-ID')} diterapkan ke Harga Modal!`);
        }}
        applyLabel="Terapkan ke Harga Modal"
        onSecondaryApply={(val) => {
          setFormData(prev => ({ ...prev, price: val.toString() }));
          toast.success(`Rp ${val.toLocaleString('id-ID')} diterapkan ke Harga Jual!`);
        }}
        secondaryApplyLabel="Terapkan ke Harga Jual"
        title="Kalkulator Modal & Harga Jual"
      />
    </div>
  );
}
