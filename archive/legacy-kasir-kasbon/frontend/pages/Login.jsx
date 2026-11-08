import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, LogIn, UserPlus, Store, User, ShieldCheck } from 'lucide-react';
import api from '../api';
import bgImage from '../assets/bg-app.jpg';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  
  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Jika token sudah ada, arahkan langsung ke dashboard
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Email/Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { 
        identifier: identifier.trim(), 
        password 
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(`Selamat datang kembali, ${user.username || 'Admin'}!`);
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Koneksi gagal. Silakan periksa kembali email/password.';
      toast.error(errMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      toast.error('Semua kolom pendaftaran wajib diisi');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    if (regPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', {
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword
      });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(`Akun "${user.username}" berhasil dibuat!`);
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Pendaftaran gagal. Silakan coba lagi.';
      toast.error(errMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/40 bg-blend-overlay text-white px-4 relative overflow-hidden py-10" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* Background Warm Highlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4a3b32]/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#36322e]/20 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#2A2A2A]/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Header Icon & Title */}
        <div className="text-center mb-6 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F4F3ED] flex items-center justify-center text-[#1E1E1E] shadow-[0_4px_16px_rgba(244,243,237,0.3)]">
            <Store size={26} className="text-[#1E1E1E]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">CASHIER</h2>
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-1">Sistem Kasir & Pembukuan Ritel</p>
          </div>
        </div>

        {/* Tab Toggle Switcher */}
        <div className="flex bg-[#141312]/80 p-1.5 rounded-full border border-white/10 mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              !isRegister
                ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <LogIn size={14} />
            <span>Masuk Akun</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              isRegister
                ? 'bg-[#F4F3ED] text-[#1E1E1E] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <UserPlus size={14} />
            <span>Daftar Baru</span>
          </button>
        </div>

        {!isRegister ? (
          /* FORM LOGIN */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                Email atau Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#1a1816]/70 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-[#F4F3ED] placeholder-white/25 transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-sm"
                  placeholder="Masukkan email atau username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <Mail className="absolute left-4 top-4 text-white/30" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#1a1816]/70 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-[#F4F3ED] placeholder-white/25 transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-sm"
                  placeholder="Masukkan password akun"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Lock className="absolute left-4 top-4 text-white/30" size={16} />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-black py-4 rounded-full transition duration-200 disabled:opacity-50 shadow-[0_4px_15px_rgba(0,0,0,0.35),_inset_0_1px_2px_rgba(255,255,255,0.8)] active:scale-[0.98] cursor-pointer mt-4 flex items-center justify-center gap-2 text-sm"
              disabled={loading}
            >
              <LogIn size={16} />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}</span>
            </button>
          </form>
        ) : (
          /* FORM REGISTER */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">
                Nama Pengguna / Toko
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-[#1a1816]/70 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-[#F4F3ED] placeholder-white/25 transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-sm"
                  placeholder="Contoh: toko_sukses"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <User className="absolute left-4 top-3.5 text-white/30" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3 bg-[#1a1816]/70 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-[#F4F3ED] placeholder-white/25 transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-sm"
                  placeholder="Contoh: owner@toko.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={loading}
                />
                <Mail className="absolute left-4 top-3.5 text-white/30" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3 bg-[#1a1816]/70 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-[#F4F3ED] placeholder-white/25 transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-sm"
                  placeholder="Minimal 6 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={loading}
                />
                <Lock className="absolute left-4 top-3.5 text-white/30" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3 bg-[#1a1816]/70 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-white/30 text-[#F4F3ED] placeholder-white/25 transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-sm"
                  placeholder="Ulangi password di atas"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <ShieldCheck className="absolute left-4 top-3.5 text-white/30" size={16} />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#F4F3ED] hover:bg-[#EBEAE4] text-[#1E1E1E] font-black py-4 rounded-full transition duration-200 disabled:opacity-50 shadow-[0_4px_15px_rgba(0,0,0,0.35),_inset_0_1px_2px_rgba(255,255,255,0.8)] active:scale-[0.98] cursor-pointer mt-3 flex items-center justify-center gap-2 text-sm"
              disabled={loading}
            >
              <UserPlus size={16} />
              <span>{loading ? 'Mendaftarkan...' : 'Buat Akun & Masuk'}</span>
            </button>
          </form>
        )}

        {/* Security badge footer */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center flex items-center justify-center gap-2 text-white/30 text-[11px]">
          <ShieldCheck size={14} className="text-emerald-400/60" />
          <span>Sistem Kasir Terproteksi & Terenkripsi Aman</span>
        </div>
      </div>
    </div>
  );
}
