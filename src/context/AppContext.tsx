import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Bet,
  BetOutcome,
  DataStore,
  Deposit,
  GameType,
  SiteConfig,
  User,
  Withdrawal,
} from '@/types';
import {
  clearSession,
  hashPassword,
  loadSession,
  loadStore,
  resetStore,
  saveSession,
  saveStore,
  uid,
} from '@/lib/storage';

export interface GameBetInput {
  game: GameType;
  amount: number;
  minBet: number;
  maxBet: number;
  multiplier: number;
  outcome: BetOutcome;
  payout: number;
  detail: string;
}

export function applyHouseEdge(fairMultiplier: number, houseEdgePercent: number): number {
  return fairMultiplier * (1 - houseEdgePercent / 100);
}

interface AppContextValue {
  store: DataStore;
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: () => void;
  placeGameBet: (input: GameBetInput) => { ok: boolean; error?: string; bet?: Bet };
  createDeposit: (amount: number, txHash: string) => { ok: boolean; error?: string; deposit?: Deposit };
  requestWithdrawal: (amount: number, address: string) => { ok: boolean; error?: string; withdrawal?: Withdrawal };
  cancelWithdrawal: (withdrawalId: string) => void;
  updateProfile: (updates: { username?: string; email?: string; password?: string }) => Promise<{ ok: boolean; error?: string }>;
  adminApproveDeposit: (depositId: string) => void;
  adminRejectDeposit: (depositId: string) => void;
  adminApproveWithdrawal: (withdrawalId: string) => void;
  adminRejectWithdrawal: (withdrawalId: string, reason: string) => void;
  adminModifyBalance: (userId: string, amount: number) => void;
  adminToggleBan: (userId: string) => void;
  adminDeleteUser: (userId: string) => void;
  adminUpdateConfig: (config: Partial<SiteConfig>) => void;
  adminResetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<DataStore>(() => loadStore());
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => loadSession());

  useEffect(() => {
    saveStore(store);
  }, [store]);

  useEffect(() => {
    if (sessionUserId) saveSession(sessionUserId);
    else clearSession();
  }, [sessionUserId]);

  const currentUser = useMemo(
    () => store.users.find((u) => u.id === sessionUserId) ?? null,
    [store.users, sessionUserId],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const user = store.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
      );
      if (!user) return { ok: false, error: 'No account found with that email.' };
      const hash = await hashPassword(password);
      if (user.passwordHash !== hash)
        return { ok: false, error: 'Incorrect password.' };
      if (user.status === 'banned')
        return { ok: false, error: 'Your account has been suspended. Contact support.' };
      setSessionUserId(user.id);
      return { ok: true };
    },
    [store.users],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const exists = store.users.some(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
      );
      if (exists) return { ok: false, error: 'An account with this email already exists.' };
      const hash = await hashPassword(password);
      const newUser: User = {
        id: uid('user'),
        username: username.trim(),
        email: email.trim(),
        passwordHash: hash,
        trxBalance: 0,
        joinedAt: new Date().toISOString(),
        isAdmin: false,
        status: 'active',
      };
      setStore((s) => ({ ...s, users: [...s.users, newUser] }));
      setSessionUserId(newUser.id);
      return { ok: true };
    },
    [store.users],
  );

  const logout = useCallback(() => setSessionUserId(null), []);

  const deleteAccount = useCallback(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setSessionUserId(null);
    setStore((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== userId),
    }));
  }, [currentUser]);

  const placeGameBet = useCallback(
    (input: GameBetInput) => {
      if (!currentUser) return { ok: false, error: 'Not logged in.' };
      if (input.amount < input.minBet)
        return { ok: false, error: `Minimum bet is ${input.minBet} TRX.` };
      if (input.amount > input.maxBet)
        return { ok: false, error: `Maximum bet is ${input.maxBet} TRX.` };
      if (input.amount > currentUser.trxBalance)
        return { ok: false, error: 'Insufficient balance.' };

      const netChange = input.outcome === 'win' ? input.payout - input.amount : -input.amount;

      const bet: Bet = {
        id: uid('bet'),
        userId: currentUser.id,
        game: input.game,
        amount: input.amount,
        multiplier: +input.multiplier.toFixed(4),
        outcome: input.outcome,
        payout: input.payout,
        detail: input.detail,
        createdAt: new Date().toISOString(),
      };

      setStore((s) => ({
        ...s,
        bets: [bet, ...s.bets],
        users: s.users.map((u) =>
          u.id === currentUser.id ? { ...u, trxBalance: +(u.trxBalance + netChange).toFixed(2) } : u,
        ),
      }));

      return { ok: true, bet };
    },
    [currentUser],
  );

  const createDeposit = useCallback(
    (amount: number, txHash: string) => {
      if (!currentUser) return { ok: false, error: 'Not logged in.' };
      const cfg = store.siteConfig;
      if (amount < cfg.minDeposit) return { ok: false, error: `Minimum deposit is ${cfg.minDeposit} TRX.` };
      if (!txHash.trim()) return { ok: false, error: 'Transaction hash is required.' };

      const deposit: Deposit = {
        id: uid('dep'),
        userId: currentUser.id,
        amount,
        txHash: txHash.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setStore((s) => ({ ...s, deposits: [deposit, ...s.deposits] }));
      return { ok: true, deposit };
    },
    [currentUser, store.siteConfig],
  );

  const requestWithdrawal = useCallback(
    (amount: number, address: string) => {
      if (!currentUser) return { ok: false, error: 'Not logged in.' };
      const cfg = store.siteConfig;
      if (amount < cfg.minWithdrawal) return { ok: false, error: `Minimum withdrawal is ${cfg.minWithdrawal} TRX.` };
      if (amount > currentUser.trxBalance) return { ok: false, error: 'Insufficient balance.' };
      if (!address.trim()) return { ok: false, error: 'Destination address is required.' };

      const withdrawal: Withdrawal = {
        id: uid('wd'),
        userId: currentUser.id,
        amount,
        destinationAddress: address.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setStore((s) => ({
        ...s,
        withdrawals: [withdrawal, ...s.withdrawals],
        users: s.users.map((u) =>
          u.id === currentUser.id ? { ...u, trxBalance: +(u.trxBalance - amount).toFixed(2) } : u,
        ),
      }));

      return { ok: true, withdrawal };
    },
    [currentUser, store.siteConfig],
  );

  const cancelWithdrawal = useCallback((withdrawalId: string) => {
    setStore((s) => {
      const wd = s.withdrawals.find((w) => w.id === withdrawalId);
      if (!wd || wd.status !== 'pending') return s;
      return {
        ...s,
        withdrawals: s.withdrawals.map((w) =>
          w.id === withdrawalId ? { ...w, status: 'cancelled' as const } : w,
        ),
        users: s.users.map((u) =>
          u.id === wd.userId ? { ...u, trxBalance: +(u.trxBalance + wd.amount).toFixed(2) } : u,
        ),
      };
    });
  }, []);

  const updateProfile = useCallback(
    async (updates: { username?: string; email?: string; password?: string }) => {
      if (!currentUser) return { ok: false, error: 'Not logged in.' };
      if (updates.email) {
        const exists = store.users.some(
          (u) => u.id !== currentUser.id && u.email.toLowerCase() === updates.email!.toLowerCase().trim(),
        );
        if (exists) return { ok: false, error: 'Email already in use.' };
      }
      const newHash = updates.password ? await hashPassword(updates.password) : undefined;
      setStore((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                username: updates.username?.trim() || u.username,
                email: updates.email?.trim() || u.email,
                passwordHash: newHash ?? u.passwordHash,
              }
            : u,
        ),
      }));
      return { ok: true };
    },
    [currentUser, store.users],
  );

  const adminApproveDeposit = useCallback((depositId: string) => {
    setStore((s) => {
      const dep = s.deposits.find((d) => d.id === depositId);
      if (!dep || dep.status !== 'pending') return s;
      return {
        ...s,
        deposits: s.deposits.map((d) => (d.id === depositId ? { ...d, status: 'credited' as const } : d)),
        users: s.users.map((u) =>
          u.id === dep.userId ? { ...u, trxBalance: +(u.trxBalance + dep.amount).toFixed(2) } : u,
        ),
      };
    });
  }, []);

  const adminRejectDeposit = useCallback((depositId: string) => {
    setStore((s) => ({
      ...s,
      deposits: s.deposits.map((d) => (d.id === depositId ? { ...d, status: 'failed' as const } : d)),
    }));
  }, []);

  const adminApproveWithdrawal = useCallback((withdrawalId: string) => {
    setStore((s) => ({
      ...s,
      withdrawals: s.withdrawals.map((w) =>
        w.id === withdrawalId ? { ...w, status: 'approved' as const } : w,
      ),
    }));
  }, []);

  const adminRejectWithdrawal = useCallback((withdrawalId: string, reason: string) => {
    setStore((s) => {
      const wd = s.withdrawals.find((w) => w.id === withdrawalId);
      if (!wd || wd.status !== 'pending') return s;
      return {
        ...s,
        withdrawals: s.withdrawals.map((w) =>
          w.id === withdrawalId ? { ...w, status: 'rejected' as const, reason } : w,
        ),
        users: s.users.map((u) =>
          u.id === wd.userId ? { ...u, trxBalance: +(u.trxBalance + wd.amount).toFixed(2) } : u,
        ),
      };
    });
  }, []);

  const adminModifyBalance = useCallback((userId: string, amount: number) => {
    setStore((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId ? { ...u, trxBalance: +(u.trxBalance + amount).toFixed(2) } : u,
      ),
    }));
  }, []);

  const adminToggleBan = useCallback((userId: string) => {
    setStore((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u,
      ),
    }));
  }, []);

  const adminDeleteUser = useCallback((userId: string) => {
    setStore((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== userId),
    }));
  }, []);

  const adminUpdateConfig = useCallback((config: Partial<SiteConfig>) => {
    setStore((s) => ({ ...s, siteConfig: { ...s.siteConfig, ...config } }));
  }, []);

  const adminResetDemoData = useCallback(() => {
    resetStore();
    setSessionUserId(null);
    setStore(loadStore());
  }, []);

  const value: AppContextValue = {
    store,
    currentUser,
    isAdmin: currentUser?.isAdmin ?? false,
    login,
    register,
    logout,
    deleteAccount,
    placeGameBet,
    createDeposit,
    requestWithdrawal,
    cancelWithdrawal,
    updateProfile,
    adminApproveDeposit,
    adminRejectDeposit,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    adminModifyBalance,
    adminToggleBan,
    adminDeleteUser,
    adminUpdateConfig,
    adminResetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
