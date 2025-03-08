import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { CONFIG } from './config';
import type { LuckyWallet, ReferralScore, SocialEngagement } from '../types';

export class LuckyWalletManager {
  private connection: Connection;
  private referralScores: Map<string, ReferralScore> = new Map();
  private static readonly LIQUIDITY_SHARE = 0.03; // 3% of liquidity
  private static readonly LOCKED_RATIO = 0.70; // 70% locked
  private static readonly TRADABLE_RATIO = 0.30; // 30% tradable
  private static readonly LOCK_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private static readonly DEVNET_RPC_URL = 'https://api.devnet.solana.com';
  private static readonly SOCIAL_BOOST_MULTIPLIER = 2.5; // 2.5x chance for active social users
  private static readonly MIN_ENGAGEMENT_THRESHOLD = 10; // Minimum engagement score
  private static readonly ENGAGEMENT_DECAY = 0.8; // 20% decay per day

  constructor() {
    this.connection = new Connection(LuckyWalletManager.DEVNET_RPC_URL, 'confirmed');
  }

  async trackSocialShare(
    walletAddress: string,
    twitterUsername: string,
    shareUrl: string
  ): Promise<void> {
    try {
      console.log('📊 Tracking social share for wallet:', walletAddress);
      
      // Get or create referral score
      let referralScore = this.referralScores.get(walletAddress) || {
        walletAddress,
        twitterUsername,
        engagement: {
          twitterShares: 0,
          twitterLikes: 0,
          twitterRetweets: 0,
          totalEngagement: 0,
          lastShare: 0,
          shareUrls: []
        },
        score: 0,
        lastUpdated: Date.now()
      };

      // Update engagement metrics
      referralScore.engagement.twitterShares++;
      referralScore.engagement.lastShare = Date.now();
      referralScore.engagement.shareUrls.push(shareUrl);
      
      // Calculate new score
      referralScore.score = this.calculateReferralScore(referralScore.engagement);
      referralScore.lastUpdated = Date.now();

      // Store updated score
      this.referralScores.set(walletAddress, referralScore);

      console.log('✅ Social share tracked successfully');
    } catch (error) {
      console.error('❌ Error tracking social share:', error);
      throw error;
    }
  }

  async updateEngagementMetrics(
    walletAddress: string,
    metrics: Partial<SocialEngagement>
  ): Promise<void> {
    const referralScore = this.referralScores.get(walletAddress);
    if (!referralScore) return;

    // Update engagement metrics
    referralScore.engagement = {
      ...referralScore.engagement,
      ...metrics,
      totalEngagement: this.calculateTotalEngagement({
        ...referralScore.engagement,
        ...metrics
      })
    };

    // Recalculate score
    referralScore.score = this.calculateReferralScore(referralScore.engagement);
    referralScore.lastUpdated = Date.now();

    this.referralScores.set(walletAddress, referralScore);
  }

  private calculateTotalEngagement(engagement: SocialEngagement): number {
    return (
      engagement.twitterShares * 3 +
      engagement.twitterLikes +
      engagement.twitterRetweets * 2
    );
  }

  private calculateReferralScore(engagement: SocialEngagement): number {
    const now = Date.now();
    const daysSinceLastShare = (now - engagement.lastShare) / (24 * 60 * 60 * 1000);
    
    // Apply time decay to engagement
    const decayedEngagement = engagement.totalEngagement * 
      Math.pow(this.constructor.ENGAGEMENT_DECAY, daysSinceLastShare);
    
    // Calculate base score
    let score = decayedEngagement / this.constructor.MIN_ENGAGEMENT_THRESHOLD;
    
    // Cap score at SOCIAL_BOOST_MULTIPLIER
    return Math.min(score, this.constructor.SOCIAL_BOOST_MULTIPLIER);
  }

