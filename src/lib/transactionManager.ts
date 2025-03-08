import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { CONFIG } from './config';
import type { 
  TransactionRequest, 
  TransactionBatch, 
  WalletActivity 
} from '../types';

export class TransactionManager {
  private connection: Connection;
  private pendingTransactions: TransactionRequest[] = [];
  private processingBatch: TransactionBatch | null = null;
  private walletActivity: Map<string, WalletActivity> = new Map();
  
  private static readonly BATCH_INTERVAL = 5000; // 5 seconds
  private static readonly MAX_BATCH_SIZE = 50;
  private static readonly MIN_TRANSACTION_DELAY = 2000; // 2 seconds
  private static readonly RAPID_TRANSACTION_THRESHOLD = 3;
  private static readonly RAPID_TRANSACTION_WINDOW = 60000; // 1 minute
  private static readonly HIGH_RISK_THRESHOLD = 0.8;

  constructor() {
    this.connection = new Connection(CONFIG.RPC_ENDPOINTS.PRIMARY);
    this.startBatchProcessing();
  }

  private startBatchProcessing() {
    setInterval(() => this.processBatch(), this.constructor.BATCH_INTERVAL);
  }

  async queueTransaction(request: Omit<TransactionRequest, 'id' | 'timestamp' | 'priority'>): Promise<string> {
    try {
      // Generate transaction ID
      const id = Math.random().toString(36).substring(2);
      
      // Create full transaction request
      const transaction: TransactionRequest = {
        ...request,
        id,
        timestamp: Date.now(),
        priority: this.calculatePriority(request.walletAddress)
      };

      // Check for front-running patterns
      if (await this.isFrontRunningAttempt(transaction)) {
        throw new Error('Potential front-running attempt detected');
      }

      // Update wallet activity
      await this.updateWalletActivity(transaction);

      // Add to pending queue
      this.pendingTransactions.push(transaction);
      
      console.log('📝 Transaction queued:', {
        id,
        type: transaction.type,
        amount: transaction.amount
      });

      return id;
    } catch (error) {
      console.error('❌ Error queueing transaction:', error);
      throw error;
    }
  }

  private async isFrontRunningAttempt(transaction: TransactionRequest): Promise<boolean> {
    const activity = this.walletActivity.get(transaction.walletAddress);
    if (!activity) return false;

    // Check for rapid transaction patterns
    const isRapidTransaction = 
      Date.now() - activity.transactions.lastTransaction < 
      this.constructor.MIN_TRANSACTION_DELAY;

    // Check transaction volume relative to pool size
    const poolInfo = await this.getPoolInfo(transaction.tokenAddress);
    const volumeRatio = transaction.amount / poolInfo.volume24h;
    const isLargeVolume = volumeRatio > 0.1; // More than 10% of daily volume

    // Check gas price manipulation
    const isHighGas = transaction.gasPrice > poolInfo.averageGasPrice * 1.5;

    // Calculate risk score
    const riskScore = this.calculateRiskScore({
      isRapidTransaction,
      isLargeVolume,
      isHighGas,
      patterns: activity.patterns
    });

    return riskScore > this.constructor.HIGH_RISK_THRESHOLD;
  }

  private async getPoolInfo(tokenAddress: string): Promise<{
    volume24h: number;
    averageGasPrice: number;
  }> {
    // Implementation would fetch actual pool data
    return {
      volume24h: 1000000,
      averageGasPrice: 10
    };
  }

  private calculateRiskScore(factors: {
    isRapidTransaction: boolean;
    isLargeVolume: boolean;
    isHighGas: boolean;
    patterns: WalletActivity['patterns'];
  }): number {
    const weights = {
      rapidTransaction: 0.3,
      largeVolume: 0.2,
      highGas: 0.2,
      historicalPatterns: 0.3
    };

    let score = 0;

    if (factors.isRapidTransaction) score += weights.rapidTransaction;
    if (factors.isLargeVolume) score += weights.largeVolume;
    if (factors.isHighGas) score += weights.highGas;

    // Historical pattern score
    const patternScore = 
      (factors.patterns.frontRunAttempts * 0.5 +
       factors.patterns.rapidBuys * 0.3 +
       factors.patterns.rapidSells * 0.2) / 10;

    score += patternScore * weights.historicalPatterns;

    return Math.min(1, score);
  }

