import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { CONFIG } from './config';
import { DexManager } from './dexManager';
import { AIService } from './openai';

export interface BondingCurveParams {
  initialPrice: number;
  slope: number;
  reserveRatio: number;
  migrationThreshold: number;
  liquidityPercentage: number;
  raydiumMigrationFee: number;
}

export interface TokenState {
  tokenAddress: string;
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

export class BondingCurveManager {
  private connection: Connection;
  private dexManager: DexManager;
  private ai: AIService;
  private activeTokens: Map<string, TokenState> = new Map();
  private static readonly DEFAULT_PARAMS: BondingCurveParams = {
    initialPrice: CONFIG.BONDING_CURVE.INITIAL_PRICE,
    slope: CONFIG.BONDING_CURVE.SLOPE,
    reserveRatio: CONFIG.BONDING_CURVE.RESERVE_RATIO,
    migrationThreshold: CONFIG.BONDING_CURVE.MIGRATION_THRESHOLD,
    liquidityPercentage: CONFIG.BONDING_CURVE.LIQUIDITY_PERCENTAGE,
    raydiumMigrationFee: CONFIG.BONDING_CURVE.RAYDIUM_MIGRATION_FEE || 6
  };

  constructor() {
    this.connection = new Connection(CONFIG.RPC_ENDPOINTS.PRIMARY);
    this.dexManager = new DexManager();
    this.ai = new AIService();
  }

  /**
   * Calculate token price based on bonding curve formula
   * Price = initialPrice * (totalSupply ^ slope)
   */
  calculatePrice(totalSupply: number, params: BondingCurveParams = BondingCurveManager.DEFAULT_PARAMS): number {
    return params.initialPrice * Math.pow(totalSupply, params.slope);
  }

  /**
   * Calculate how many tokens to mint for a given SOL amount
   */
  calculateTokenAmount(solAmount: number, tokenState: TokenState): number {
    const { totalSupply } = tokenState;
    const params = BondingCurveManager.DEFAULT_PARAMS;
    
    // Calculate new total supply after purchase
    // For continuous token models: newSupply = currentSupply * (1 + solAmount/reserveBalance)^reserveRatio
    const newTotalSupply = totalSupply * Math.pow(
      1 + (solAmount / (tokenState.reserveBalance || 0.1)), 
      params.reserveRatio
    );
    
    // Return the difference (new tokens to mint)
    return newTotalSupply - totalSupply;
  }

  /**
   * Calculate how much SOL to return for a given token amount
   */
  calculateSolReturn(tokenAmount: number, tokenState: TokenState): number {
    const { totalSupply, reserveBalance } = tokenState;
    const params = BondingCurveManager.DEFAULT_PARAMS;
    
    if (tokenAmount > totalSupply) {
      throw new Error('Cannot sell more tokens than exist');
    }
    
    // Calculate new total supply after sale
    const newTotalSupply = totalSupply - tokenAmount;
    
    // Calculate SOL to return based on reserve ratio
    // For continuous token models: solReturn = reserveBalance * (1 - (newSupply/currentSupply)^(1/reserveRatio))
    const solReturn = reserveBalance * (
      1 - Math.pow(newTotalSupply / totalSupply, 1 / params.reserveRatio)
    );
    
    return solReturn;
  }

