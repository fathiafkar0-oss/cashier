import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, ShoppingCart, Plus, Minus, Trash2, UserPlus, Calculator } from 'lucide-react';
import api from '../api';
import { formatRupiah } from './Dashboard';
import QuickCalculator from '../components/QuickCalculator';
import CustomItemCalculatorModal from '../components/CustomItemCalculatorModal';

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

export const calculateCigarettePrice = (item, quantity) => {
  if (item.is_custom) return item.price * quantity;
  if (!item.is_retail) return item.price * quantity;

  const packSize = item.pack_size || 16;
  const packPrice = item.price;
  const halfPackSize = Math.floor(packSize / 2);
  const halfPackPrice = item.half_pack_price;

  let total = 0;
  let remaining = quantity;

  // 1. Hitung kelipatan bungkus utuh
  const packs = Math.floor(remaining / packSize);
  total += packs * packPrice;
  remaining %= packSize;

  // 2. Hitung setengah bungkus
  if (halfPackPrice && remaining >= halfPackSize) {
    total += halfPackPrice;
    remaining -= halfPackSize;
  }

  // 3. Hitung sisa batang eceran
  let retailPrice = 0;
  if (remaining > 0) {
    if (item.retail_group === 'A') {
      const rates = [0, 3000, 5000, 7000, 10000];
      const groupsOf4 = Math.floor(remaining / 4);
      const rem4 = remaining % 4;
      retailPrice = (groupsOf4 * 10000) + rates[rem4];
    } else if (item.retail_group === 'B') {
      const rates = [0, 2000, 4000, 5000, 7000];
      const groupsOf4 = Math.floor(remaining / 4);
      const rem4 = remaining % 4;
      retailPrice = (groupsOf4 * 7000) + rates[rem4];
    } else if (item.retail_group === 'C') {
      retailPrice = remaining * 2000;
    } else {
      retailPrice = remaining * Math.floor(packPrice / packSize);
    }
  }

  total += retailPrice;
  return total;
};

export const formatCartQuantity = (item) => {
  if (item.is_custom) return `${item.quantity}x`;
  if (!item.is_retail) return `${item.quantity} unit`;
  const packSize = item.pack_size || 16;
  const packs = Math.floor(item.quantity / packSize);
  const btg = item.quantity % packSize;
  let parts = [];
  if (packs > 0) parts.push(`${packs} bks`);
  if (btg > 0) parts.push(`${btg} btg`);
  return parts.join(' + ') || '0 btg';
};

