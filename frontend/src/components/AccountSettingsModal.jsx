import React, { useState, useEffect } from 'react';
import { 
  Store, User, Mail, Lock, KeyRound, Eye, EyeOff, 
  ShieldCheck, X, Save, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';

export default function AccountSettingsModal({ isOpen, onClose, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // State Profil Form
  const [storeName, setStoreName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // State Ganti Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setStoreName(storedUser.store_name || '');
      setUsername(storedUser.username || '');
      setEmail(storedUser.email || '');
      
      // Fetch latest profile from server
      fetchProfile();
      
      // Reset password form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await api.get('/api/auth/profile');
      if (res.data) {
        setStoreName(res.data.store_name || '');
        setUsername(res.data.username || '');
        setEmail(res.data.email || '');
      }
    } catch (err) {
      console.error('Gagal mengambil data profil:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Nama pengguna (username) tidak boleh kosong.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Format alamat email tidak valid.');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.put('/api/auth/profile', {
        store_name: storeName.trim(),
        username: username.trim(),
        email: email.trim()
      });

      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }

      toast.success('Pengaturan profil toko berhasil diperbarui!', {
        icon: '✨',
        style: {
          background: '#1c1a18',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)'
        }
      });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui profil akun');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Masukkan kata sandi saat ini.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    try {
      setSavingPassword(true);
      await api.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      toast.success('Kata sandi berhasil diganti!', {
        icon: '🔒',
        style: {
          background: '#1c1a18',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)'
        }
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah kata sandi');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#181615]/95 border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9),_inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#F4F3ED]/5 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F4F3ED]/10 border border-white/15 flex items-center justify-center text-[#F4F3ED] shadow-[0_0_20px_rgba(244,243,237,0.1)]">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Pengaturan Akun & Toko</h3>
              <p className="text-xs text-white/40">Kelola identitas toko, nama pengguna, dan kata sandi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store size={15} />
            <span>Profil Toko</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'password'
                ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound size={15} />
            <span>Ubah Kata Sandi</span>
          </button>
        </div>

        {/* Tab Content 1: Profil Toko */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Store size={13} className="text-[#F4F3ED]" /> Nama Toko
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Toko Berkah Mandiri"
                className="w-full px-4 py-3 bg-[#1a1816]/80 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-white text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder-white/20"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={savingProfile || loadingProfile}
              />
              <span className="text-[10px] text-white/30 mt-1 block">
                Nama toko akan tampil pada struk belanja, header kasir, dan laporan penjualan.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-[#F4F3ED]" /> Nama Pengguna (Username)
              </label>
              <input
                type="text"
                required
                placeholder="Username akun"
                className="w-full px-4 py-3 bg-[#1a1816]/80 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-white text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder-white/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={savingProfile || loadingProfile}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Mail size={13} className="text-[#F4F3ED]" /> Alamat Email
              </label>
              <input
                type="email"
                required
                placeholder="email@toko.com"
                className="w-full px-4 py-3 bg-[#1a1816]/80 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-white text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder-white/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={savingProfile || loadingProfile}
              />
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition border border-white/5 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingProfile || loadingProfile}
                className="px-6 py-2.5 rounded-2xl bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold text-xs transition shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer active:scale-95 flex items-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab Content 2: Ubah Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-amber-400" /> Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan sandi lama"
                  className="w-full pl-4 pr-11 py-3 bg-[#1a1816]/80 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-white text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder-white/20"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={savingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <KeyRound size={13} className="text-emerald-400" /> Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-4 pr-11 py-3 bg-[#1a1816]/80 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-white text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder-white/20"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={savingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" /> Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi sandi baru"
                  className="w-full pl-4 pr-11 py-3 bg-[#1a1816]/80 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-white text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder-white/20"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={savingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition border border-white/5 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-6 py-2.5 rounded-2xl bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-extrabold text-xs transition shadow-[0_4px_12px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer active:scale-95 flex items-center gap-2"
              >
                {savingPassword ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Mengubah...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    <span>Ganti Kata Sandi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