  /**
   * Buy tokens using the bonding curve
   */
  async buyTokens(
    tokenAddress: string, 
    solAmount: number, 
    buyerAddress: string
  ): Promise<{
    success: boolean;
    tokenAmount?: number;
    newPrice?: number;
    txId?: string;
  }> {
    try {
      console.log(`🔄 Processing buy order: ${solAmount} SOL for ${tokenAddress}`);
      
      // Get token state
      const tokenState = this.activeTokens.get(tokenAddress);
      if (!tokenState) {
        throw new Error('Token not found');
      }
      
      // Calculate token amount to mint
      const tokenAmount = this.calculateTokenAmount(solAmount, tokenState);
      
      // Update token state
      const newTotalSupply = tokenState.totalSupply + tokenAmount;
      const newReserveBalance = tokenState.reserveBalance + solAmount;
      const newPrice = this.calculatePrice(newTotalSupply);
      
      // Update token state
      this.activeTokens.set(tokenAddress, {
        ...tokenState,
        totalSupply: newTotalSupply,
        reserveBalance: newReserveBalance,
        currentPrice: newPrice,
        marketCap: newPrice * newTotalSupply,
        holders: tokenState.holders + (tokenState.holders === 0 ? 1 : 0),
        migrationReady: (newPrice * newTotalSupply) >= BondingCurveManager.DEFAULT_PARAMS.migrationThreshold
      });
      
      // Check if migration threshold is reached
      if ((newPrice * newTotalSupply) >= BondingCurveManager.DEFAULT_PARAMS.migrationThreshold && !tokenState.migrationReady) {
        this.triggerMigration(tokenAddress);
      }
      
      console.log(`✅ Buy order processed: ${tokenAmount} tokens at ${newPrice} SOL each`);
      
      return {
        success: true,
        tokenAmount,
        newPrice,
        txId: Math.random().toString(36).substring(2)
      };
    } catch (error) {
      console.error('❌ Error processing buy order:', error);
      return { success: false };
    }
  }

  /**
   * Sell tokens using the bonding curve
   */
  async sellTokens(
    tokenAddress: string, 
    tokenAmount: number, 
    sellerAddress: string
  ): Promise<{
    success: boolean;
    solReturn?: number;
    newPrice?: number;
    txId?: string;
  }> {
    try {
      console.log(`🔄 Processing sell order: ${tokenAmount} tokens for ${tokenAddress}`);
      
      // Get token state
      const tokenState = this.activeTokens.get(tokenAddress);
      if (!tokenState) {
        throw new Error('Token not found');
      }
      
      // Calculate SOL to return
      const solReturn = this.calculateSolReturn(tokenAmount, tokenState);
      
      // Update token state
      const newTotalSupply = tokenState.totalSupply - tokenAmount;
      const newReserveBalance = tokenState.reserveBalance - solReturn;
      const newPrice = this.calculatePrice(newTotalSupply);
      
      // Update token state
      this.activeTokens.set(tokenAddress, {
        ...tokenState,
        totalSupply: newTotalSupply,
        reserveBalance: newReserveBalance,
        currentPrice: newPrice,
        marketCap: newPrice * newTotalSupply
      });
      
      console.log(`✅ Sell order processed: ${solReturn} SOL returned at ${newPrice} SOL per token`);
      
      return {
        success: true,
        solReturn,
        newPrice,
        txId: Math.random().toString(36).substring(2)
      };
    } catch (error) {
      console.error('❌ Error processing sell order:', error);
      return { success: false };
    }
  }

  /**
   * Create a new token with bonding curve - only called by AI system
   */
  async createToken(
    name: string,
    symbol: string,
    creatorAddress: string
  ): Promise<{
    success: boolean;
    tokenAddress?: string;
    initialPrice?: number;
  }> {
    try {
      console.log(`🔄 AI creating new token: ${name} (${symbol})`);
      
      // Generate token address (in production this would be the actual token mint)
      const tokenAddress = Math.random().toString(36).substring(2);
      
      // Set initial token state
      const initialState: TokenState = {
        tokenAddress,
        name,
        symbol,
        totalSupply: 0,
        reserveBalance: 0,
        currentPrice: BondingCurveManager.DEFAULT_PARAMS.initialPrice,
        marketCap: 0,
        holders: 0,
        createdAt: Date.now(),
        creator: creatorAddress,
        migrationReady: false
      };
      
      // Add to active tokens
      this.activeTokens.set(tokenAddress, initialState);
      
      console.log(`✅ Token created: ${tokenAddress} at ${initialState.currentPrice} SOL initial price`);
      
      return {
        success: true,
        tokenAddress,
        initialPrice: initialState.currentPrice
      };
    } catch (error) {
      console.error('❌ Error creating token:', error);
      return { success: false };
    }
  }

