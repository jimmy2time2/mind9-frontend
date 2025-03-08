import React, { useState } from 'react';
import { generateMemeToken } from '../lib/api/memeGeneration';
import { LoadingState } from './LoadingState';
import type { MemeToken } from '../types';

interface TokenGenerationProps {
  onTokenCreated?: (token: MemeToken) => void;
}

export function TokenGeneration({ onTokenCreated }: TokenGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    solanaConnection: boolean;
    aiWalletBalance: number;
    liquidityPool: boolean;
  } | null>(null);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const result = await generateMemeToken();
      
      if (result.success && result.token) {
        onTokenCreated?.(result.token);
        setStatus(result.status || null);
      } else {
        setError(result.error || 'Failed to generate token');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {isGenerating ? (
        <LoadingState />
      ) : (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-bold disabled:opacity-50"
        >
          Generate Meme Token
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {status && (
        <div className="space-y-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span>Solana Connection</span>
            <span className={status.solanaConnection ? 'text-green-400' : 'text-red-400'}>
              {status.solanaConnection ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>AI Wallet Balance</span>
            <span className={status.aiWalletBalance >= 0.5 ? 'text-green-400' : 'text-yellow-400'}>
              {status.aiWalletBalance.toFixed(2)} SOL
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Liquidity Pool</span>
            <span className={status.liquidityPool ? 'text-green-400' : 'text-red-400'}>
              {status.liquidityPool ? '✓' : '✗'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}