  async selectLuckyWallet(): Promise<LuckyWallet> {
    try {
      console.log('🎲 Selecting lucky wallet...');
      
      // Get all referral scores
      const scores = Array.from(this.referralScores.values());
      
      // Apply social engagement boost to selection probability
      const totalScore = scores.reduce((sum, { score }) => sum + score, 0);
      const random = Math.random() * (totalScore + 1); // +1 for users without referrals
      
      let selectedWallet: string | null = null;
      let currentSum = 0;
      
      // Weighted random selection
      for (const { walletAddress, score } of scores) {
        currentSum += score;
        if (random <= currentSum) {
          selectedWallet = walletAddress;
          break;
        }
      }
      
      // Generate new wallet if no referral selected
      const luckyWallet = selectedWallet 
        ? Keypair.fromSeed(new PublicKey(selectedWallet).toBytes()) 
        : Keypair.generate();

      console.log('✨ Lucky wallet selected:', luckyWallet.publicKey.toString());

      return {
        keypair: luckyWallet,
        publicKey: luckyWallet.publicKey.toString(),
        lockDuration: this.constructor.LOCK_DURATION,
        lockedRatio: this.constructor.LOCKED_RATIO,
        tradableRatio: this.constructor.TRADABLE_RATIO,
        liquidityShare: this.constructor.LIQUIDITY_SHARE,
        selectedAt: Date.now(),
        unlockTime: Date.now() + this.constructor.LOCK_DURATION
      };
    } catch (error) {
      console.error('❌ Error selecting lucky wallet:', error);
      throw error;
    }
  }

  async distributeLuckyTokens(
    tokenMint: PublicKey,
    luckyWallet: LuckyWallet,
    totalSupply: number
  ): Promise<boolean> {
    try {
      console.log('🎁 Distributing tokens to lucky wallet...');
      
      // Calculate token amounts
      const luckyShare = totalSupply * this.constructor.LIQUIDITY_SHARE;
      const lockedAmount = luckyShare * this.constructor.LOCKED_RATIO;
      const tradableAmount = luckyShare * this.constructor.TRADABLE_RATIO;

      // Create token accounts for locked and tradable portions
      const lockedAccount = await splToken.createAccount(
        this.connection,
        luckyWallet.keypair,
        tokenMint,
        luckyWallet.keypair.publicKey
      );

      const tradableAccount = await splToken.createAccount(
        this.connection,
        luckyWallet.keypair,
        tokenMint,
        luckyWallet.keypair.publicKey
      );

      // Transfer tokens to locked account
      await splToken.mintTo(
        this.connection,
        luckyWallet.keypair,
        tokenMint,
        lockedAccount,
        luckyWallet.keypair,
        lockedAmount
      );

      // Transfer tokens to tradable account
      await splToken.mintTo(
        this.connection,
        luckyWallet.keypair,
        tokenMint,
        tradableAccount,
        luckyWallet.keypair,
        tradableAmount
      );

      console.log('✅ Lucky wallet token distribution complete:', {
        lockedAmount,
        tradableAmount,
        unlockTime: new Date(luckyWallet.unlockTime).toLocaleString()
      });

      return true;
    } catch (error) {
      console.error('❌ Error distributing lucky tokens:', error);
      return false;
    }
  }

  async isLocked(luckyWallet: LuckyWallet): Promise<boolean> {
    return Date.now() < luckyWallet.unlockTime;
  }

  async getRemainingLockTime(luckyWallet: LuckyWallet): Promise<number> {
    const now = Date.now();
    return Math.max(0, luckyWallet.unlockTime - now);
  }

  async getTokenBalance(
    tokenMint: PublicKey,
    walletPublicKey: PublicKey
  ): Promise<{ locked: number; tradable: number }> {
    try {
      const accounts = await this.connection.getTokenAccountsByOwner(
        walletPublicKey,
        { mint: tokenMint }
      );

      let locked = 0;
      let tradable = 0;

      for (const { pubkey } of accounts.value) {
        const balance = await splToken.getAccount(
          this.connection,
          pubkey
        );
        
        // First account is locked, second is tradable
        if (locked === 0) {
          locked = Number(balance.amount);
        } else {
          tradable = Number(balance.amount);
        }
      }

      return { locked, tradable };
    } catch (error) {
      console.error('❌ Error getting token balance:', error);
      return { locked: 0, tradable: 0 };
    }
  }

  getReferralScore(walletAddress: string): ReferralScore | null {
    return this.referralScores.get(walletAddress) || null;
  }

  getAllReferralScores(): ReferralScore[] {
    return Array.from(this.referralScores.values());
  }
}