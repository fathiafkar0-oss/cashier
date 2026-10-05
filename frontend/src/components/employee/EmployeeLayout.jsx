import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Receipt, 
  Target, 
  Table2, 
  LogOut, 
  UserCheck, 
  ChefHat, 
  ShieldCheck,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('employee_token');
  const user = JSON.parse(localStorage.getItem('employee_user') || 'null');

  if (!token || !user) {
    navigate('/admin/login');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_user');
    toast.success('Berhasil logout');
    navigate('/admin/login');
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-wide">
                Resto POS <span className="text-xs font-semibold text-amber-400 ml-1">Portal Karyawan</span>
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold">
            {isAdmin && (
              <>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                      isActive ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10' : 'text-stone-300 hover:bg-stone-800'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/admin/menus"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                      isActive ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800'
                    }`
                  }
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Menu & HPP</span>
                </NavLink>

                <NavLink
                  to="/admin/reports"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                      isActive ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800'
                    }`
                  }
                >
                  <Receipt className="w-4 h-4" />
                  <span>Laporan Profit</span>
                </NavLink>

                <NavLink
                  to="/admin/targets"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                      isActive ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800'
                    }`
                  }
                >
                  <Target className="w-4 h-4" />
                  <span>Target</span>
                </NavLink>

                <NavLink
                  to="/admin/tables"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                      isActive ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800'
                    }`
                  }
                >
                  <Table2 className="w-4 h-4" />
                  <span>Meja</span>
                </NavLink>
              </>
            )}

            {/* Link Kasir */}
            <NavLink
              to="/cashier/orders"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                  isActive ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10' : 'text-stone-300 hover:bg-stone-800'
                }`
              }
            >
              <ChefHat className="w-4 h-4" />
              <span>Antrean Kasir</span>
            </NavLink>

            <NavLink
              to="/cashier/history"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                  isActive ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800'
                }`
              }
            >
              <History className="w-4 h-4" />
              <span>Riwayat</span>
            </NavLink>
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">{user.full_name}</span>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-stone-700 bg-stone-800 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 text-stone-400 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
