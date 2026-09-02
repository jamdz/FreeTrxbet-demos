import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ToastProvider } from '@/components/Toast';
import UserNav from '@/components/UserNav';
import AdminNav from '@/components/AdminNav';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import GamesHubPage from '@/pages/GamesHubPage';
import DashboardPage from '@/pages/DashboardPage';
import DicePage from '@/pages/DicePage';
import LimboPage from '@/pages/LimboPage';
import MinesPage from '@/pages/MinesPage';
import PlinkoPage from '@/pages/PlinkoPage';
import DepositPage from '@/pages/DepositPage';
import WithdrawPage from '@/pages/WithdrawPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminDepositsPage from '@/pages/admin/AdminDepositsPage';
import AdminWithdrawalsPage from '@/pages/admin/AdminWithdrawalsPage';
import AdminConfigPage from '@/pages/admin/AdminConfigPage';
import { AlertTriangle } from 'lucide-react';
import ProBanner from '@/components/ProBanner';

export type Page =
  | 'games'
  | 'hilo'
  | 'dice'
  | 'limbo'
  | 'mines'
  | 'plinko'
  | 'deposit'
  | 'withdraw'
  | 'profile'
  | 'admin';
export type AdminPage = 'admin-users' | 'admin-deposits' | 'admin-withdrawals' | 'admin-config';
export type AuthPage = 'login' | 'register' | 'landing';

function AppContent() {
  const { currentUser, isAdmin, store, logout } = useApp();
  const [page, setPage] = useState<Page>('games');
  const [adminPage, setAdminPage] = useState<AdminPage>('admin-users');
  const [authPage, setAuthPage] = useState<AuthPage>('landing');

  // Redirect non-admins away from admin pages
  useEffect(() => {
    if (page === 'admin' && !isAdmin) {
      setPage('games');
    }
  }, [page, isAdmin]);

  // Maintenance mode check for non-admins
  if (currentUser && !isAdmin && store.siteConfig.maintenanceMode) {
    return (
      <div className="min-h-screen bg-base-bg">
        <ProBanner />
        <div className="flex min-h-[calc(100vh-40px)] flex-col items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-pending-dim">
            <AlertTriangle size={32} className="text-status-pending" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">Under Maintenance</h1>
          <p className="text-sm text-gray-500">
            FreeTrxBet is currently undergoing maintenance. Please check back soon.
          </p>
          <p className="mt-3 text-xs text-gray-600">
            Need help? Contact us on Telegram: {store.siteConfig.supportTelegram}
          </p>
          <button
            onClick={logout}
            className="btn-outline mt-5"
          >
            Logout
          </button>
        </div>
        </div>
      </div>
    );
  }

  // Not logged in: show landing page or auth pages
  if (!currentUser) {
    if (authPage === 'login') {
      return (
        <div className="min-h-screen bg-base-bg">
          <ProBanner />
          <LoginPage onNavigate={setAuthPage} />
        </div>
      );
    }
    if (authPage === 'register') {
      return (
        <div className="min-h-screen bg-base-bg">
          <ProBanner />
          <RegisterPage onNavigate={setAuthPage} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-base-bg">
        <ProBanner />
        <LandingPage onLogin={() => setAuthPage('login')} onRegister={() => setAuthPage('register')} />
      </div>
    );
  }

  // Admin panel
  if (page === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen bg-base-bg">
        <ProBanner />
        <AdminNav page={adminPage} onNavigate={(p) => {
          if (p === 'dashboard') setPage('games');
          else setAdminPage(p as AdminPage);
        }} />
        <main>
          {adminPage === 'admin-users' && <AdminUsersPage />}
          {adminPage === 'admin-deposits' && <AdminDepositsPage />}
          {adminPage === 'admin-withdrawals' && <AdminWithdrawalsPage />}
          {adminPage === 'admin-config' && <AdminConfigPage />}
        </main>
      </div>
    );
  }

  // Regular user pages
  return (
    <div className="min-h-screen bg-base-bg">
      <ProBanner />
      <UserNav page={page} onNavigate={setPage} />
      <main>
        {page === 'games' && <GamesHubPage onNavigate={(p) => setPage(p as Page)} />}
        {page === 'hilo' && <DashboardPage />}
        {page === 'dice' && <DicePage />}
        {page === 'limbo' && <LimboPage />}
        {page === 'mines' && <MinesPage />}
        {page === 'plinko' && <PlinkoPage />}
        {page === 'deposit' && <DepositPage />}
        {page === 'withdraw' && <WithdrawPage />}
        {page === 'profile' && <ProfilePage />}
      </main>
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-gray-600">
          {store.siteConfig.siteName} · Support: {store.siteConfig.supportTelegram}
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}
