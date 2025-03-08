import React from 'react';
import { Clock, Wallet, BarChart as ChartBar, AlertCircle } from 'lucide-react';
import { CONFIG } from '../lib/config';

export function TokenGrid() {
  // Calculate launch date based on CONFIG
  const launchDate = new Date(Date.now() + CONFIG.LAUNCH_SETTINGS.INITIAL_DELAY);
  const formattedDate = launchDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Calculate percentage of time passed
  const now = Date.now();
  const totalTime = CONFIG.LAUNCH_SETTINGS.INITIAL_DELAY;
  const timePassed = Math.max(0, now - (Date.now() - totalTime));
  const percentComplete = Math.min(100, Math.max(0, (timePassed / totalTime) * 100));

  return (
    <div className="space-y-6 mt-8">
      <div className="border border-green-500/30 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-400 mb-4">Pre-Launch Phase</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-green-400">Launch Window</h3>
                <p className="text-green-500/75 text-sm">
                  Estimated: {formattedDate}
                </p>
                <div className="mt-2 h-2 bg-green-500/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                <p className="text-xs text-green-500/50 mt-1">
                  {percentComplete.toFixed(0)}% to launch
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-green-400">Wallet Connection</h3>
                <p className="text-green-500/75 text-sm">
                  Connect now to be eligible for upcoming opportunities
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ChartBar className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-green-400">Market Analysis</h3>
                <p className="text-green-500/75 text-sm">
                  AI is analyzing market conditions and social sentiment
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-green-400">Important Notice</h3>
                <p className="text-green-500/75 text-sm">
                  First token launch will occur after thorough market analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border border-green-500/30 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-400 mb-4">Launch Strategy</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">1</div>
            <div>
              <h3 className="font-semibold text-green-400">Pre-Market Phase</h3>
              <p className="text-green-500/75 text-sm">
                Each token starts on our platform with $25 initial liquidity to create rarity and engagement
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">2</div>
            <div>
              <h3 className="font-semibold text-green-400">Bonding Curve Trading</h3>
              <p className="text-green-500/75 text-sm">
                Initial trading occurs on our platform using a bonding curve mechanism that ensures fair price discovery
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">3</div>
            <div>
              <h3 className="font-semibold text-green-400">DEX Migration</h3>
              <p className="text-green-500/75 text-sm">
                Once sufficient liquidity is reached, tokens automatically migrate to Solana DEXs with locked liquidity
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">4</div>
            <div>
              <h3 className="font-semibold text-green-400">Whale Protection</h3>
              <p className="text-green-500/75 text-sm">
                Maximum wallet holdings limited to 2.5% of supply to prevent market manipulation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}