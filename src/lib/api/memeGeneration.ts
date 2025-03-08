import { MemeGenerator } from '../memeGenerator';
import { SolanaService } from '../solana';
import { LiquidityManager } from '../liquidityManager';
import { handleNetworkError } from '../errorHandling';
import type { MemeToken } from '../../types';

interface GenerationResponse {
  success: boolean;
  token?: MemeToken;
  error?: string;
  status?: {
    solanaConnection: boolean;
    aiWalletBalance: number;
    liquidityPool: boolean;
  };
}

export async function generateMemeToken(): Promise<GenerationResponse> {
  try {
    console.log('🔄 Starting meme token generation process...');
    
    // Initialize services
    const generator = new MemeGenerator();
    const solana = new SolanaService();
    const liquidityManager = new LiquidityManager();
    
    // Verify Solana connection
    const isConnected = await solana.verifyConnection().catch(() => false);
    if (!isConnected) {
      throw new Error('Failed to establish Solana connection');
    }
    
    // Check if we should launch
    const { shouldLaunch, reason } = await generator.shouldLaunchToken();
    if (!shouldLaunch) {
      return {
        success: false,
        error: reason,
        status: {
          solanaConnection: true,
          aiWalletBalance: 0,
          liquidityPool: false
        }
      };
    }
    
    // Initialize generator
    await generator.initialize();
    
    // Generate token
    const token = await generator.generateMemeToken();
    if (!token) {
      throw new Error('Failed to generate meme token');
    }
    
    // Initialize liquidity pool
    const poolResult = await liquidityManager.initializePool(
      token.id as any, // Convert string to PublicKey in production
      CONFIG.TRADE_SETTINGS.INITIAL_PRICE
    );
    
    if (!poolResult.success) {
      throw new Error('Failed to initialize liquidity pool');
    }
    
    // Start monitoring pool
    await liquidityManager.startMonitoring(poolResult.poolAddress);
    
    console.log('✅ Meme token generated successfully:', {
      id: token.id,
      name: token.name,
      liquidity: token.liquidity
    });
    
    return {
      success: true,
      token,
      status: {
        solanaConnection: true,
        aiWalletBalance: await solana.checkAIWalletBalance(poolResult.poolAddress),
        liquidityPool: true
      }
    };
  } catch (error) {
    console.error('❌ Error generating meme token:', error);
    await handleNetworkError(error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: {
        solanaConnection: false,
        aiWalletBalance: 0,
        liquidityPool: false
      }
    };
  }
}