  private async updateWalletActivity(transaction: TransactionRequest) {
    const activity = this.walletActivity.get(transaction.walletAddress) || {
      address: transaction.walletAddress,
      transactions: {
        count: 0,
        volume: 0,
        lastTransaction: 0
      },
      patterns: {
        rapidBuys: 0,
        rapidSells: 0,
        frontRunAttempts: 0
      },
      riskScore: 0,
      lastUpdated: Date.now()
    };

    // Update transaction metrics
    activity.transactions.count++;
    activity.transactions.volume += transaction.amount;
    
    // Check for rapid transactions
    const timeSinceLastTx = Date.now() - activity.transactions.lastTransaction;
    if (timeSinceLastTx < this.constructor.RAPID_TRANSACTION_WINDOW) {
      if (transaction.type === 'buy') {
        activity.patterns.rapidBuys++;
      } else {
        activity.patterns.rapidSells++;
      }
    }

    // Update last transaction timestamp
    activity.transactions.lastTransaction = Date.now();
    
    // Update risk score
    activity.riskScore = await this.calculateWalletRiskScore(activity);
    
    // Store updated activity
    this.walletActivity.set(transaction.walletAddress, activity);
  }

  private async calculateWalletRiskScore(activity: WalletActivity): Promise<number> {
    const {
      transactions,
      patterns
    } = activity;

    // Calculate base risk from transaction patterns
    const patternRisk = 
      (patterns.rapidBuys + patterns.rapidSells) / 
      this.constructor.RAPID_TRANSACTION_THRESHOLD;

    // Calculate volume risk
    const volumeRisk = Math.min(1, transactions.volume / 1000000); // Example threshold

    // Combine risk factors
    return Math.min(1, (patternRisk * 0.7) + (volumeRisk * 0.3));
  }

  private calculatePriority(walletAddress: string): number {
    const activity = this.walletActivity.get(walletAddress);
    if (!activity) return 1;

    // Lower priority for high-risk wallets
    return Math.max(0.1, 1 - activity.riskScore);
  }

  private async processBatch() {
    if (this.pendingTransactions.length === 0) return;

    try {
      // Sort transactions by priority and timestamp
      const sortedTransactions = [...this.pendingTransactions].sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Older first
      });

      // Create batch
      const batchSize = Math.min(
        this.constructor.MAX_BATCH_SIZE,
        sortedTransactions.length
      );
      
      const batch: TransactionBatch = {
        id: Math.random().toString(36).substring(2),
        transactions: sortedTransactions.slice(0, batchSize),
        timestamp: Date.now(),
        status: 'processing',
        totalValue: sortedTransactions
          .slice(0, batchSize)
          .reduce((sum, tx) => sum + tx.amount, 0)
      };

      // Remove batch transactions from pending queue
      this.pendingTransactions = sortedTransactions.slice(batchSize);

      // Process batch
      await this.executeBatch(batch);
    } catch (error) {
      console.error('❌ Error processing transaction batch:', error);
    }
  }

  private async executeBatch(batch: TransactionBatch) {
    try {
      console.log('🔄 Processing transaction batch:', {
        id: batch.id,
        size: batch.transactions.length,
        totalValue: batch.totalValue
      });

      // Process transactions with delay between each
      for (const tx of batch.transactions) {
        await this.executeTransaction(tx);
        await this.delay(this.constructor.MIN_TRANSACTION_DELAY);
      }

      console.log('✅ Batch processed successfully:', batch.id);
    } catch (error) {
      console.error('❌ Error executing batch:', error);
      // Return failed transactions to pending queue
      this.pendingTransactions.unshift(...batch.transactions);
    }
  }

  private async executeTransaction(tx: TransactionRequest) {
    try {
      // Implementation would execute the actual transaction
      console.log('📝 Executing transaction:', tx.id);
      
      // Simulate transaction execution
      await this.delay(1000);
      
      console.log('✅ Transaction executed:', tx.id);
    } catch (error) {
      console.error('❌ Error executing transaction:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getTransactionStatus(id: string): {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    position?: number;
  } {
    // Check pending transactions
    const pendingIndex = this.pendingTransactions.findIndex(tx => tx.id === id);
    if (pendingIndex !== -1) {
      return {
        status: 'pending',
        position: pendingIndex + 1
      };
    }

    // Check processing batch
    if (this.processingBatch?.transactions.some(tx => tx.id === id)) {
      return { status: 'processing' };
    }

    // Assume completed if not found
    return { status: 'completed' };
  }

  getWalletActivity(address: string): WalletActivity | null {
    return this.walletActivity.get(address) || null;
  }
}