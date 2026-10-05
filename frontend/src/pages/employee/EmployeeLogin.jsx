import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../../api';
import toast from 'react-hot-toast';
import { Shield, Lock, User, KeyRound, Sparkles, ChefHat } from 'lucide-react';

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await employeeApi.post('/auth/login', { username, password });
      if (res.data.success) {
        const { token, user } = res.data.data;
        localStorage.setItem('employee_token', token);
        localStorage.setItem('employee_user', JSON.stringify(user));
        toast.success(`Selamat datang, ${user.full_name} (${user.role.toUpperCase()})`);

        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/cashier/orders');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa username & password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('password123');
    } else {
      setUsername('kasir');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Portal Karyawan</h1>
          <p className="text-xs text-stone-400">Restoran POS & Backoffice (Admin / Kasir)</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="p-3 bg-stone-950/80 rounded-2xl border border-stone-800/80 space-y-2">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider text-center">
            Pintasan Login Demo
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex-1 py-2 px-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('cashier')}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kasir Demo</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / kasir"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-stone-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition shadow-lg ${
              loading
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-amber-500/20 active:scale-95'
            }`}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Portal'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/table-selection')}
            className="text-xs text-stone-500 hover:text-amber-400 transition"
          >
            ← Beralih ke Tampilan Pelanggan (Meja)
          </button>
        </div>
      </div>
    </div>
  );
}