export default function Cashier() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerId, setCustomerId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [showCashierCalc, setShowCashierCalc] = useState(false);
  const [showCustomItemCalc, setShowCustomItemCalc] = useState(false);
  
  // State untuk tambah pelanggan cepat
  const [newCustomerName, setNewCustomerName] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/customers'),
      ]);
      setProducts(prodRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      toast.error('Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCustomItem = (customItem) => {
    const existingIndex = cart.findIndex(i => i.is_custom && i.name === customItem.name && i.price === customItem.price);
    if (existingIndex !== -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += customItem.quantity;
      setCart(updated);
    } else {
      setCart([...cart, customItem]);
    }
  };

  const addToCart = (product, qtyToAdd = 1) => {
    if (product.stock <= 0) {
      toast.error('Stok barang habis!');
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity + qtyToAdd > product.stock) {
        toast.error(`Batas stok tercapai. Tersedia: ${product.stock} unit`);
        return;
      }
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + qtyToAdd }
          : item
      ));
    } else {
      if (qtyToAdd > product.stock) {
        toast.error(`Batas stok tercapai. Tersedia: ${product.stock} unit`);
        return;
      }
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        quantity: qtyToAdd,
        is_retail: product.is_retail,
        pack_size: product.pack_size,
        half_pack_price: product.half_pack_price,
        retail_group: product.retail_group,
        is_custom: false
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(i => i.product_id !== productId));
      return;
    }

    if (!item.is_custom && newQty > item.stock) {
      toast.error(`Batas stok tercapai. Tersedia: ${item.stock} unit`);
      return;
    }

    setCart(cart.map(i => 
      i.product_id === productId 
        ? { ...i, quantity: newQty }
        : i
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + calculateCigarettePrice(item, item.quantity), 0);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    try {
      const response = await api.post('/api/customers', { name: newCustomerName.trim() });
      toast.success(`Pelanggan "${response.data.name}" berhasil ditambahkan.`);
      setCustomers([...customers, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setCustomerId(response.data.id);
      setNewCustomerName('');
      setShowAddCustomer(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menambah pelanggan');
    }
  };

  const handleCheckout = async () => {
    const total = calculateTotal();
    
    if (cart.length === 0) {
      toast.error('Keranjang belanja kosong');
      return;
    }

    if (paymentMethod === 'kasbon' && !customerId) {
      toast.error('Pilih nama pelanggan untuk metode Kasbon');
      return;
    }

    let paidVal = 0;
    if (paymentMethod === 'cash') {
      paidVal = parseInt(amountPaid || 0);
      if (paidVal < total) {
        toast.error('Jumlah uang pembayaran tidak mencukupi');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.is_custom ? null : item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        amount_paid: paidVal,
        customer_id: paymentMethod === 'kasbon' ? parseInt(customerId) : null
      };

      const response = await api.post('/api/transactions', payload);
      toast.success(`Checkout berhasil! Transaksi ${response.data.transaction_code} tercatat.`);
      
      // Reset POS state
      setCart([]);
      setAmountPaid('');
      setCustomerId('');
      setPaymentMethod('cash');
      
      // Refresh produk dan pelanggan (stok & utang berubah)
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memproses checkout');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter produk berdasarkan input pencarian & kategori
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.includes(searchTerm));
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const total = calculateTotal();
  const change = paymentMethod === 'cash' ? Math.max(0, parseInt(amountPaid || 0) - total) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mr-3"></div>
        <p className="text-slate-400 font-semibold">Memuat modul kasir...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 overflow-hidden -mx-8 -my-6 relative">
      {/* Kiri: Katalog Produk */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden z-10">
        {/* Search & Custom Item Calculator Row */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-[#1a1816]/60 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] placeholder-white/25 transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),_0_1px_1px_rgba(255,255,255,0.05)] text-sm"
              placeholder="Cari nama produk atau scan barcode SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3.5 top-3.5 text-white/40" size={18} />
          </div>

          <button
            type="button"
            onClick={() => setShowCustomItemCalc(true)}
            className="px-4 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer shadow-[0_2px_8px_rgba(245,158,11,0.15)] active:scale-95"
            title="Kalkulator untuk menginput barang lain / non-stok"
          >
            <Calculator size={16} />
            <span>+ Barang Lain</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 shrink-0">
          {['Semua', 'Makanan', 'Minuman', 'Rokok', 'Sembako', 'Kue / Titipan', 'Lainnya'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition duration-150 border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#F4F3ED] border-white/20 text-[#1E1E1E] shadow-md shadow-black/25'
                  : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Catalog */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-white/30 font-medium">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock < product.min_stock;
                const isRetail = product.is_retail;
                
                // Formatting stock display for Rokok Eceran
                const displayStockText = isRetail ? (
                  `Stok: ${Math.floor(product.stock / (product.pack_size || 16))} bks (${product.stock} btg)`
                ) : (
                  `Stok: ${product.stock} pcs`
                );

                if (isRetail) {
                  return (
                    <div
                      key={product.id}
                      className={`bg-[#2A2A2A]/40 backdrop-blur-md text-left p-4 rounded-[2rem] border border-white/10 shadow-md shadow-black/10 flex flex-col justify-between h-[11.5rem] relative ${
                        isOutOfStock ? 'opacity-40 bg-slate-950/20' : ''
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-white line-clamp-2 text-sm">{product.name}</h4>
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/10 text-[9px] font-black uppercase">
                            Eceran
                          </span>
                        </div>
                        {product.sku && (
                          <span className="text-xs text-white/40 block mt-0.5">SKU: {product.sku}</span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-col w-full">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-base font-bold text-[#F4F3ED]">
                            {formatRupiah(product.price)}
                            <span className="text-[10px] text-white/40 font-normal">/bks</span>
                          </span>
                          {product.half_pack_price && (
                            <span className="text-xs text-white/40 font-semibold">
                              {formatRupiah(product.half_pack_price)}
                              <span className="text-[9px] font-normal">/half</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            isOutOfStock 
                              ? 'bg-red-500/20 text-red-400 border-red-500/20' 
                              : isLowStock 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' 
                                : 'bg-white/5 text-[#F4F3ED] border-white/10'
                          }`}>
                            {displayStockText}
                          </span>
                          
                          {isLowStock && (
                            <span className="text-[10px] text-red-400 font-bold animate-pulse">Menipis!</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons for cigarette retail */}
                      <div className="flex gap-1 w-full mt-3 pt-2.5 border-t border-white/5">
                        <button
                          onClick={() => addToCart(product, product.pack_size || 16)}
                          disabled={isOutOfStock}
                          className="flex-1 py-1.5 bg-[#F4F3ED]/10 border border-white/10 hover:bg-[#F4F3ED] hover:text-[#1E1E1E] transition text-[9px] font-black text-center rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Tambah 1 Bungkus"
                        >
                          +1 Bks
                        </button>
                        {product.half_pack_price && (
                          <button
                            onClick={() => addToCart(product, Math.floor((product.pack_size || 16) / 2))}
                            disabled={isOutOfStock || product.stock < Math.floor((product.pack_size || 16) / 2)}
                            className="flex-1 py-1.5 bg-[#F4F3ED]/10 border border-white/10 hover:bg-[#F4F3ED] hover:text-[#1E1E1E] transition text-[9px] font-black text-center rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Tambah Setengah Bungkus"
                          >
                            +1/2 Bks
                          </button>
                        )}
                        <button
                          onClick={() => addToCart(product, 1)}
                          disabled={isOutOfStock}
                          className="flex-1 py-1.5 bg-[#F4F3ED]/10 border border-white/10 hover:bg-[#F4F3ED] hover:text-[#1E1E1E] transition text-[9px] font-black text-center rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Tambah 1 Batang"
                        >
                          +1 Btg
                        </button>
                      </div>
                    </div>
                  );
                }

                // Regular Product Card
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product, 1)}
                    disabled={isOutOfStock}
                    className={`bg-[#2A2A2A]/40 backdrop-blur-md text-left p-4 rounded-[2rem] border transition duration-150 relative flex flex-col justify-between h-40 group ${
                      isOutOfStock 
                        ? 'opacity-40 border-white/5 cursor-not-allowed bg-slate-950/20' 
                        : 'border-white/10 hover:border-[#F4F3ED]/40 hover:bg-white/5 active:scale-95 shadow-md shadow-black/10 hover:shadow-[0_0_15px_rgba(244,243,237,0.1)] cursor-pointer'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-white line-clamp-2">{product.name}</h4>
                      {product.sku && (
                        <span className="text-xs text-white/40 block mt-0.5">SKU: {product.sku}</span>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-col w-full">
                      <span className="text-lg font-bold text-[#F4F3ED]">{formatRupiah(product.price)}</span>
                      
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isOutOfStock 
                            ? 'bg-red-500/20 text-red-400 border-red-500/20' 
                            : isLowStock 
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' 
                              : 'bg-white/5 text-[#F4F3ED] border-white/10'
                        }`}>
                          {displayStockText}
                        </span>
                        
                        {isLowStock && (
                          <span className="text-[10px] text-red-400 font-bold animate-pulse">Menipis!</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Kanan: Cart Sidebar */}
      <div className="w-96 bg-black/15 border-l border-white/5 flex flex-col h-full relative z-10">
        {/* Cart Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/10">
          <div className="flex items-center space-x-2">
            <ShoppingCart size={20} className="text-[#F4F3ED]" />
            <h3 className="font-bold text-white">Keranjang Belanja</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustomItemCalc(true)}
              className="text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition"
              title="Input barang lain menggunakan kalkulator"
            >
              <Calculator size={11} /> + Barang Lain
            </button>
            <span className="bg-[#F4F3ED] text-[#1E1E1E] text-xs px-2.5 py-0.5 rounded-full font-bold shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-white/20">
              {cart.reduce((s, i) => s + (i.is_retail ? 1 : i.quantity), 0)} Item
            </span>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
              <ShoppingCart size={48} className="mb-2 stroke-1 text-white/20" />
              <p className="text-sm">Belum ada barang di keranjang</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="bg-black/15 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center gap-2 shadow-sm hover:bg-black/25 transition duration-150">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-semibold text-sm text-white truncate">{item.name}</h5>
                    {item.is_custom && (
                      <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                        Manual
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/40">
                    {item.is_retail ? `${formatRupiah(item.price)}/bks` : `${formatRupiah(item.price)}/item`}
                  </span>
                  {item.is_retail && (
                    <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                      Ket: {formatCartQuantity(item)}
                    </span>
                  )}
                </div>
                
                {/* Quantity Controls & Subtotal */}
                <div className="flex flex-col items-end space-y-1.5 shrink-0">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="p-1 hover:bg-white/10 rounded text-white/60 bg-white/5 border border-white/10 cursor-pointer transition duration-150"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-semibold text-white w-10 text-center truncate">
                      {item.is_retail ? `${item.quantity} btg` : item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="p-1 hover:bg-white/10 rounded text-white/60 bg-white/5 border border-white/10 cursor-pointer transition duration-150"
                    >
                      <Plus size={12} />
                    </button>
                    
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg ml-2 cursor-pointer transition duration-150"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="text-[11px] font-black text-[#F4F3ED] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {formatRupiah(calculateCigarettePrice(item, item.quantity))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Forms Panel */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-black/20 space-y-4 shrink-0">
            {/* Opsi Metode Pembayaran (Hanya Tunai dan Kasbon) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'kasbon'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition duration-150 border cursor-pointer ${
                      paymentMethod === m 
                        ? 'bg-[#F4F3ED] border-white/20 text-[#1E1E1E] shadow-[0_2px_8px_rgba(0,0,0,0.25)]' 
                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {m === 'cash' ? 'Tunai' : 'Kasbon'}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Tunai (Cash) */}
            {paymentMethod === 'cash' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Uang Tunai Diterima</label>
                  <button
                    type="button"
                    onClick={() => setShowCashierCalc(true)}
                    className="text-[10px] text-white/50 hover:text-white flex items-center gap-1 font-bold cursor-pointer transition px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10"
                  >
                    <Calculator size={11} /> Kalkulator
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-[#1a1816]/60 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] placeholder-white/25 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] font-mono font-bold"
                  placeholder="Contoh: 100.000"
                  value={formatSeparator(amountPaid)}
                  onChange={(e) => {
                    const raw = parseRawInt(e.target.value);
                    setAmountPaid(raw === 0 ? '' : raw.toString());
                  }}
                />
              </div>
            )}

            {/* Input Kasbon (Select Customer) */}
            {paymentMethod === 'kasbon' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Nama Pelanggan</label>
                  <button
                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                    className="text-xs text-white hover:text-white/80 flex items-center space-x-1 cursor-pointer font-bold"
                  >
                    <UserPlus size={12} />
                    <span>{showAddCustomer ? 'Pilih Lama' : 'Pelanggan Baru'}</span>
                  </button>
                </div>

                {showAddCustomer ? (
                  <form onSubmit={handleAddCustomer} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-[#1a1816]/60 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 text-[#F4F3ED] text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                      placeholder="Input nama..."
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] text-xs font-bold rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.2)] cursor-pointer"
                    >
                      Tambah
                    </button>
                  </form>
                ) : (
                  <select
                    className="w-full px-4 py-2.5 bg-[#1a1816]/80 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/20 text-white text-sm [&>option]:bg-slate-900 [&>option]:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">-- Pilih Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Utang: {formatRupiah(c.total_debt)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Hitungan Akhir */}
            <div className="pt-2 border-t border-white/5 text-sm space-y-1 bg-black/10 -mx-6 px-6 py-4">
              <div className="flex justify-between font-semibold text-white/40">
                <span>Total Tagihan:</span>
                <span className="text-white font-bold">{formatRupiah(total)}</span>
              </div>
              
              {paymentMethod === 'cash' && (
                <div className="flex justify-between font-bold text-white border-t border-dashed border-white/5 pt-2 text-base">
                  <span>Uang Kembali:</span>
                  <span className="text-green-400 font-extrabold drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]">{formatRupiah(change)}</span>
                </div>
              )}
            </div>

            {/* Tombol Checkout */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting || (paymentMethod === 'cash' && parseInt(amountPaid || 0) < total)}
              className="w-full py-3.5 bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold rounded-full transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-center shadow-[0_4px_15px_rgba(0,0,0,0.3),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer active:scale-[0.98] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
            >
              {submitting ? 'Memproses Checkout...' : 'Selesaikan Pembayaran'}
            </button>
          </div>
        )}
      </div>

      {/* Modal QuickCalculator Kasir (Hitung Uang Bayar) */}
      <QuickCalculator
        isOpen={showCashierCalc}
        onClose={() => setShowCashierCalc(false)}
        onApply={(val) => {
          setAmountPaid(val.toString());
          toast.success(`Rp ${val.toLocaleString('id-ID')} diterapkan ke uang bayar!`);
        }}
        applyLabel="Terapkan ke Uang Bayar"
        title="Kalkulator Uang Bayar Kasir"
      />

      {/* Modal Kalkulator Input Barang Lain */}
      <CustomItemCalculatorModal
        isOpen={showCustomItemCalc}
        onClose={() => setShowCustomItemCalc(false)}
        onAddToCart={handleAddCustomItem}
      />
    </div>
  );
}
