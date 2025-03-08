import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { MemeToken } from '../types';

interface BuyNowButtonProps {
  token: MemeToken | null;
  isLoading?: boolean;
}

export function BuyNowButton({ token, isLoading = false }: BuyNowButtonProps) {
  if (isLoading) {
    return (
      <button 
        disabled
        className="bg-green-500/20 text-green-500 px-8 py-3 rounded-lg font-bold flex items-center gap-2 animate-pulse"
      >
        <div className="w-4 h-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        Initializing...
      </button>
    );
  }

  if (!token) {
    return (
      <button 
        disabled
        className="bg-green-500/20 text-green-500 px-8 py-3 rounded-lg font-bold flex items-center gap-2"
      >
        No Active Token
      </button>
    );
  }

  return (
    <a
      href={token.dexUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors group relative overflow-hidden"
    >
      <span className="relative z-10 flex items-center gap-2">
        Buy {token.symbol} Now
        <ExternalLink size={18} />
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}