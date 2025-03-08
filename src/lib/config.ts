export const CONFIG = {
  RPC_ENDPOINTS: {
    PRIMARY: import.meta.env.VITE_SOLANA_RPC_PRIMARY || 'https://api.mainnet-beta.solana.com',
    FALLBACK: import.meta.env.VITE_SOLANA_RPC_FALLBACK || 'https://solana-api.projectserum.com',
    DEVNET: import.meta.env.VITE_SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com',
    ADDITIONAL: [
      import.meta.env.VITE_SOLANA_RPC_ALCHEMY || 'https://solana-mainnet.g.alchemy.com/v2/demo',
      import.meta.env.VITE_SOLANA_RPC_ANKR || 'https://rpc.ankr.com/solana',
      import.meta.env.VITE_SOLANA_RPC_HELIUS || 'https://mainnet.helius-rpc.com/?api-key=demo'
    ]
  },
  WEBSOCKET_ENDPOINTS: {
    PRIMARY: import.meta.env.VITE_SOLANA_WS_PRIMARY || 'wss://api.mainnet-beta.solana.com',
    FALLBACK: import.meta.env.VITE_SOLANA_WS_FALLBACK || 'wss://solana-api.projectserum.com',
    DEVNET: import.meta.env.VITE_SOLANA_WS_DEVNET || 'wss://api.devnet.solana.com'
  },
  BATCH_SIZE: 5,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  MIN_WALLET_BALANCE: 0.5,
  TRADE_SETTINGS: {
    MIN_PROFIT_PERCENTAGE: 20,
    MAX_SLIPPAGE: 1,
    MIN_LIQUIDITY: 1000,
    MIN_VOLUME: 500,
    INITIAL_PRICE: 0.0001,
    INITIAL_LIQUIDITY: 25
  },
  FEE_DISTRIBUTION: {
    INITIAL_LIQUIDITY_SHARE: 0.05,
    TRADING_FEE_SHARE: 0.50,
    OLD_COIN_PROFIT_SHARE: 0.10
  },
  LAUNCH_SETTINGS: {
    INITIAL_DELAY: 21 * 24 * 60 * 60 * 1000,
    PRE_LAUNCH_HINTS: 5,
    HINT_INTERVAL: 4 * 60 * 60 * 1000,
    NETWORK: 'mainnet',
    DEX: 'raydium'
  },
  BRANDING: {
    CREATOR_TAG: 'Created by Mind9',
    COLOR_PALETTE: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'],
    GRADIENT_STOPS: ['#4158D0', '#C850C0', '#FFCC70']
  },
  SOCIAL_MEDIA: {
    UPDATE_INTERVAL: 6 * 60 * 60 * 1000,
    PLATFORMS: ['twitter', 'telegram', 'discord'],
    ENGAGEMENT_THRESHOLD: 10,
    TWITTER: {
      MIN_DELAY: 30 * 60 * 1000,
      MAX_DELAY: 4 * 60 * 60 * 1000,
      RETRY_ATTEMPTS: 3,
      RETRY_DELAY: 5 * 60 * 1000
    }
  },
  BONDING_CURVE: {
    INITIAL_PRICE: 0.0001,
    SLOPE: 0.1,
    RESERVE_RATIO: 0.5,
    MIGRATION_THRESHOLD: 100000,
    LIQUIDITY_PERCENTAGE: 0.17,
    CREATOR_FEE: 0.01,
    RAYDIUM_MIGRATION_FEE: 6
  },
  WHALE_PROTECTION: {
    MAX_WALLET_PERCENTAGE: 2.5,
    MAX_TRANSACTION_PERCENTAGE: 1.0
  }
} as const;

export type Config = typeof CONFIG;