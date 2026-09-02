import type { DataStore, SiteConfig } from '@/types';

const STORAGE_KEY = 'freetrxbet_store_v1';
const SESSION_KEY = 'freetrxbet_session_v1';

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'FreeTrxBet',
  supportTelegram: '@FreeTrxBetSupport',
  maintenanceMode: false,
  houseEdgePercent: 5,
  minDeposit: 5,
  minWithdrawal: 10,
  withdrawalNote: 'Withdrawals are processed within 24 hours. Minimum withdrawal is 10 TRX.',
  depositAddress: 'TQn9Y2khEsLJW1ChWWFarS9j7V9kX2kP9m',
  hiLoMinBet: 1,
  hiLoMaxBet: 5000,
  diceMinBet: 1,
  diceMaxBet: 5000,
  limboMinBet: 1,
  limboMaxBet: 5000,
  limboMaxMultiplier: 1000,
  minesMinBet: 1,
  minesMaxBet: 5000,
  minesAllowedCounts: [3, 5, 10],
  plinkoMinBet: 1,
  plinkoMaxBet: 5000,
};

// Pre-computed SHA-256 hashes for seed users.
const ADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
const DEMO_HASH = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791';

function buildSeedStore(): DataStore {
  return {
    users: [
      {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@freetrxbet.com',
        passwordHash: ADMIN_HASH,
        trxBalance: 0,
        joinedAt: new Date('2025-01-01').toISOString(),
        isAdmin: true,
        status: 'active',
      },
      {
        id: 'user-demo',
        username: 'demo',
        email: 'demo@freetrxbet.com',
        passwordHash: DEMO_HASH,
        trxBalance: 100,
        joinedAt: new Date('2025-06-15').toISOString(),
        isAdmin: false,
        status: 'active',
      },
    ],
    deposits: [],
    withdrawals: [],
    bets: [],
    siteConfig: DEFAULT_CONFIG,
  };
}

export function loadStore(): DataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildSeedStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as DataStore;
    // Merge any missing config keys from defaults (handles upgrades)
    parsed.siteConfig = { ...DEFAULT_CONFIG, ...parsed.siteConfig };
    if (!parsed.siteConfig.minesAllowedCounts) {
      parsed.siteConfig.minesAllowedCounts = DEFAULT_CONFIG.minesAllowedCounts;
    }
    return parsed;
  } catch {
    return buildSeedStore();
  }
}

export function saveStore(store: DataStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function saveSession(userId: string): void {
  localStorage.setItem(SESSION_KEY, userId);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function resetStore(): void {
  const seed = buildSeedStore();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  localStorage.removeItem(SESSION_KEY);
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function hashPassword(pw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function formatTrx(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
