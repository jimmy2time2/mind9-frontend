import { Connection } from '@solana/web3.js';
import { CONFIG } from './config';

async function testSolanaConnection() {
  try {
    // Initialize connection with QuickNode RPC URL
    const connection = new Connection(CONFIG.RPC_ENDPOINTS.PRIMARY, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });

    // Get current slot
    const slot = await connection.getSlot();
    console.log('✅ Connected to Solana mainnet');
    console.log('Current slot:', slot);

    // Get recent performance samples
    const perfSamples = await connection.getRecentPerformanceSamples(1);
    if (perfSamples.length > 0) {
      console.log('Recent TPS:', perfSamples[0].numTransactions / perfSamples[0].samplePeriodSecs);
    }

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    console.log('Latest blockhash:', blockhash);
    console.log('Last valid block height:', lastValidBlockHeight);

    // Get cluster nodes info
    const nodes = await connection.getClusterNodes();
    console.log('Connected to', nodes.length, 'cluster nodes');

    // Get supply info
    const supply = await connection.getSupply();
    console.log('Total SOL supply:', supply.value.total / 1e9, 'SOL');

    return {
      success: true,
      slot,
      blockhash,
      lastValidBlockHeight,
      nodeCount: nodes.length,
      totalSupply: supply.value.total / 1e9
    };
  } catch (error) {
    console.error('❌ Failed to connect to Solana:', error);
    
    // Try backup RPC
    try {
      console.log('⚠️ Trying backup RPC...');
      const backupConnection = new Connection(CONFIG.RPC_ENDPOINTS.FALLBACK);
      const slot = await backupConnection.getSlot();
      
      console.log('✅ Connected to backup RPC');
      console.log('Current slot:', slot);
      
      return {
        success: true,
        slot,
        usingBackup: true
      };
    } catch (backupError) {
      console.error('❌ Backup RPC also failed:', backupError);
      
      // Try Alchemy fallback if both fail
      try {
        console.log('⚠️ Trying Alchemy fallback...');
        const alchemyConnection = new Connection('https://solana-mainnet.g.alchemy.com/v2/CTBR72OMPmOglwsG4MDgaFRpvzDjS8N6');
        const slot = await alchemyConnection.getSlot();
        
        console.log('✅ Connected to Alchemy');
        console.log('Current slot:', slot);
        
        return {
          success: true,
          slot,
          usingAlchemy: true
        };
      } catch (alchemyError) {
        console.error('❌ All RPC endpoints failed');
        return {
          success: false,
          error: 'All RPC endpoints failed to connect'
        };
      }
    }
  }
}

export { testSolanaConnection };