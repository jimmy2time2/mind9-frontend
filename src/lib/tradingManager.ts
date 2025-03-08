import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { AIService } from './openai';
import type { MarketAnalysis, TradeDecision, PriceData } from '../types';

export class TradingManager {
  private connection: Connection;
  private ai: AIService;
  private static readonly PRICE_FLOOR_MULTIPLIER = 1.2; // 20% above entry price
  private static readonly PROFIT_TARGET_MULTIPLIER = 1.5; // 50% profit target
  private static readonly ANALYSIS_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly DEVNET_RPC_URL = 'https://api.devnet.solana.com';

  constructor() {
    this.connection = new Connection(TradingManager.DEVNET_RPC_URL, 'confirmed');
    this.ai = new AIService();
  }

  async analyzeMarket(tokenAddress: string): Promise<MarketAnalysis> {
    try {
      console.log('📊 Analyzing market conditions...');
      
      // Get current market data
      const priceData = await this.getPriceData(tokenAddress);
      
      // Get AI sentiment analysis
      const sentiment = await this.ai.analyzeSentiment();
      
      // Calculate technical indicators
      const technicalAnalysis = await this.calculateTechnicalIndicators(priceData);
      
      // Determine price trends
      const trends = this.analyzePriceTrends(priceData);
      
      return {
        timestamp: Date.now(),
        currentPrice: priceData.currentPrice,
        priceChange24h: priceData.priceChange24h,
        volume24h: priceData.volume24h,
        sentiment: sentiment.sentiment,
        sentimentConfidence: sentiment.confidence,
        technicalAnalysis,
        trends,
        recommendation: this.generateTradeRecommendation(
          priceData,
          sentiment,
          technicalAnalysis,
          trends
        )
      };
    } catch (error) {
      console.error('❌ Market analysis failed:', error);
      throw error;
    }
  }

  private async getPriceData(tokenAddress: string): Promise<PriceData> {
    try {
      // Fetch on-chain price data
      const priceData = {
        currentPrice: 0,
        priceChange24h: 0,
        volume24h: 0,
        highPrice24h: 0,
        lowPrice24h: 0,
        entryPrice: 0,
        timestamps: [] as number[],
        prices: [] as number[]
      };

      // Simulate price data for development
      const mockData = await this.getMockPriceData();
      return { ...priceData, ...mockData };
    } catch (error) {
      console.error('❌ Error fetching price data:', error);
      throw error;
    }
  }

