import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../api';
import toast from 'react-hot-toast';
import { ShoppingBag, Search, Plus, ArrowLeft, Utensils } from 'lucide-react';
import QuantityStepper from '../../components/customer/QuantityStepper';

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
    <div className="theme-light min-h-screen bg-canvas pb-32 text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 px-5 pb-3 pt-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button
            onClick={() => navigate('/table-selection')}
            className="flex items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-semibold text-soft transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ganti Meja</span>
          </button>

          <span className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-bold text-on-accent">
            Meja {selectedTable?.table_number || '-'}
          </span>
        </div>

        <div className="mx-auto mt-3 max-w-5xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="text"
              placeholder="Cari masakan atau minuman favorit..."
              aria-label="Cari menu"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-transparent bg-panel py-3 pl-11 pr-4 text-base text-ink placeholder-faint transition focus:border-line-strong focus:outline-none sm:text-sm"
            />
          </div>
        </div>

        <div className="scrollbar-none mx-auto mt-3 flex max-w-5xl gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-accent text-on-accent'
                  : 'text-soft hover:bg-panel hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-raised sm:h-72" />
            ))}
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="py-16 text-center">
            <Utensils className="mx-auto mb-3 h-10 w-10 text-periwinkle" />
            <p className="font-semibold">Tidak ada menu yang sesuai dengan pencarian.</p>
            <p className="mt-1 text-sm text-soft">Coba kata lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {filteredMenus.map((menu) => {
              const inCartQty = cart[menu.id]?.quantity || 0;
              return (
                <article
                  key={menu.id}
                  className={`group flex flex-row-reverse gap-3 rounded-2xl bg-panel p-3 sm:flex-col sm:gap-0 sm:overflow-hidden sm:p-0 ${
                    inCartQty > 0 ? 'ring-2 ring-abyss' : ''
                  }`}
                >
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-movie sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none">
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between sm:p-4">
                    <div>
                      <p className="text-xs font-medium text-faint">{menu.category}</p>
                      <h3 className="mt-0.5 text-base font-bold leading-snug tracking-tight">{menu.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-snug text-soft">
                        {menu.description || 'Hidangan lezat kaya bumbu istimewa.'}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 sm:mt-4">
                      <span className="whitespace-nowrap text-base font-extrabold tracking-tight">
                        Rp {menu.price.toLocaleString('id-ID')}
                      </span>

                      {inCartQty > 0 ? (
                        <QuantityStepper
                          name={menu.name}
                          quantity={inCartQty}
                          onDecrease={() => removeFromCart(menu.id)}
                          onIncrease={() => addToCart(menu)}
                        />
                      ) : (
                        <button
                          onClick={() => addToCart(menu)}
                          aria-label={`Pesan ${menu.name}`}
                          className="flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-on-accent transition hover:bg-accent-hover active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Pesan</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
          <div className="theme-dark mx-auto flex max-w-5xl animate-slideUp items-center justify-between gap-4 rounded-full bg-canvas py-2.5 pl-6 pr-2.5 text-ink shadow-[0_18px_40px_-12px_rgba(16,22,26,0.6)]">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-soft" />
              <div>
                <p className="text-xs text-soft">{totalItems} menu di keranjang</p>
                <p className="text-lg font-extrabold leading-tight tracking-tight">Rp {totalPrice.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-on-accent transition hover:bg-accent-hover active:scale-95"
            >
              Lanjut Bayar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
