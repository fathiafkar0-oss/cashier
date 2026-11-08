import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, Home, ShoppingCart, Package, BookOpen, LogOut, 
  History, Wallet, AlertTriangle, CheckCircle2, RefreshCw, ChevronRight, X,
  Calculator, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import bgImage from '../assets/bg-app.jpg';
import QuickCalculator from './QuickCalculator';
import LogoutModal from './LogoutModal';
import AccountSettingsModal from './AccountSettingsModal';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  // State Notifikasi & Kalkulator & Logout Modal & Pengaturan Akun
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [unpaidCustomers, setUnpaidCustomers] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/cashier', label: 'Kasir POS', icon: ShoppingCart },
    { path: '/inventory', label: 'Inventaris', icon: Package },
    { path: '/kasbon', label: 'Buku Kasbon', icon: BookOpen },
    { path: '/history', label: 'Riwayat', icon: History },
    { path: '/expenses', label: 'Pengeluaran', icon: Wallet },
  ];

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const [resProducts, resCustomers] = await Promise.all([
        api.get('/api/products').catch(() => ({ data: [] })),
        api.get('/api/customers').catch(() => ({ data: [] }))
      ]);
      const lowStock = (resProducts.data || []).filter(p => p.stock <= p.min_stock);
      const withDebt = (resCustomers.data || []).filter(c => c.total_debt > 0);
      setLowStockProducts(lowStock);
      setUnpaidCustomers(withDebt);
    } catch (err) {
      console.error('Gagal mengambil data notifikasi:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [location.pathname]);

  const totalAlerts = lowStockProducts.length + unpaidCustomers.length;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <div className="min-h-screen bg-black/40 bg-blend-overlay text-white flex flex-col md:flex-row items-stretch font-sans relative overflow-hidden p-6 md:p-8 gap-6 md:gap-8 h-screen" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* Background Warm Highlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#4a3b32]/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#36322e]/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Floating Left Navigation Dock */}
      <aside className="w-full md:w-20 bg-[#2a2a2a]/40 backdrop-blur-3xl border border-white/10 rounded-[32px] py-4 md:py-8 flex flex-row md:flex-col items-center justify-between shadow-[0_10px_35px_rgba(0,0,0,0.5),_inset_0_1px_2px_rgba(255,255,255,0.05)] shrink-0 h-auto md:h-[620px] self-center z-50 px-6 md:px-0">
        {/* Logo */}
        <div className="flex items-center justify-center md:mb-6">
          <div className="w-10 h-10 rounded-full bg-[#F4F3ED] flex items-center justify-center text-[#1E1E1E] font-black text-sm tracking-tighter shadow-[0_4px_12px_rgba(244,243,237,0.3)]" title="CASHIER">
            CS
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex flex-row md:flex-col items-center gap-4 md:space-y-6 flex-1 justify-center md:my-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 relative group cursor-pointer ${
                  isActive
                    ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_4px_12px_rgba(244,243,237,0.3)] scale-105'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <Icon size={18} />
                {/* Tooltip on Hover */}
                <span className="absolute left-16 bg-slate-900/90 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 md:group-hover:opacity-100 pointer-events-none transition duration-200 whitespace-nowrap shadow-md z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="md:mt-auto">
          <button
            onClick={handleLogout}
            className="w-11 h-11 rounded-full flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Kaca Card Container */}
      <main className="flex-1 bg-[#2a2a2a]/30 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-y-auto max-h-full z-10 flex flex-col">
        {/* Top Header of Main Card */}
        <header className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b border-white/5 shrink-0 relative">
          <div>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Sistem Kasir & Kasbon</span>
            <h2 className="text-lg font-extrabold text-white tracking-tight leading-none mt-1">CASHIER</h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Calculator Button */}
            <button
              onClick={() => setShowCalc(!showCalc)}
              className={`p-2.5 rounded-full transition-all duration-300 relative cursor-pointer ${
                showCalc 
                  ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_0_15px_rgba(244,243,237,0.4)] scale-105' 
                  : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
              title="Buka Kalkulator Toko"
            >
              <Calculator size={18} />
            </button>

            {/* Notification Dropdown Container */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
                className={`p-2.5 rounded-full transition-all duration-300 relative cursor-pointer ${
                  showNotifications 
                    ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_0_15px_rgba(244,243,237,0.4)] scale-105' 
                    : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
                title="Pemberitahuan Sistem"
              >
                <Bell size={18} />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.8)] border-2 border-[#1E1E1E] animate-pulse">
                    {totalAlerts}
                  </span>
                )}
              </button>

              {/* Floating 3D Glassmorphism Notification Center Modal */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#1c1a18]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.15)] z-50">
                  {/* Header Pop Up */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-white/10 text-[#F4F3ED]">
                        <Bell size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white leading-tight">Pemberitahuan</h4>
                        <p className="text-[10px] text-white/40 font-medium">Status & Peringatan Sistem</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={fetchNotifications}
                        disabled={loadingNotifs}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Segarkan Notifikasi"
                      >
                        <RefreshCw size={14} className={loadingNotifs ? 'animate-spin text-white' : ''} />
                      </button>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Body Notifications List */}
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {totalAlerts === 0 && !loadingNotifs ? (
                      <div className="py-8 px-4 text-center bg-white/5 border border-white/5 rounded-2xl">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                          <CheckCircle2 size={20} />
                        </div>
                        <h5 className="text-xs font-bold text-white mb-1">Semua Sistem Normal</h5>
                        <p className="text-[11px] text-white/40 leading-relaxed">
                          Tidak ada produk dengan stok kritis atau piutang mendesak saat ini.
                        </p>
                      </div>
                    ) : null}

                    {/* Section: Stok Menipis */}
                    {lowStockProducts.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                            <AlertTriangle size={13} className="animate-pulse" />
                            <span>Stok Menipis ({lowStockProducts.length})</span>
                          </div>
                          <button 
                            onClick={() => {
                              setShowNotifications(false);
                              navigate('/inventory');
                            }}
                            className="text-[10px] text-white/50 hover:text-white flex items-center gap-0.5 cursor-pointer transition font-medium"
                          >
                            Kelola <ChevronRight size={12} />
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {lowStockProducts.slice(0, 4).map(prod => (
                            <div 
                              key={prod.id}
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/inventory');
                              }}
                              className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition flex items-center justify-between cursor-pointer group"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                                <p className="text-[10px] text-white/40">Kategori: {prod.category || 'Lainnya'}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black border border-red-500/30">
                                  Sisa: {prod.stock} (Min {prod.min_stock})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section: Piutang Kasbon */}
                    {unpaidCustomers.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                            <BookOpen size={13} />
                            <span>Kasbon Berjalan ({unpaidCustomers.length})</span>
                          </div>
                          <button 
                            onClick={() => {
                              setShowNotifications(false);
                              navigate('/kasbon');
                            }}
                            className="text-[10px] text-white/50 hover:text-white flex items-center gap-0.5 cursor-pointer transition font-medium"
                          >
                            Buku Kasbon <ChevronRight size={12} />
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {unpaidCustomers.slice(0, 3).map(cust => (
                            <div 
                              key={cust.id}
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/kasbon');
                              }}
                              className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition flex items-center justify-between cursor-pointer group"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold text-white truncate">{cust.name}</p>
                                <p className="text-[10px] text-white/40">Piutang Belum Lunas</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-amber-400">
                                  Rp {cust.total_debt.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Pop Up */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Sistem Terhubung
                    </span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold transition text-[10px] cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowAccountSettings(true)}
              className={`p-2.5 rounded-full transition-all duration-300 relative cursor-pointer ${
                showAccountSettings
                  ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_0_15px_rgba(244,243,237,0.4)] scale-105'
                  : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
              title="Pengaturan Akun & Toko"
            >
              <Settings size={18} />
            </button>

            {/* Profile Card */}
            <div 
              onClick={() => setShowAccountSettings(true)}
              className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-3 pr-1 py-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] cursor-pointer transition group"
              title="Klik untuk Pengaturan Akun & Toko"
            >
              <div className="text-left shrink-0 pr-1 hidden sm:block">
                <span className="text-xs font-bold text-white block leading-tight">{currentUser.username || 'Kasir'}</span>
                <span className="text-[9px] font-bold text-white/40 group-hover:text-amber-300 transition block uppercase tracking-wide leading-none">
                  {currentUser.store_name || 'Toko Ritel'}
                </span>
              </div>
              <div 
                className="w-8 h-8 rounded-full bg-[#F4F3ED] flex items-center justify-center font-bold text-[#1E1E1E] text-xs overflow-hidden shadow-sm"
              >
                {currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'KS'}
              </div>
            </div>
          </div>
        </header>

        {/* Outlet View */}
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </main>

      {/* Global Quick Calculator */}
      <QuickCalculator 
        isOpen={showCalc} 
        onClose={() => setShowCalc(false)} 
        title="Kalkulator Kasir & Toko" 
      />

      {/* Account & Store Settings Modal */}
      <AccountSettingsModal
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Secure Multi-Step Logout Modal */}
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
      />
    </div>
  );
}

