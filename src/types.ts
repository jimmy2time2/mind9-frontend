export interface AILog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  progress?: number;
}

export interface MemeToken {
  id: string;
  name: string;
  symbol: string;
  imageUrl: string;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  dexUrl: string;
  createdAt: number;
  creator: string;
  liquidityLocked: number;
  whaleLimit: number;
  backstory: {
    theme: string;
    description: string;
    origin: string;
    memeReferences: string[];
  };
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
}

export interface TransactionLog {
  id: string;
  timestamp: number;
  type: 'liquidity' | 'trading_fee' | 'profit_transfer' | 'lucky_wallet';
  amount: number;
  fromWallet: string;
  toWallet: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface AIState {
  isGenerating: boolean;
  currentPhase: 'monitoring' | 'generating' | 'deploying' | 'listing' | 'idle';
  progress: number;
  whaleProtection: {
    maxWalletPercentage: number;
    maxTransactionPercentage: number;
  };
}

export interface PoolState {
  tokenAReserve: number;
  tokenBReserve: number;
  volume24h: number;
  priceImpact: number;
  lastUpdated: number;
}

export interface LiquidityAdjustment {
  needsAdjustment: boolean;
  tokenAAmount: number;
  tokenBAmount: number;
  action: 'add' | 'remove' | 'none';
  reason: string;
}

export interface TransactionRequest {
  id: string;
  walletAddress: string;
  tokenAddress: string;
  amount: number;
  type: 'buy' | 'sell';
  timestamp: number;
  priority: number;
  gasPrice: number;
  nonce: number;
}

export interface TransactionBatch {
  id: string;
  transactions: TransactionRequest[];
  timestamp: number;
  status: 'pending' | 'processing' | 'completed';
  totalValue: number;
}

export interface WalletActivity {
  address: string;
  transactions: {
    count: number;
    volume: number;
    lastTransaction: number;
  };
  patterns: {
    rapidBuys: number;
    rapidSells: number;
    frontRunAttempts: number;
  };
  riskScore: number;
  lastUpdated: number;
}

export interface SocialEngagement {
  twitterShares: number;
  twitterLikes: number;
  twitterRetweets: number;
  totalEngagement: number;
  lastShare: number;
  shareUrls: string[];
}

export interface ReferralScore {
  walletAddress: string;
  twitterUsername: string;
  engagement: SocialEngagement;
  score: number;
  lastUpdated: number;
}

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

export interface BondingCurveToken {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  reserveBalance: number;
  currentPrice: number;
  marketCap: number;
  holders: number;
  createdAt: number;
  creator: string;
  migrationReady: boolean;
}

export interface TradeHistory {
  id: string;
  tokenId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  value: number;
  timestamp: number;
  walletAddress: string;
}