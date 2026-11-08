import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../../api';
import toast from 'react-hot-toast';
import { Lock, User, KeyRound, ChefHat } from 'lucide-react';
import FoamEdge from '../../components/brand/FoamEdge';

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

  const inputClass =
    'w-full rounded-xl border border-line bg-panel py-3 pl-11 pr-4 text-base text-ink placeholder-faint transition focus:border-accent focus:outline-none sm:text-sm';

  return (
    <div className="theme-dark flex min-h-screen flex-col bg-canvas text-ink">
      <FoamEdge fill="#DAE1EE" className="rotate-180" />

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
        <h1 className="text-4xl font-extrabold tracking-[-0.03em]">Portal Karyawan</h1>
        <p className="mt-2 text-sm text-soft">Restoran POS & Backoffice (Admin / Kasir)</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-soft">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / kasir"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-soft">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-full py-3.5 text-sm font-bold transition ${
              loading
                ? 'cursor-not-allowed bg-raised text-faint'
                : 'bg-accent text-on-accent hover:bg-accent-hover active:scale-95'
            }`}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Portal'}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-center text-xs font-medium text-faint">Pintasan Login Demo</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line px-3 py-2.5 text-xs font-semibold text-soft transition hover:bg-raised hover:text-ink"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('cashier')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line px-3 py-2.5 text-xs font-semibold text-soft transition hover:bg-raised hover:text-ink"
            >
              <ChefHat className="h-3.5 w-3.5" />
              <span>Kasir Demo</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/table-selection')}
          className="mt-6 text-center text-sm text-faint transition hover:text-ink"
        >
          Beralih ke Tampilan Pelanggan (Meja)
        </button>
      </main>
    </div>
  );
}