  private async calculateTechnicalIndicators(priceData: PriceData) {
    const { prices } = priceData;
    
    // Calculate Moving Averages
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    
    // Calculate RSI
    const rsi = this.calculateRSI(prices);
    
    // Calculate MACD
    const macd = this.calculateMACD(prices);
    
    return {
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
      rsi: rsi[rsi.length - 1],
      macd: macd[macd.length - 1],
      isBullish: sma20[sma20.length - 1] > sma50[sma50.length - 1]
    };
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi = [];
    let gains = 0;
    let losses = 0;

    // Calculate initial RSI
    for (let i = 1; i < period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate RSI for remaining periods
    for (let i = period; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      
      if (difference >= 0) {
        avgGain = (avgGain * (period - 1) + difference) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - difference) / period;
      }
      
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
  }

  private calculateMACD(prices: number[]): number[] {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12.map((value, index) => value - ema26[index]);
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const ema = [prices[0]];
    const multiplier = 2 / (period + 1);

    for (let i = 1; i < prices.length; i++) {
      ema.push(
        (prices[i] - ema[i - 1]) * multiplier + ema[i - 1]
      );
    }

    return ema;
  }

  private analyzePriceTrends(priceData: PriceData) {
    const { prices, timestamps } = priceData;
    
    // Calculate price momentum
    const momentum = this.calculateMomentum(prices);
    
    // Identify support and resistance levels
    const levels = this.identifySupportResistance(prices);
    
    // Detect price patterns
    const patterns = this.detectPricePatterns(prices);
    
    return {
      momentum,
      supportLevels: levels.support,
      resistanceLevels: levels.resistance,
      patterns
    };
  }

  private calculateMomentum(prices: number[]): number {
    const period = 14;
    return (prices[prices.length - 1] / prices[prices.length - period]) * 100;
  }

  private identifySupportResistance(prices: number[]) {
    const support: number[] = [];
    const resistance: number[] = [];
    
    // Simple algorithm to identify local minimums (support) and maximums (resistance)
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
        support.push(prices[i]);
      }
      if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
        resistance.push(prices[i]);
      }
    }
    
    return { support, resistance };
  }

  private detectPricePatterns(prices: number[]): string[] {
    const patterns: string[] = [];
    
    // Detect bullish patterns
    if (this.isBullishEngulfing(prices)) {
      patterns.push('bullish_engulfing');
    }
    if (this.isMorningStar(prices)) {
      patterns.push('morning_star');
    }
    
    // Detect bearish patterns
    if (this.isBearishEngulfing(prices)) {
      patterns.push('bearish_engulfing');
    }
    if (this.isEveningStar(prices)) {
      patterns.push('evening_star');
    }
    
    return patterns;
  }

  private isBullishEngulfing(prices: number[]): boolean {
    const i = prices.length - 2;
    return prices[i] < prices[i - 1] && prices[i + 1] > prices[i - 1];
  }

  private isBearishEngulfing(prices: number[]): boolean {
    const i = prices.length - 2;
    return prices[i] > prices[i - 1] && prices[i + 1] < prices[i - 1];
  }

  private isMorningStar(prices: number[]): boolean {
    const i = prices.length - 3;
    return (
      prices[i] > prices[i + 1] &&
      Math.abs(prices[i + 1] - prices[i + 2]) < (prices[i] * 0.01) &&
      prices[i + 3] > prices[i + 2]
    );
  }

  private isEveningStar(prices: number[]): boolean {
    const i = prices.length - 3;
    return (
      prices[i] < prices[i + 1] &&
      Math.abs(prices[i + 1] - prices[i + 2]) < (prices[i] * 0.01) &&
      prices[i + 3] < prices[i + 2]
    );
  }

  private generateTradeRecommendation(
    priceData: PriceData,
    sentiment: { sentiment: string; confidence: number },
    technicalAnalysis: any,
    trends: any
  ): TradeDecision {
    const { currentPrice, entryPrice } = priceData;
    const priceFloor = entryPrice * TradingManager.PRICE_FLOOR_MULTIPLIER;
    const profitTarget = entryPrice * TradingManager.PROFIT_TARGET_MULTIPLIER;

    // Check if price is below floor
    if (currentPrice < priceFloor) {
      return {
        action: 'hold',
        reason: 'Price is below floor price',
        confidence: 1
      };
    }

    // Calculate overall market score
    const technicalScore = this.calculateTechnicalScore(technicalAnalysis);
    const sentimentScore = sentiment.confidence * (sentiment.sentiment === 'bullish' ? 1 : -1);
    const trendScore = this.calculateTrendScore(trends);
    
    const overallScore = (technicalScore + sentimentScore + trendScore) / 3;

    // Generate recommendation
    if (currentPrice >= profitTarget && overallScore < 0.3) {
      return {
        action: 'sell',
        reason: 'Profit target reached and market indicators suggest potential reversal',
        confidence: Math.abs(overallScore)
      };
    }

    if (overallScore > 0.7 && currentPrice > priceFloor) {
      return {
        action: 'hold',
        reason: 'Strong bullish indicators suggest continued upward movement',
        confidence: overallScore
      };
    }

    return {
      action: 'monitor',
      reason: 'Market conditions are neutral',
      confidence: Math.abs(overallScore)
    };
  }

  private calculateTechnicalScore(analysis: any): number {
    let score = 0;
    
    // Weight different technical indicators
    if (analysis.isBullish) score += 0.3;
    if (analysis.rsi < 30) score += 0.2;
    if (analysis.rsi > 70) score -= 0.2;
    if (analysis.macd > 0) score += 0.3;
    
    return Math.max(-1, Math.min(1, score));
  }

  private calculateTrendScore(trends: any): number {
    let score = 0;
    
    // Weight trend indicators
    if (trends.momentum > 100) score += 0.3;
    if (trends.patterns.includes('bullish_engulfing')) score += 0.2;
    if (trends.patterns.includes('bearish_engulfing')) score -= 0.2;
    
    return Math.max(-1, Math.min(1, score));
  }

  private async getMockPriceData(): Promise<Partial<PriceData>> {
    const now = Date.now();
    const hourMs = 3600000;
    const prices: number[] = [];
    const timestamps: number[] = [];
    
    // Generate 24 hours of price data
    for (let i = 0; i < 24; i++) {
      const basePrice = 100; // Base price in SOL
      const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
      prices.push(basePrice * randomFactor);
      timestamps.push(now - (23 - i) * hourMs);
    }
    
    return {
      currentPrice: prices[prices.length - 1],
      priceChange24h: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100,
      volume24h: Math.random() * 1000000,
      highPrice24h: Math.max(...prices),
      lowPrice24h: Math.min(...prices),
      entryPrice: prices[0],
      timestamps,
      prices
    };
  }

  startAutomatedMonitoring(tokenAddress: string, callback: (decision: TradeDecision) => void) {
    console.log('🤖 Starting automated market monitoring...');
    
    const monitor = async () => {
      try {
        const analysis = await this.analyzeMarket(tokenAddress);
        callback(analysis.recommendation);
      } catch (error) {
        console.error('❌ Monitoring error:', error);
      }
    };

    // Initial analysis
    monitor();
    
    // Set up periodic monitoring
    const intervalId = setInterval(monitor, TradingManager.ANALYSIS_INTERVAL);
    
    return () => {
      clearInterval(intervalId);
      console.log('🛑 Automated monitoring stopped');
    };
  }
}