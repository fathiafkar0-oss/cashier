import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../api';
import toast from 'react-hot-toast';
import { ShoppingBag, Search, Plus, Minus, ArrowLeft, Utensils, Coffee, Cookie } from 'lucide-react';

export default function MenuCatalog() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('customer_cart');
    return saved ? JSON.parse(saved) : {};
  });

  const selectedTable = JSON.parse(localStorage.getItem('selected_table') || 'null');

  useEffect(() => {
    if (!selectedTable) {
      toast.error('Silakan pilih nomor meja terlebih dahulu');
      navigate('/table-selection');
      return;
    }

    const fetchMenus = async () => {
      setLoading(true);
      try {
        const res = await customerApi.get('/menus');
        if (res.data.success) {
          setMenus(res.data.data);
        }
      } catch (err) {
        toast.error('Gagal memuat menu');
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('customer_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (menu) => {
    setCart((prev) => {
      const existing = prev[menu.id];
      if (existing) {
        return { ...prev, [menu.id]: { ...existing, quantity: existing.quantity + 1 } };
      }
      return {
        ...prev,
        [menu.id]: {
          id: menu.id,
          name: menu.name,
          price: menu.price,
          image_url: menu.image_url,
          quantity: 1,
          notes: ''
        }
      };
    });
  };

  const removeFromCart = (menuId) => {
    setCart((prev) => {
      const existing = prev[menuId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const categories = ['Semua', 'Makanan', 'Minuman', 'Cemilan'];

  const filteredMenus = menus.filter((menu) => {
    const matchesCat = selectedCategory === 'Semua' || menu.category === selectedCategory;
    const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (menu.description && menu.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-28">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/table-selection')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ganti Meja</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Meja Anda:</span>
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-lg font-extrabold text-sm">
              {selectedTable?.table_number || '-'}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari masakan atau minuman favorit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="max-w-4xl mx-auto mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800 border border-stone-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Cards Grid */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-stone-900 border border-stone-800 animate-pulse" />
            ))}
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center py-16 text-stone-500">
            <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada menu yang sesuai dengan pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMenus.map((menu) => {
              const inCartQty = cart[menu.id]?.quantity || 0;
              return (
                <div
                  key={menu.id}
                  className="bg-stone-900/90 border border-stone-800 hover:border-stone-700 rounded-2xl overflow-hidden flex flex-col justify-between transition group shadow-sm"
                >
                  <div className="relative h-44 w-full bg-stone-950 overflow-hidden">
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-stone-950/80 backdrop-blur-md border border-stone-700 text-amber-400">
                      {menu.category}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-amber-400 transition">
                        {menu.name}
                      </h3>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {menu.description || 'Hidangan lezat kaya bumbu istimewa.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                      <span className="text-base font-extrabold text-amber-400">
                        Rp {menu.price.toLocaleString('id-ID')}
                      </span>

                      {inCartQty > 0 ? (
                        <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 rounded-xl p-1">
                          <button
                            onClick={() => removeFromCart(menu.id)}
                            className="p-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 transition active:scale-90"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-1.5 text-white min-w-[20px] text-center">
                            {inCartQty}
                          </span>
                          <button
                            onClick={() => addToCart(menu)}
                            className="p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition active:scale-90"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(menu)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md shadow-amber-500/10 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pesan</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-40">
          <div className="max-w-4xl mx-auto bg-amber-500 text-stone-950 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-slideUp">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-stone-950 text-amber-400 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold opacity-80">{totalItems} Menu di Keranjang</p>
                <p className="text-lg font-black leading-tight">Rp {totalPrice.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="px-5 py-2.5 bg-stone-950 text-amber-400 hover:text-white rounded-xl text-sm font-bold transition flex items-center gap-2 active:scale-95 shadow-lg"
            >
              <span>Lanjut Bayar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
