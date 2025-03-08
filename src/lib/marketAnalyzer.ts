import { Connection, PublicKey } from '@solana/web3.js';
import { AIService } from './openai';
import { CONFIG } from './config';

interface MarketTrend {
  symbol: string;
  volume24h: number;
  priceChange24h: number;
  socialScore: number;
  timestamp: number;
}

interface MarketCondition {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  topTrends: string[];
  volumeScore: number;
  socialScore: number;
  timestamp: number;
}

export class MarketAnalyzer {
  private connection: Connection | null = null;
  private ai: AIService;
  private marketTrends: MarketTrend[] = [];
  private lastAnalysis: MarketCondition | null = null;
  private static readonly ANALYSIS_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private static readonly TREND_THRESHOLD = 0.3; // 30% confidence threshold
  private static readonly MIN_VOLUME = 5000; // Minimum volume threshold

  constructor() {
    try {
      this.connection = new Connection(CONFIG.RPC_ENDPOINTS.PRIMARY);
    } catch (error) {
      console.warn('Failed to initialize Solana connection:', error);
    }
    
    this.ai = new AIService();
    this.startPeriodicAnalysis();
  }

  private startPeriodicAnalysis() {
    this.analyzeMarket(); // Initial analysis
    setInterval(() => this.analyzeMarket(), MarketAnalyzer.ANALYSIS_INTERVAL);
  }

  async analyzeMarket(): Promise<MarketCondition> {
    try {
      console.log('🔄 Analyzing market conditions...');

      // Get trending tokens from Solana
      const trendingTokens = await this.getTrendingTokens();

      // Analyze social sentiment
      const sentiment = await this.ai.analyzeSentiment();

      // Analyze trending topics
      const trends = await this.ai.analyzeTrendingTopics();

      // Calculate volume score
      const volumeScore = this.calculateVolumeScore(trendingTokens);

      // Calculate social score
      const socialScore = this.calculateSocialScore(trends);

      const marketCondition: MarketCondition = {
        overallSentiment: sentiment.sentiment as 'bullish' | 'bearish' | 'neutral',
        confidence: sentiment.confidence,
        topTrends: trends.slice(0, 5),
        volumeScore,
        socialScore,
        timestamp: Date.now()
      };

      this.lastAnalysis = marketCondition;
      this.logAnalysis(marketCondition);

      return marketCondition;
    } catch (error) {
      console.error('❌ Error analyzing market:', error);
      
      // Return default market condition if analysis fails
      const defaultCondition: MarketCondition = {
        overallSentiment: 'neutral',
        confidence: 0.5,
        topTrends: ['AI Integration', 'Meme Culture', 'DeFi Innovation'],
        volumeScore: 0.6,
        socialScore: 0.7,
        timestamp: Date.now()
      };
      
      this.lastAnalysis = defaultCondition;
      return defaultCondition;
    }
  }

  private async getTrendingTokens(): Promise<MarketTrend[]> {
    try {
      // This would normally fetch from a Solana RPC endpoint
      // For now, we'll simulate trending tokens
      const mockTrends: MarketTrend[] = [
        {
          symbol: 'BONK',
          volume24h: 150000,
          priceChange24h: 25.5,
          socialScore: 0.85,
          timestamp: Date.now()
        },
        {
          symbol: 'WIF',
          volume24h: 80000,
          priceChange24h: 15.2,
          socialScore: 0.75,
          timestamp: Date.now()
        }
      ];

      this.marketTrends = mockTrends;
      return mockTrends;
    } catch (error) {
      console.error('❌ Error fetching trending tokens:', error);
      return [];
    }
  }

  private calculateVolumeScore(trends: MarketTrend[]): number {
    if (trends.length === 0) return 0;

    const totalVolume = trends.reduce((sum, trend) => sum + trend.volume24h, 0);
    const averageVolume = totalVolume / trends.length;

    return Math.min(1, averageVolume / MarketAnalyzer.MIN_VOLUME);
  }

  private calculateSocialScore(trends: string[]): number {
    return Math.min(1, trends.length / 10); // Normalize to 0-1 range
  }

  private logAnalysis(condition: MarketCondition) {
    console.log('📊 Market Analysis Results:');
    console.log(`Sentiment: ${condition.overallSentiment.toUpperCase()} (${Math.round(condition.confidence * 100)}% confidence)`);
    console.log('Top Trends:', condition.topTrends.join(', '));
    console.log(`Volume Score: ${Math.round(condition.volumeScore * 100)}%`);
    console.log(`Social Score: ${Math.round(condition.socialScore * 100)}%`);
  }

  isOptimalLaunchTime(): boolean {
    if (!this.lastAnalysis) return false;

    const {
      overallSentiment,
      confidence,
      volumeScore,
      socialScore
    } = this.lastAnalysis;

    // Calculate overall market score
    const sentimentScore = overallSentiment === 'bullish' ? confidence : 0;
    const overallScore = (sentimentScore + volumeScore + socialScore) / 3;

    return overallScore >= MarketAnalyzer.TREND_THRESHOLD;
  }

  getMarketCondition(): MarketCondition | null {
    return this.lastAnalysis;
  }

  getTrendingTokens(): MarketTrend[] {
    return this.marketTrends;
  }
}