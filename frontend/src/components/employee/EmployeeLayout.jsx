import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Receipt, 
  Target, 
  Table2, 
  LogOut, 
  ChefHat, 
  ShieldCheck,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/admin/menus', label: 'Menu & HPP', Icon: UtensilsCrossed },
  { to: '/admin/reports', label: 'Laporan Profit', Icon: Receipt },
  { to: '/admin/targets', label: 'Target', Icon: Target },
  { to: '/admin/tables', label: 'Meja', Icon: Table2 },
];

const CASHIER_NAV = [
  { to: '/cashier/orders', label: 'Antrean Kasir', Icon: ChefHat },
  { to: '/cashier/history', label: 'Riwayat', Icon: History },
];

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
  const navItems = [...(isAdmin ? ADMIN_NAV : []), ...CASHIER_NAV];

  const desktopLink = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-accent text-on-accent' : 'text-soft hover:bg-raised hover:text-ink'
    }`;

  const mobileLink = ({ isActive }) =>
    `flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
      isActive ? 'bg-accent text-on-accent' : 'text-soft'
    }`;

  return (
    <div className="theme-dark min-h-screen bg-canvas text-ink lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-panel px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-on-accent">
            {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <ChefHat className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-extrabold leading-tight tracking-tight">Resto POS</p>
            <p className="text-xs text-faint">Portal Karyawan</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={desktopLink}>
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-between gap-2 rounded-xl bg-raised p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user.full_name}</p>
            <p className="text-xs capitalize text-soft">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-soft transition hover:bg-danger/20 hover:text-danger"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-panel/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <div>
          <p className="font-extrabold leading-tight tracking-tight">Resto POS</p>
          <p className="text-xs text-faint">
            {user.full_name}, <span className="capitalize">{user.role}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="grid h-10 w-10 place-items-center rounded-xl bg-raised text-soft transition hover:bg-danger/20 hover:text-danger"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 pb-28 md:p-6 md:pb-28 lg:p-8">
        <Outlet />
      </main>

      <nav className="scrollbar-none fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-line bg-panel/95 p-2 backdrop-blur-md lg:hidden">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={mobileLink}>
            <Icon className="h-5 w-5" />
            <span className="whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
