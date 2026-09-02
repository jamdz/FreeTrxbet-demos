export type UserStatus = 'active' | 'banned';
export type DepositStatus = 'pending' | 'credited' | 'failed';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type BetOutcome = 'win' | 'loss';

export type GameType = 'hilo' | 'dice' | 'limbo' | 'mines' | 'plinko';
export type DiceMode = 'under' | 'over';
export type PlinkoRisk = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  trxBalance: number;
  joinedAt: string;
  isAdmin: boolean;
  status: UserStatus;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  txHash: string;
  status: DepositStatus;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  destinationAddress: string;
  status: WithdrawalStatus;
  reason?: string;
  createdAt: string;
}

export interface Bet {
  id: string;
  userId: string;
  game: GameType;
  amount: number;
  multiplier: number;
  outcome: BetOutcome;
  payout: number;
  detail: string;
  createdAt: string;
}

export interface SiteConfig {
  siteName: string;
  supportTelegram: string;
  maintenanceMode: boolean;
  houseEdgePercent: number;
  minDeposit: number;
  minWithdrawal: number;
  withdrawalNote: string;
  depositAddress: string;
  hiLoMinBet: number;
  hiLoMaxBet: number;
  diceMinBet: number;
  diceMaxBet: number;
  limboMinBet: number;
  limboMaxBet: number;
  limboMaxMultiplier: number;
  minesMinBet: number;
  minesMaxBet: number;
  minesAllowedCounts: number[];
  plinkoMinBet: number;
  plinkoMaxBet: number;
}

export interface DataStore {
  users: User[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  bets: Bet[];
  siteConfig: SiteConfig;
}
