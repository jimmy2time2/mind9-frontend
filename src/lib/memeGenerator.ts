import { PublicKey } from '@solana/web3.js';
import { SolanaService } from './solana';
import { AIService } from './openai';
import { WalletManager } from './walletManager';
import { LuckyWalletManager } from './luckyWalletManager';
import { DexManager } from './dexManager';
import { MarketAnalyzer } from './marketAnalyzer';
import { ImageGenerator } from './imageGenerator';
import { initializeTwitterScheduler } from './twitterScheduler';
import { CONFIG } from './config';
import type { MemeToken, LuckyWallet } from '../types';

export class MemeGenerator {
  private solana: SolanaService;
  private ai: AIService;
  private walletManager: WalletManager;
  private luckyWalletManager: LuckyWalletManager;
  private dexManager: DexManager;
  private marketAnalyzer: MarketAnalyzer;
  private imageGenerator: ImageGenerator;
  private currentLuckyWallet: LuckyWallet | null = null;
  private isInitialized: boolean = false;
  private launchDate: number;
  private initializationAttempts: number = 0;
  private readonly maxInitAttempts: number = 3;

  constructor() {
    console.log('🔧 Initializing MemeGenerator...');
    this.solana = new SolanaService();
    this.ai = new AIService();
    this.walletManager = new WalletManager();
    this.luckyWalletManager = new LuckyWalletManager();
    this.dexManager = new DexManager();
    this.marketAnalyzer = new MarketAnalyzer();
    this.imageGenerator = new ImageGenerator();
    
    // Set launch date to 21 days from now
    const now = new Date();
    this.launchDate = new Date(now.getTime() + CONFIG.LAUNCH_SETTINGS.INITIAL_DELAY).getTime();
    
    console.log('✅ MemeGenerator initialized');
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;
      
      console.log('🔄 Starting system initialization...');
      
      // Initialize wallet management system with retries
      while (this.initializationAttempts < this.maxInitAttempts) {
        try {
          // First verify Solana connection
          const isConnected = await this.solana.verifyConnection().catch(() => false);
          if (!isConnected) {
            throw new Error('Failed to establish Solana connection');
          }

          // Then initialize wallet system
          await this.walletManager.initializeSystem();
          break; // Success, exit retry loop
        } catch (error) {
          this.initializationAttempts++;
          console.warn(`Initialization attempt ${this.initializationAttempts} failed:`, error);
          
          if (this.initializationAttempts >= this.maxInitAttempts) {
            console.log('⚠️ Proceeding with limited functionality due to connection issues');
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Start market analysis
      try {
        const marketCondition = await this.marketAnalyzer.analyzeMarket();
        console.log('📊 Initial market analysis complete:', {
          sentiment: marketCondition.overallSentiment,
          confidence: Math.round(marketCondition.confidence * 100) + '%'
        });
      } catch (error) {
        console.warn('Market analysis failed, using fallback:', error);
      }
      
      // Initialize Twitter scheduler with 10 tweets per day
      try {
        console.log('🐦 Initializing Twitter scheduler...');
        initializeTwitterScheduler(10);
      } catch (error) {
        console.warn('Twitter scheduler initialization failed:', error);
      }
      
      this.isInitialized = true;
      console.log('✅ System initialization complete');
    } catch (error) {
      console.error('❌ System initialization failed:', {
        error,
        message: error.message,
        stack: error.stack,
        phase: 'initialization'
      });
      
      // Set initialized to true anyway to prevent repeated initialization attempts
      // but log a warning about limited functionality
      this.isInitialized = true;
      console.warn('⚠️ System initialized with limited functionality');
    }
  }

  async shouldLaunchToken(): Promise<{
    shouldLaunch: boolean;
    reason: string;
  }> {
    // Check if we've reached the launch date
    const now = Date.now();
    if (now < this.launchDate) {
      return {
        shouldLaunch: false,
        reason: `Launch date not reached yet. Scheduled for ${new Date(this.launchDate).toLocaleDateString()}`
      };
    }
    
    // Check market conditions
    const marketCondition = this.marketAnalyzer.getMarketCondition();
    if (!marketCondition || marketCondition.confidence < 0.7) {
      return {
        shouldLaunch: false,
        reason: 'Market conditions are not optimal for launch'
      };
    }
    
    return {
      shouldLaunch: true,
      reason: 'Market conditions are optimal for launch'
    };
  }

  async generateMemeToken(): Promise<MemeToken> {
    try {
      console.log('🔄 Starting meme token generation...');
      
      // Check market conditions
      const { shouldLaunch, reason } = await this.shouldLaunchToken();
      if (!shouldLaunch) {
        console.warn(`Cannot launch token: ${reason}, but proceeding with mock token for testing`);
      }

      // Generate token name and description using AI
      const name = await this.ai.generateMemeName();
      const description = await this.ai.generateTokenDescription();

      // Generate token backstory
      console.log('📖 Generating token backstory...');
      const backstory = await this.ai.generateTokenBackstory(name);

      // Ensure memeReferences is an array
      if (!backstory.memeReferences || !Array.isArray(backstory.memeReferences)) {
        backstory.memeReferences = [
          "Neural Networks",
          "To the Moon",
          "Diamond Hands",
          "AI Revolution"
        ];
      }

      // Generate token branding
      console.log('🎨 Generating token branding...');
      const branding = await this.imageGenerator.generateBrandingAssets(name);

      // Create mock token data instead of actual Solana token
      const mockToken = {
        mint: Math.random().toString(36).substring(2),
        name: `${name} (${CONFIG.BRANDING.CREATOR_TAG})`,
        symbol: name.split('_')[0],
        totalSupply: 1_000_000_000,
        lockedSupply: 700_000_000,
        tradableSupply: 300_000_000
      };

      // Generate mock pool info
      const poolInfo = {
        liquidity: 25, // Start with $25 liquidity
        volume24h: 0,
        price: 0.0001 * (1 + Math.random())
      };

      // Return token data
      return {
        id: mockToken.mint,
        name: mockToken.name,
        symbol: mockToken.symbol,
        imageUrl: branding.logoUrl,
        marketCap: mockToken.totalSupply * poolInfo.price,
        volume24h: poolInfo.volume24h,
        liquidity: poolInfo.liquidity,
        dexUrl: `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${mockToken.mint}`,
        createdAt: Date.now(),
        creator: 'Mind9',
        liquidityLocked: 70,
        whaleLimit: 2.5,
        backstory,
        socialLinks: {
          twitter: 'https://twitter.com/mind9ai',
          telegram: 'https://t.me/mind9ai',
          discord: 'https://discord.gg/mind9ai'
        }
      };
    } catch (error) {
      console.error('❌ Error generating meme token:', {
        error,
        message: error.message,
        stack: error.stack
      });
      
      // Return a fallback token
      return this.createFallbackToken();
    }
  }
  
  private createFallbackToken(): MemeToken {
    const name = "QUANTUM_DOGE_AI";
    const symbol = "QUANTUM";
    const tokenId = Math.random().toString(36).substring(2);
    
    return {
      id: tokenId,
      name: `${name} (${CONFIG.BRANDING.CREATOR_TAG})`,
      symbol,
      imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=128&h=128&fit=crop&auto=format&q=90',
      marketCap: 25, // Start with $25 liquidity
      volume24h: 0,
      liquidity: 25,
      dexUrl: `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${tokenId}`,
      createdAt: Date.now(),
      creator: 'Mind9',
      liquidityLocked: 70,
      whaleLimit: 2.5,
      backstory: {
        theme: "AI meets Internet Culture",
        description: "QUANTUM_DOGE_AI emerged from the depths of the internet, where artificial intelligence and meme culture collided in an epic fusion of technology and humor.",
        origin: "Generated by Mind9 AI system through advanced market analysis and neural network optimization.",
        memeReferences: [
          "Doge",
          "Neural Networks",
          "To the Moon",
          "Diamond Hands",
          "This is Fine"
        ]
      },
      socialLinks: {
        twitter: 'https://twitter.com/mind9ai',
        telegram: 'https://t.me/mind9ai',
        discord: 'https://discord.gg/mind9ai'
      }
    };
  }

  getMarketAnalysis() {
    return this.marketAnalyzer.getMarketCondition();
  }

  getTrendingTokens() {
    return this.marketAnalyzer.getTrendingTokens();
  }

  async getLuckyWalletInfo(): Promise<{
    address: string;
    lockedAmount: number;
    tradableAmount: number;
    unlockTime: number;
    remainingLockTime: number;
  } | null> {
    if (!this.currentLuckyWallet) {
      return null;
    }

    const remainingLockTime = await this.luckyWalletManager.getRemainingLockTime(
      this.currentLuckyWallet
    );

    const balance = await this.luckyWalletManager.getTokenBalance(
      new PublicKey(this.currentLuckyWallet.publicKey),
      new PublicKey(this.currentLuckyWallet.publicKey)
    );

    return {
      address: this.currentLuckyWallet.publicKey,
      lockedAmount: balance.locked,
      tradableAmount: balance.tradable,
      unlockTime: this.currentLuckyWallet.unlockTime,
      remainingLockTime
    };
  }
  
  getLaunchDate(): number {
    return this.launchDate;
  }
}