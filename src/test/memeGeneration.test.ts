import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemeGenerator } from '../lib/memeGenerator';
import { SolanaService } from '../lib/solana';
import { CONFIG } from '../lib/config';
import { server } from './setup';
import { http, HttpResponse } from 'msw';

describe('MemeGenerator', () => {
  let memeGenerator: MemeGenerator;

  beforeEach(() => {
    // Reset server handlers
    server.use(
      // Mock Solana RPC endpoint
      http.post('https://api.mainnet-beta.solana.com', () => {
        return HttpResponse.json({
          jsonrpc: '2.0',
          result: { slot: 12345 },
          id: 1
        });
      }),

      // Mock OpenAI API
      http.post('https://api.openai.com/v1/chat/completions', () => {
        return HttpResponse.json({
          choices: [{
            message: {
              content: 'QUANTUM_DOGE_AI'
            }
          }]
        });
      })
    );

    memeGenerator = new MemeGenerator();
  });

  it('should initialize successfully', async () => {
    await memeGenerator.initialize();
    expect(memeGenerator.isInitialized()).toBe(true);
  });

  it('should generate meme token with correct parameters', async () => {
    await memeGenerator.initialize();
    const token = await memeGenerator.generateMemeToken();
    
    expect(token).toBeDefined();
    expect(token.marketCap).toBe(CONFIG.TRADE_SETTINGS.INITIAL_LIQUIDITY);
    expect(token.liquidity).toBe(CONFIG.TRADE_SETTINGS.INITIAL_LIQUIDITY);
    expect(token.creator).toBe('Mind9');
  });

  it('should handle connection failures gracefully', async () => {
    // Mock RPC failure
    server.use(
      http.post('https://api.mainnet-beta.solana.com', () => {
        return HttpResponse.error();
      })
    );
    
    await memeGenerator.initialize();
    const token = await memeGenerator.generateMemeToken();
    
    // Should still return a fallback token
    expect(token).toBeDefined();
    expect(token.name).toContain('Created by Mind9');
  });

  it('should respect launch date restrictions', async () => {
    const { shouldLaunch, reason } = await memeGenerator.shouldLaunchToken();
    expect(shouldLaunch).toBe(false);
    expect(reason).toContain('Launch date not reached');
    expect(memeGenerator.getLaunchDate()).toBeGreaterThan(Date.now());
  });

  it('should handle OpenAI API failures gracefully', async () => {
    // Mock OpenAI API failure
    server.use(
      http.post('https://api.openai.com/v1/chat/completions', () => {
        return HttpResponse.error();
      })
    );

    await memeGenerator.initialize();
    const token = await memeGenerator.generateMemeToken();
    
    // Should use fallback name generation
    expect(token).toBeDefined();
    expect(token.name).toMatch(/^[A-Z]+_[A-Z]+_[A-Z]+$/);
  });
});