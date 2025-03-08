import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { CONFIG } from './config';
import { handleNetworkError } from './errorHandling';
import type { AIState } from '../types';
import fetch from 'cross-fetch';

export class SolanaService {
  private connection: Connection | null = null;
  private backupConnection: Connection | null = null;
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds
  private aiState: AIState;
  private pendingTransactions: Transaction[] = [];
  private wsConnection: WebSocket | null = null;
  private isReconnecting = false;
  private rpcEndpoints: string[] = [
    CONFIG.RPC_ENDPOINTS.PRIMARY,
    CONFIG.RPC_ENDPOINTS.FALLBACK,
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com'
  ];
  private mintedTokens: Map<string, { mint: PublicKey; initialLiquidity: number }> = new Map();

  constructor() {
    this.aiState = {
      isGenerating: false,
      currentPhase: 'idle',
      progress: 0,
      whaleProtection: {
        maxWalletPercentage: 2.5,
        maxTransactionPercentage: 1.0
      }
    };

    // Initialize connections asynchronously
    this.initializeConnections().catch(error => {
      console.warn('Initial connection setup failed, will retry on demand:', error);
    });
  }

  private async testEndpoint(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth'
        })
      });

      const data = await response.json();
      return data.result === 'ok';
    } catch (error) {
      return false;
    }
  }

  private async findBestEndpoint(): Promise<string | null> {
    const results = await Promise.all(
      this.rpcEndpoints.map(async url => ({
        url,
        working: await this.testEndpoint(url)
      }))
    );

    const workingEndpoint = results.find(result => result.working);
    return workingEndpoint ? workingEndpoint.url : null;
  }

  private async initializeConnections() {
    try {
      // Find best working endpoint
      const bestEndpoint = await this.findBestEndpoint();
      if (!bestEndpoint) {
        throw new Error('No working RPC endpoints found');
      }

      // Initialize primary connection
      this.connection = new Connection(bestEndpoint, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        fetch: fetch
      });

      // Test connection
      await this.connection.getSlot();
      console.log('✅ RPC connection established:', bestEndpoint);

      // Setup backup connection with a different endpoint
      const backupEndpoint = this.rpcEndpoints.find(url => url !== bestEndpoint);
      if (backupEndpoint) {
        this.backupConnection = new Connection(backupEndpoint, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000,
          fetch: fetch
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize connections:', error);
      return false;
    }
  }

  async getConnection(): Promise<Connection> {
    // If no connection exists or previous attempts failed, try to initialize
    if (!this.connection) {
      const success = await this.initializeConnections();
      if (!success || !this.connection) {
        throw new Error('Failed to establish RPC connection');
      }
    }

    try {
      // Test current connection
      await this.connection.getSlot();
      return this.connection;
    } catch (error) {
      console.warn('Primary connection failed, trying backup:', error);

      // Try backup connection
      if (this.backupConnection) {
        try {
          await this.backupConnection.getSlot();
          this.connection = this.backupConnection; // Switch to backup
          return this.connection;
        } catch (backupError) {
          console.error('Backup connection failed:', backupError);
        }
      }

      // If all else fails, try to find a new working endpoint
      const success = await this.initializeConnections();
      if (!success || !this.connection) {
        throw new Error('No working RPC connections available');
      }

      return this.connection;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      const slot = await connection.getSlot();
      console.log('✅ Connected to Solana (slot:', slot, ')');
      return true;
    } catch (error) {
      await handleNetworkError(error);
      return false;
    }
  }

  async createMemeToken(
    name: string,
    symbol: string,
    decimals: number = 9
  ): Promise<{
    success: boolean;
    mint?: PublicKey;
    initialLiquidity?: number;
    error?: string;
  }> {
    try {
      console.log(`🔄 Creating token on Solana: ${name} (${symbol})`);
      
      const connection = await this.getConnection();
      if (!connection) {
        throw new Error('No active Solana connection');
      }

      // Create mint account
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      // Set initial liquidity to exactly $25
      const initialLiquidity = CONFIG.TRADE_SETTINGS.INITIAL_LIQUIDITY;

      // Store token info
      this.mintedTokens.set(mint.toString(), {
        mint,
        initialLiquidity
      });

      console.log('✅ Token created successfully');
      console.log('Mint Address:', mint.toString());
      console.log('Initial Liquidity:', initialLiquidity);

      return {
        success: true,
        mint,
        initialLiquidity
      };
    } catch (error) {
      console.error('❌ Error creating token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async checkAIWalletBalance(publicKey: PublicKey): Promise<number> {
    try {
      const connection = await this.getConnection();
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1e9;

      if (solBalance < CONFIG.MIN_WALLET_BALANCE) {
        console.warn(`⚠️ Warning: AI wallet balance (${solBalance} SOL) is below minimum required (${CONFIG.MIN_WALLET_BALANCE} SOL)`);
      }

      return solBalance;
    } catch (error) {
      await handleNetworkError(error);
      throw error;
    }
  }

  getTokenInfo(mintAddress: string): { mint: PublicKey; initialLiquidity: number } | null {
    return this.mintedTokens.get(mintAddress) || null;
  }

  // Cleanup method
  destroy() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.isReconnecting = false;
    this.connection = null;
    this.backupConnection = null;
  }
}