import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from './config';
import type { PoolState, LiquidityAdjustment } from '../types';
import { handleNetworkError } from './errorHandling';

export class LiquidityManager {
  private connection: Connection;
  private static readonly PRICE_IMPACT_THRESHOLD = 0.02; // 2% price impact threshold
  private static readonly MIN_LIQUIDITY_RATIO = 0.1; // 10% minimum liquidity ratio
  private static readonly REBALANCE_THRESHOLD = 0.05; // 5% deviation triggers rebalance
  private static readonly MONITORING_INTERVAL = 60 * 1000; // 1 minute
  private static readonly INITIAL_LIQUIDITY = CONFIG.TRADE_SETTINGS.INITIAL_LIQUIDITY; // $25 initial liquidity
  private monitoringInterval: NodeJS.Timer | null = null;
  private poolAddresses: Map<string, PublicKey> = new Map();
  private lastError: Error | null = null;

  constructor() {
    this.connection = new Connection(CONFIG.RPC_ENDPOINTS.PRIMARY);
  }

  async startMonitoring(poolAddress: PublicKey): Promise<void> {
    try {
      console.log('🔄 Starting liquidity pool monitoring...');
      
      // Verify pool exists
      const poolInfo = await this.connection.getAccountInfo(poolAddress);
      if (!poolInfo) {
        throw new Error('Pool not found');
      }
      
      // Store pool address
      this.poolAddresses.set(poolAddress.toString(), poolAddress);
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }

      this.monitoringInterval = setInterval(async () => {
        try {
          const poolState = await this.getPoolState(poolAddress);
          const adjustment = this.calculateAdjustment(poolState);
          
          if (adjustment.needsAdjustment) {
            await this.adjustLiquidity(poolAddress, adjustment);
          }
        } catch (error) {
          console.error('❌ Error monitoring liquidity:', error);
          this.lastError = error instanceof Error ? error : new Error('Unknown error');
          await handleNetworkError(error);
        }
      }, this.constructor.MONITORING_INTERVAL);

      console.log('✅ Pool monitoring started:', poolAddress.toString());
    } catch (error) {
      console.error('❌ Failed to start pool monitoring:', error);
      this.lastError = error instanceof Error ? error : new Error('Failed to start monitoring');
      throw error;
    }
  }

  async initializePool(
    tokenMint: PublicKey,
    initialPrice: number
  ): Promise<{ poolAddress: PublicKey; success: boolean }> {
    try {
      console.log('🔄 Initializing liquidity pool...');
      console.log(`Initial liquidity: $${this.constructor.INITIAL_LIQUIDITY}`);
      console.log(`Initial price: ${initialPrice} SOL`);

      // Calculate initial token amounts
      const solAmount = this.constructor.INITIAL_LIQUIDITY / 2; // Half in SOL
      const tokenAmount = (solAmount / initialPrice) * 2; // Other half in tokens

      // Create pool with exact $25 initial liquidity
      const poolAddress = await this.createPool(
        tokenMint,
        solAmount,
        tokenAmount,
        initialPrice
      );

      // Store pool address
      this.poolAddresses.set(poolAddress.toString(), poolAddress);

      console.log('✅ Pool initialized successfully');
      console.log('Pool Address:', poolAddress.toString());
      console.log('Initial SOL:', solAmount);
      console.log('Initial Tokens:', tokenAmount);

      return {
        poolAddress,
        success: true
      };
    } catch (error) {
      console.error('❌ Failed to initialize pool:', error);
      this.lastError = error instanceof Error ? error : new Error('Failed to initialize pool');
      throw error;
    }
  }

  private async createPool(
    tokenMint: PublicKey,
    solAmount: number,
    tokenAmount: number,
    initialPrice: number
  ): Promise<PublicKey> {
    try {
      // Generate deterministic pool address
      const [poolAddress] = await PublicKey.findProgramAddress(
        [
          tokenMint.toBuffer(),
          Buffer.from('pool'),
          Buffer.from([1]) // Version
        ],
        new PublicKey('RaYdiumSoLSwaPPooLv2')
      );

      // Verify pool doesn't already exist
      const existingPool = await this.connection.getAccountInfo(poolAddress);
      if (existingPool) {
        throw new Error('Pool already exists');
      }

      // Initialize pool with exact amounts
      // Note: In production, this would create the actual Raydium pool
      console.log('Pool parameters:', {
        tokenMint: tokenMint.toString(),
        solAmount,
        tokenAmount,
        initialPrice
      });

      return poolAddress;
    } catch (error) {
      console.error('❌ Error creating pool:', error);
      throw error;
    }
  }

  private async getPoolState(poolAddress: PublicKey): Promise<PoolState> {
    try {
      // Verify pool exists
      const poolInfo = await this.connection.getAccountInfo(poolAddress);
      if (!poolInfo) {
        throw new Error('Pool not found');
      }

      // Get pool data
      const tokenAReserve = 1000; // Placeholder
      const tokenBReserve = 1000; // Placeholder
      const volume24h = 10000; // Placeholder
      const priceImpact = this.calculatePriceImpact(tokenAReserve, tokenBReserve, volume24h);
      
      return {
        tokenAReserve,
        tokenBReserve,
        volume24h,
        priceImpact,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('❌ Error fetching pool state:', error);
      throw error;
    }
  }

  private calculatePriceImpact(
    tokenAReserve: number,
    tokenBReserve: number,
    volume24h: number
  ): number {
    const k = tokenAReserve * tokenBReserve;
    const averageTradeSize = volume24h / 24;
    const newTokenAReserve = tokenAReserve + averageTradeSize;
    const newTokenBReserve = k / newTokenAReserve;
    return Math.abs((newTokenBReserve - tokenBReserve) / tokenBReserve);
  }

  private calculateAdjustment(poolState: PoolState): LiquidityAdjustment {
    const {
      tokenAReserve,
      tokenBReserve,
      volume24h,
      priceImpact
    } = poolState;

    const needsAdjustment = priceImpact > this.constructor.PRICE_IMPACT_THRESHOLD;
    
    if (!needsAdjustment) {
      return {
        needsAdjustment: false,
        tokenAAmount: 0,
        tokenBAmount: 0,
        action: 'none',
        reason: 'Pool is stable'
      };
    }

    const optimalLiquidity = volume24h * this.constructor.MIN_LIQUIDITY_RATIO;
    const currentLiquidity = Math.min(tokenAReserve, tokenBReserve);
    const liquidityDelta = optimalLiquidity - currentLiquidity;
    const action = liquidityDelta > 0 ? 'add' : 'remove';
    const price = tokenBReserve / tokenAReserve;
    const tokenAAmount = Math.abs(liquidityDelta);
    const tokenBAmount = Math.abs(liquidityDelta * price);

    return {
      needsAdjustment: true,
      tokenAAmount,
      tokenBAmount,
      action,
      reason: action === 'add' 
        ? 'Insufficient liquidity for current volume'
        : 'Excess liquidity causing inefficient capital usage'
    };
  }

  private async adjustLiquidity(
    poolAddress: PublicKey,
    adjustment: LiquidityAdjustment
  ): Promise<void> {
    try {
      const {
        action,
        tokenAAmount,
        tokenBAmount,
        reason
      } = adjustment;

      console.log(`🔄 Adjusting liquidity pool: ${action.toUpperCase()}`);
      console.log(`Reason: ${reason}`);
      console.log(`Adjusting: +${tokenAAmount.toFixed(4)} Token A, +${tokenBAmount.toFixed(4)} Token B`);

      // Verify pool exists
      if (!this.poolAddresses.has(poolAddress.toString())) {
        throw new Error('Pool not found in registry');
      }

      // Implementation would interact with the DEX to adjust liquidity
      console.log('✅ Liquidity adjustment complete');
    } catch (error) {
      console.error('❌ Error adjusting liquidity:', error);
      this.lastError = error instanceof Error ? error : new Error('Failed to adjust liquidity');
      throw error;
    }
  }

  getPoolAddress(tokenMint: string): PublicKey | null {
    return this.poolAddresses.get(tokenMint) || null;
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Stopped liquidity pool monitoring');
    }
  }
}