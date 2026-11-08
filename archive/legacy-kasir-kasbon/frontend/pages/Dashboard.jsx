import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown, 
  MoreHorizontal, 
  ChevronDown,
  ArrowRight,
  Zap
} from 'lucide-react';
import api from '../api';

export const formatRupiah = (val) => {
  const number = typeof val === 'number' ? val : parseInt(val || 0);
  return 'Rp ' + number.toLocaleString('id-ID');
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    total_income: 0,
    total_receivables: 0,
    recent_movements: [],
  });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter tab active state
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [timeFilter, setTimeFilter] = useState('This year');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, prodRes, custRes, transRes] = await Promise.all([
        api.get('/api/reports/summary'),
        api.get('/api/products'),
        api.get('/api/customers'),
        api.get('/api/transactions'),
      ]);
      setDashboardData(summaryRes.data);
      setProducts(prodRes.data);
      setCustomers(custRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      setError('Gagal memuat data laporan.');
      toast.error('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hitung persentase kapasitas stok terpakai
  const totalStockItems = products.reduce((acc, curr) => acc + curr.stock, 0);
  const lowStockCount = products.filter(p => p.stock < p.min_stock).length;
  
  // Format total nominal kasbon menjadi format Rupiah lengkap
  const formatIDR = (val) => {
    if (isLoading) return 'Loading data...';
    if (error) return 'Rp 0';
    const number = typeof val === 'number' ? val : parseInt(val || 0);
    return 'Rp ' + number.toLocaleString('id-ID');
  };

  // Format total nominal kasbon menjadi format K (contoh: 125k)
  const formatCompactIDR = (val) => {
    if (isLoading) return 'Loading data...';
    if (error) return 'Rp 0';
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}k`;
    return `Rp ${val}`;
  };

  // Dummy monthly revenue matching the mockup style
  const monthlyRevenue = [
    { label: 'Jan', val: 35 },
    { label: 'Feb', val: 45 },
    { label: 'Mar', val: 30 },
    { label: 'Apr', val: 55 },
    { label: 'May', val: 40 },
    { label: 'Jun', val: 65 },
    { label: 'Jul', val: 50 },
    { label: 'Aug', val: 55 },
    { label: 'Sep', val: 42 },
    { label: 'Oct', val: 80, highlighted: true }, // Current month
    { label: 'Nov', val: 0 },
    { label: 'Dec', val: 0 }
  ];

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto pb-12 relative z-10">
      {/* Title & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Home Page</h1>
          
          <div className="flex items-center space-x-2 mt-4 bg-[#1a1816]/60 p-1.5 rounded-full border border-white/5 w-fit shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
            {['Dashboard', 'Analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_2px_8px_rgba(0,0,0,0.25)]' 
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Top Right Mini Metrics */}
        <div className="flex flex-wrap items-center gap-6 bg-[#2A2A2A]/40 backdrop-blur-3xl px-6 py-4 rounded-[2rem] border border-white/15 shadow-xl">
          {/* Metric 1 */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/5 rounded-full text-[#F4F3ED] border border-white/10">
              <TrendingUp size={16} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-bold text-white">
                  {formatCompactIDR(dashboardData.total_income)}
                </span>
                <span className="text-[10px] text-green-400 font-bold flex items-center">
                  +2.3% <ArrowUpRight size={10} className="ml-0.5" />
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Pemasukan Bersih</span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

          {/* Metric 2 */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/5 rounded-full text-[#F4F3ED] border border-white/10">
              <Zap size={16} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-bold text-white">
                  {isLoading ? 'Loading data...' : error ? '0' : transactions.length}
                </span>
                <span className="text-[10px] text-red-400 font-bold flex items-center">
                  -1.2% <ArrowDownRight size={10} className="ml-0.5" />
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Total Transaksi</span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

          {/* Metric 3 */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/5 rounded-full text-[#F4F3ED] border border-white/10">
              <FileText size={16} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-bold text-white">
                  {formatCompactIDR(dashboardData.total_receivables)}
                </span>
                <span className="text-[10px] text-green-400 font-bold flex items-center">
                  +10% <ArrowUpRight size={10} className="ml-0.5" />
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Piutang Kasbon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Column 1, 2, 3 */}
      {activeTab === 'Dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Left Pane (Gauge & Quick Actions) */}
          <div className="lg:col-span-3 space-y-6 flex flex-col">
            {/* User growth card */}
            <div className="bg-[#2A2A2A]/40 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/15 shadow-xl flex flex-col justify-between flex-1 min-h-[250px]">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">User growth</h4>
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'userGrowth' ? null : 'userGrowth')}
                    className="flex items-center text-xs text-white/40 font-semibold hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1 rounded-full cursor-pointer"
                  >
                    <span>{timeFilter}</span>
                    <ChevronDown size={12} className="ml-1" />
                  </button>
                  {activeDropdown === 'userGrowth' && (
                    <div className="absolute right-0 mt-2 w-32 bg-[#2A2A2A]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-lg py-1 z-50 text-[10px] text-white/80">
                      {['This year', 'This month', 'This week'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setTimeFilter(option);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition font-medium cursor-pointer block"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom SVG Gauge Chart */}
              <div className="relative py-4 flex items-center justify-center">
                <svg viewBox="0 0 100 55" className="w-40 h-auto">
                  {/* Background dotted gray arc */}
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke="rgba(255, 255, 255, 0.05)" 
                    strokeWidth="8" 
                    strokeLinecap="round"
                  />
                  {/* Dotted border indicators */}
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke="rgba(255, 255, 255, 0.08)" 
                    strokeWidth="8" 
                    strokeDasharray="2 3"
                    strokeLinecap="round"
                  />
                  {/* Active cream colored arc */}
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke="#F4F3ED" 
                    strokeWidth="8" 
                    strokeDasharray="125" 
                    strokeDashoffset="35"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_6px_rgba(244,243,237,0.5)]"
                  />
                </svg>
                {/* Text inside the gauge */}
                <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{isLoading ? '...' : error ? '0' : customers.length}</span>
                  <span className="text-[10px] text-green-400 font-extrabold flex items-center">
                    +10% <ArrowUpRight size={10} />
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-4 border-t border-white/10">
                <span className="text-white/40 font-semibold">Total pelanggan</span>
                <span className="font-extrabold text-white">{isLoading ? 'Loading data...' : error ? '0' : customers.length}</span>
              </div>
            </div>

            {/* Quick Action (3D Popped Out Card) */}
            <div className="bg-[#F4F3ED] text-gray-800 p-6 rounded-[2rem] border border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.3),_inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col justify-between h-[210px] relative overflow-hidden">
              {/* Background design elements */}
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-black/5 rounded-full pointer-events-none"></div>
              
              <div className="space-y-3 relative z-10">
                <h4 className="text-lg font-black text-gray-900 leading-tight">Mulai Transaksi</h4>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Catat penjualan ritel secara cepat, debit, tunai, atau kelola sistem pembayaran kasbon pelanggan.
                </p>
              </div>

              <button
                onClick={() => navigate('/cashier')}
                className="bg-[#1E1E1E] text-white hover:bg-black font-bold px-5 py-2.5 rounded-full text-xs flex items-center justify-between w-fit transition duration-200 mt-4 relative z-10 cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-white/5 active:scale-[0.98]"
              >
                <span>Kasir POS</span>
                <ArrowRight size={14} className="ml-2" />
              </button>
            </div>
          </div>

          {/* Column 2: Center Pane (Revenue Chart, Orders list, Activity) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Received Revenue Card */}
            <div className="bg-[#2A2A2A]/40 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/15 shadow-xl flex flex-col justify-between h-[300px]">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-sm">Received revenue</h4>
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'revenue' ? null : 'revenue')}
                    className="flex items-center text-xs text-white/40 font-semibold hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1 rounded-full cursor-pointer"
                  >
                    <span>{timeFilter}</span>
                    <ChevronDown size={12} className="ml-1" />
                  </button>
                  {activeDropdown === 'revenue' && (
                    <div className="absolute right-0 mt-2 w-32 bg-[#2A2A2A]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-lg py-1 z-50 text-[10px] text-white/80">
                      {['This year', 'This month', 'This week'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setTimeFilter(option);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition font-medium cursor-pointer block"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Bar Chart */}
              <div className="relative flex-1 flex items-end justify-between h-40 pt-6">
                {/* Target Line */}
                <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-white/10 flex justify-between pointer-events-none">
                  <span className="text-[9px] text-white/40 bg-[#1e1c1a]/80 px-2 -mt-2">Target Capaian</span>
                  {/* Highlight Label */}
                  <div className="bg-[#F4F3ED] border border-white/20 text-gray-900 px-2 py-0.5 rounded text-[10px] font-mono shadow-[0_4px_10px_rgba(0,0,0,0.15)] -mt-3.5 absolute right-4">
                    {formatIDR(dashboardData.total_income)}
                  </div>
                </div>

                {/* 
                  TODO: Jika API /api/reports/summary diperluas untuk menyertakan data pendapatan bulanan historis,
                  data tersebut dapat dipetakan langsung di sini (misal: dashboardData.monthly_revenue).
                */}
                {monthlyRevenue.map((m, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Hover Tooltip */}
                    {m.highlighted && (
                      <div className="absolute bottom-full mb-2 bg-[#1E1E1E] border border-white/10 text-white text-[10px] py-1 px-2 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap shadow-md z-10">
                        Oktober: {formatIDR(dashboardData.total_income)}
                      </div>
                    )}

                    {/* Vertical bar */}
                    <div 
                      className={`w-3.5 rounded-t-full transition duration-300 cursor-pointer ${
                        m.highlighted 
                          ? 'bg-[#F4F3ED] shadow-[0_0_12px_rgba(244,243,237,0.5)]' 
                          : 'bg-white/10 hover:bg-white/20'
                      }`} 
                      style={{ height: `${m.val || 5}px`, maxHeight: '110px' }}
                    ></div>
                    <span className="text-[10px] text-white/40 mt-2 font-bold">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub Row: Split Cards (Orders & Activity) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Orders Card */}
              <div className="bg-[#2A2A2A]/40 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/15 shadow-xl flex flex-col justify-between h-[160px]">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">Transaksi Terakhir</h4>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                      <span className="text-[10px] text-white/40 font-bold">Checkout Baru</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/history')}
                    className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-white/40 hover:text-white transition cursor-pointer"
                    title="Lihat Riwayat Transaksi"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                {/* Mini list */}
                <div className="space-y-2 mt-3">
                  {isLoading ? (
                    <span className="text-xs text-white/30 italic">Loading data...</span>
                  ) : error ? (
                    <span className="text-xs text-white/30 italic">Gagal memuat data</span>
                  ) : (
                    <>
                      {dashboardData.recent_movements.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                          <span className="text-white/80 truncate font-semibold max-w-[140px]" title={m.description}>
                            {m.description}
                          </span>
                          <span className="font-extrabold text-white">{formatIDR(m.amount)}</span>
                        </div>
                      ))}
                      {dashboardData.recent_movements.length === 0 && (
                        <span className="text-xs text-white/30 italic">Belum ada transaksi</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Activity Card */}
              <div className="bg-[#2A2A2A]/40 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/15 shadow-xl flex flex-col justify-between h-[160px]">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">Inventaris</h4>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${lowStockCount > 0 ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'}`}></span>
                      <span className="text-[10px] text-white/40 font-bold">
                        {lowStockCount > 0 ? `${lowStockCount} barang kritis` : 'Stok Aman'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/inventory')}
                    className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-white/40 hover:text-white transition cursor-pointer"
                    title="Lihat Inventaris"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                {/* Sparkline & metric */}
                <div className="flex items-end justify-between mt-2 gap-4">
                  <div>
                    <span className="text-xl font-black text-white">{totalStockItems}</span>
                    <span className="text-[10px] text-green-400 font-extrabold flex items-center mt-0.5">
                      +3.4% <ArrowUpRight size={10} className="ml-0.5" />
                    </span>
                  </div>
                  
                  {/* SVG Sparkline */}
                  <div className="w-24 h-8 flex-shrink-0">
                    <svg viewBox="0 0 100 30" className="w-full h-full">
                      <path 
                        d="M 0 25 Q 15 10, 30 18 T 60 5 T 90 20 T 100 12" 
                        fill="none" 
                        stroke="#F4F3ED" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_6px_rgba(244,243,237,0.4)]"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Right Pane (Active Users/Product sales & Map preview) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Active Users (Top Products) */}
            <div className="bg-[#2A2A2A]/40 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/15 shadow-xl flex flex-col justify-between min-h-[476px]">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-sm">Produk Terpopuler</h4>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === 'products' ? null : 'products')}
                      className="flex items-center text-xs text-white/40 font-semibold hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1 rounded-full cursor-pointer"
                    >
                      <span>{timeFilter}</span>
                      <ChevronDown size={12} className="ml-1" />
                    </button>
                    {activeDropdown === 'products' && (
                      <div className="absolute right-0 mt-2 w-32 bg-[#2A2A2A]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-lg py-1 z-50 text-[10px] text-white/80">
                        {['This year', 'This month', 'This week'].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setTimeFilter(option);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition font-medium cursor-pointer block"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Listing like countries list */}
                <div className="space-y-4 pt-2">
                  {/* 
                    NOTE: Jika di masa mendatang backend menyuplai data produk terpopuler,
                    kita bisa memetakan data tersebut langsung di sini (misal: dashboardData.popular_products).
                    Saat ini, kita menampilkan produk berdasarkan daftar barang yang tersedia (/api/products).
                  */}
                  {products.slice(0, 5).map((p, idx) => {
                    const percent = p.stock > 0 ? Math.min(100, Math.max(10, Math.floor((p.stock / 150) * 100))) : 0;
                    return (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {/* Number bullet */}
                          <span className="w-5 h-5 rounded-full bg-white/5 text-white/40 border border-white/5 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-white/80 truncate block max-w-[100px]" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="font-extrabold text-white">{p.stock}</span>
                          <span className="text-[10px] text-white/40 font-semibold">({percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                  {products.length === 0 && (
                    <span className="text-xs text-white/30 italic">Belum ada data barang</span>
                  )}
                </div>
              </div>

              {/* Map Placeholder Vector representation (3D Inset Container) */}
              <div className="relative mt-6 flex-1 bg-[#1a1816]/60 border border-white/5 rounded-2xl overflow-hidden min-h-[140px] flex items-center justify-center p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                {/* Minimal Map SVG Pattern */}
                <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full opacity-10">
                  <path d="M10,20 Q40,10 60,30 T120,20 T180,40 M30,50 Q70,40 100,60 T160,50 T190,70" fill="none" stroke="#F4F3ED" strokeWidth="1" />
                  <path d="M50,10 V90 M100,0 V100 M150,10 V90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                </svg>
                
                {/* Mini Card Overlay on Map */}
                <div className="bg-[#2A2A2A]/90 backdrop-blur-md p-3 rounded-2xl shadow border border-white/10 absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Mini thumbnail */}
                    <div className="w-7 h-7 bg-white/5 text-[#F4F3ED] border border-white/5 rounded flex items-center justify-center font-bold text-[10px]">
                      K
                    </div>
                    <div>
                      <h5 className="font-extrabold text-[10px] text-white">Seeder Aktif</h5>
                      <span className="text-[8px] text-white/40 font-bold block uppercase">Local Server</span>
                    </div>
                  </div>
                  <button
                    onClick={fetchData}
                    className="w-6 h-6 rounded-full bg-[#F4F3ED] text-gray-950 flex items-center justify-center cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.25)] border border-white/20 active:scale-95"
                    title="Segarkan data"
                  >
                    <ArrowUpRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div className="text-white/60 p-8 text-center bg-[#2A2A2A]/40 backdrop-blur-3xl border border-white/15 rounded-[2rem] shadow-xl">
          <div>Analytics Content Here</div>
        </div>
      )}
    </div>
  );
}
