import React, { useEffect, useState } from 'react';
import { AILog } from '../types';
import { Bot, LineChart, Lock, Rocket, AlertCircle, Wallet, TrendingUp } from 'lucide-react';

const INITIAL_LOGS: AILog[] = [
  {
    id: '1',
    timestamp: Date.now(),
    message: 'Mind9 AI System v2.0.0 initialized...',
    type: 'info'
  },
  {
    id: '2',
    timestamp: Date.now() + 1000,
    message: 'Market analysis system activated',
    type: 'success'
  }
];

const MARKET_ANALYSIS_LOGS = [
  'Scanning Solana network for emerging patterns...',
  'Analyzing social sentiment across platforms...',
  'Monitoring DEX liquidity trends...',
  'Evaluating market momentum indicators...',
  'Processing on-chain signals...',
  'Detecting market inefficiencies...',
  'Analyzing token creation patterns...',
  'Measuring social engagement metrics...',
  'Evaluating current market sentiment...',
  'Calculating optimal launch parameters...'
];

export function AILogs() {
  const [logs, setLogs] = useState<AILog[]>(INITIAL_LOGS);
  const [currentPhase, setCurrentPhase] = useState<'monitoring' | 'analyzing'>('monitoring');
  const [marketScore, setMarketScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Add random market analysis log
      const newLog: AILog = {
        id: Math.random().toString(),
        timestamp: Date.now(),
        message: MARKET_ANALYSIS_LOGS[Math.floor(Math.random() * MARKET_ANALYSIS_LOGS.length)],
        type: 'info'
      };
      
      setLogs(prev => [...prev.slice(-15), newLog]);

      // Randomly update market score
      setMarketScore(prev => {
        const change = (Math.random() - 0.5) * 0.1; // -0.05 to 0.05
        return Math.max(0, Math.min(1, prev + change));
      });

    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border border-green-500/30 rounded-lg p-4">
        <Bot className="text-green-500" size={24} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Market Analysis Status</h3>
            <span className="text-sm px-2 py-1 rounded bg-blue-500/20 text-blue-400">
              Analyzing Market
            </span>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${marketScore * 100}%` }}
              />
            </div>
            <div className="text-sm mt-1 text-green-500/75">
              Market Score: {Math.round(marketScore * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-500" />
            <span className="font-bold">Trend Analysis</span>
          </div>
          <div className="text-sm opacity-75">
            Monitoring market trends and social signals
          </div>
        </div>
        <div className="border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <LineChart size={16} className="text-green-500" />
            <span className="font-bold">Volume Analysis</span>
          </div>
          <div className="text-sm opacity-75">
            Tracking trading volume and liquidity
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="flex items-start gap-4 animate-fade-in">
            <span className="text-green-600 opacity-75 whitespace-nowrap">
              [{new Date(log.timestamp).toLocaleTimeString()}]
            </span>
            <div className="flex-1">
              <span className={
                log.type === 'success' 
                  ? 'text-green-400' 
                  : log.type === 'warning'
                  ? 'text-yellow-400'
                  : 'text-green-500'
              }>
                {log.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}