  /**
   * Generate a new AI token with backstory
   */
  async generateAIToken(): Promise<{
    success: boolean;
    tokenAddress?: string;
    name?: string;
    symbol?: string;
  }> {
    try {
      // Generate token name and symbol using AI
      const name = await this.ai.generateMemeName();
      const symbol = name.split('_')[0];
      
      // Create the token
      const result = await this.createToken(name, symbol, 'mind9_ai_system');
      
      if (result.success && result.tokenAddress) {
        // Add some initial liquidity
        await this.buyTokens(
          result.tokenAddress,
          Math.random() * 2 + 0.5, // Random amount between 0.5 and 2.5 SOL
          'ai_liquidity_provider'
        );
        
        return {
          success: true,
          tokenAddress: result.tokenAddress,
          name,
          symbol
        };
      } else {
        throw new Error('Failed to create AI token');
      }
    } catch (error) {
      console.error('❌ Error generating AI token:', error);
      return { success: false };
    }
  }

  /**
   * Trigger migration to Raydium DEX
   */
  private async triggerMigration(tokenAddress: string): Promise<boolean> {
    try {
      console.log(`🚀 Triggering migration for token: ${tokenAddress}`);
      
      const tokenState = this.activeTokens.get(tokenAddress);
      if (!tokenState) {
        throw new Error('Token not found');
      }
      
      // Calculate liquidity to provide
      const liquidityAmount = tokenState.marketCap * BondingCurveManager.DEFAULT_PARAMS.liquidityPercentage;
      
      // Deduct the 6 SOL Raydium migration fee from the liquidity
      const raydiumFee = BondingCurveManager.DEFAULT_PARAMS.raydiumMigrationFee;
      const liquidityAfterFee = Math.max(0, liquidityAmount - raydiumFee);
      
      console.log(`💰 Raydium migration fee: ${raydiumFee} SOL`);
      console.log(`💧 Providing ${liquidityAfterFee} SOL liquidity to Raydium (after ${raydiumFee} SOL fee)`);
      
      // In production, this would create the actual liquidity pool on Raydium
      const result = await this.dexManager.listToken(
        new PublicKey(tokenAddress),
        tokenState.currentPrice,
        liquidityAfterFee
      );
      
      if (result.success) {
        console.log(`✅ Migration successful: ${tokenAddress} listed on Raydium`);
        
        // Update token state
        this.activeTokens.set(tokenAddress, {
          ...tokenState,
          migrationReady: true,
          // Reduce reserve balance by the migration fee
          reserveBalance: tokenState.reserveBalance - raydiumFee
        });
        
        return true;
      } else {
        throw new Error('Migration failed');
      }
    } catch (error) {
      console.error('❌ Error migrating token:', error);
      return false;
    }
  }

  /**
   * Get token state
   */
  getTokenState(tokenAddress: string): TokenState | null {
    return this.activeTokens.get(tokenAddress) || null;
  }

  /**
   * Get all active tokens
   */
  getAllTokens(): TokenState[] {
    return Array.from(this.activeTokens.values());
  }

  /**
   * Get migration parameters
   */
  getMigrationParams(): {
    threshold: number;
    liquidityPercentage: number;
    raydiumMigrationFee: number;
  } {
    return {
      threshold: BondingCurveManager.DEFAULT_PARAMS.migrationThreshold,
      liquidityPercentage: BondingCurveManager.DEFAULT_PARAMS.liquidityPercentage,
      raydiumMigrationFee: BondingCurveManager.DEFAULT_PARAMS.raydiumMigrationFee
    };
  }
}