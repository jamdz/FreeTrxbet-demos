import { useState } from 'react';
import {
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useApp } from '@/context/AppContext';
import type { AdminPage } from '@/App';

const NAV_ITEMS: { id: AdminPage; label: string; icon: typeof Users }[] = [
  { id: 'admin-users', label: 'Users', icon: Users },
  { id: 'admin-deposits', label: 'Deposits', icon: ArrowDownToLine },
  { id: 'admin-withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { id: 'admin-config', label: 'Site Config', icon: Settings },
];

export default function AdminNav({
  page,
  onNavigate,
}: {
  page: AdminPage;
  onNavigate: (p: AdminPage | 'dashboard') => void;
}) {
  const { logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (p: AdminPage | 'dashboard') => {
    onNavigate(p);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-base-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <button onClick={() => handleNav('admin-users')}>
            <Logo size="sm" />
          </button>
          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-btn bg-accent-salmon-dim px-3 py-1 text-xs font-bold text-accent-salmon">
              <Shield size={14} />
              ADMIN PANEL
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`nav-item ${page === item.id ? 'nav-item-active' : ''}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNav('dashboard')}
            className="btn-ghost hidden md:flex"
          >
            <ArrowLeft size={16} />
            Back to Site
          </button>
          <button
            onClick={logout}
            className="btn-ghost hidden md:flex"
          >
            <LogOut size={16} />
            Logout
          </button>
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-base-surface px-4 py-3 animate-slide-up">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`nav-item ${page === item.id ? 'nav-item-active' : ''}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
            <button onClick={() => handleNav('dashboard')} className="nav-item">
              <ArrowLeft size={16} />
              Back to Site
            </button>
            <button onClick={logout} className="nav-item">
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
