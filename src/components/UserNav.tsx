import { useState } from 'react';
import {
  Gamepad2,
  ArrowDownToLine,
  ArrowUpFromLine,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import Logo from '@/components/Logo';
import BalanceDisplay from '@/components/BalanceDisplay';
import { useApp } from '@/context/AppContext';
import type { Page } from '@/App';

const NAV_ITEMS: { id: Page; label: string; icon: typeof Gamepad2 }[] = [
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
  { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

export default function UserNav({
  page,
  onNavigate,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
}) {
  const { currentUser, logout, isAdmin } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (p: Page) => {
    onNavigate(p);
    setMobileOpen(false);
  };

  // Treat all game sub-pages as "games" for nav highlighting
  const isActive = (id: Page) => {
    if (id === 'games') {
      return page === 'games' || page === 'hilo' || page === 'dice' || page === 'limbo' || page === 'mines' || page === 'plinko';
    }
    return page === id;
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-base-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <button onClick={() => handleNav('games')}>
              <Logo size="sm" />
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`nav-item ${isActive(item.id) ? 'nav-item-active' : ''}`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:block">
                <BalanceDisplay balance={currentUser.trxBalance} size="sm" />
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className="btn-ghost hidden md:flex"
                title="Admin Panel"
              >
                <Shield size={16} />
                Admin
              </button>
            )}
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
            <div className="mb-3">
              {currentUser && <BalanceDisplay balance={currentUser.trxBalance} size="sm" />}
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`nav-item ${isActive(item.id) ? 'nav-item-active' : ''}`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
              {isAdmin && (
                <button onClick={() => handleNav('admin')} className="nav-item">
                  <Shield size={16} />
                  Admin Panel
                </button>
              )}
              <button onClick={logout} className="nav-item">
                <LogOut size={16} />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
