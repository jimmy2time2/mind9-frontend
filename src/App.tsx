import React, { useState, useEffect } from 'react';
import { Terminal } from './components/Terminal';
import { AILogs } from './components/AILogs';
import { TokenGrid } from './components/TokenGrid';
import { BuyNowButton } from './components/BuyNowButton';
import { WalletConnect } from './components/WalletConnect';
import { ReferralSection } from './components/ReferralSection';
import { BondingCurveTrader } from './components/BondingCurveTrader';
import { TwitterDebug } from './components/TwitterDebug';
import { MemeGenerator } from './lib/memeGenerator';
import { SocialManager } from './lib/socialManager';
import { LuckyWalletManager } from './lib/luckyWalletManager';
import { Bot, Zap, Shield, BarChart as ChartBar, Gift, Sparkles, ArrowLeft, Twitter } from 'lucide-react';
import type { MemeToken, ReferralScore } from './types';
import { CONFIG } from './lib/config';
import { Footer } from './components/Footer';

function App() {
  // Set launch date to 21 days from now
  const [launchDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() + CONFIG.LAUNCH_SETTINGS.INITIAL_DELAY).getTime();
  });
  
  const [latestToken, setLatestToken] = useState<MemeToken | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [referralScore, setReferralScore] = useState<ReferralScore | null>(null);
  const [luckyWalletManager] = useState(() => new LuckyWalletManager());
  const [socialManager] = useState(() => new SocialManager());
  const [activeTab, setActiveTab] = useState<'info' | 'trade' | 'debug'>('info');
  const [isPulsing, setIsPulsing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [twitterStatus, setTwitterStatus] = useState<{
    initialized: boolean;
    lastError: string | null;
  }>({
    initialized: false,
    lastError: null
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // Reset scroll position when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        setIsGenerating(true);
        setInitError(null);
        
        const generator = new MemeGenerator();
        
        try {
          await generator.initialize();
        } catch (error) {
          console.warn('System initialized with limited functionality:', error);
          setInitError('System initialized with limited functionality. Some features may be unavailable.');
        }
        
        try {
          await socialManager.schedulePreLaunchCampaign('MIND9', launchDate);
        } catch (error) {
          console.warn('Failed to schedule pre-launch campaign:', error);
        }
        
        setIsConnected(true);
        setIsInitialized(true);
        setIsGenerating(false);
        
        // Check Twitter status
        setTwitterStatus(socialManager.getTwitterStatus());
        
      } catch (error) {
        console.error('Error initializing system:', error);
        setIsGenerating(false);
        setInitError('Failed to initialize system. Please try refreshing the page.');
      }
    };

    initializeSystem();
  }, [launchDate, socialManager]);

  // Stop pulsing when user clicks on trade tab
  useEffect(() => {
    if (activeTab === 'trade') {
      setIsPulsing(false);
    }
  }, [activeTab]);

  const handleWalletConnect = async (address: string) => {
    setWalletAddress(address);
    const score = await luckyWalletManager.getReferralScore(address);
    setReferralScore(score);
    
    // Check if this is an admin wallet (in a real app, this would be done server-side)
    if (address === "8Xe5N4KF8PPtBvY9JvPBxiMv4zkzQ4RmMetgNuJRDXzR") {
      setIsAdmin(true);
    }
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
    setReferralScore(null);
    setIsAdmin(false);
  };

  const handleShare = async (twitterUsername: string, shareUrl: string) => {
    if (!walletAddress) return;
    
    await luckyWalletManager.trackSocialShare(
      walletAddress,
      twitterUsername,
      shareUrl
    );

    const updatedScore = await luckyWalletManager.getReferralScore(walletAddress);
    setReferralScore(updatedScore);
  };

  const handleTokenCreated = (token: MemeToken) => {
    setLatestToken(token);
    // Start pulsing effect when a new token is created
    if (activeTab !== 'trade') {
      setIsPulsing(true);
    }
  };

  // Safely render meme references with proper checks
  const renderMemeReferences = () => {
    if (!latestToken || !latestToken.backstory) return null;
    
    const { memeReferences } = latestToken.backstory;
    
    if (!memeReferences || !Array.isArray(memeReferences)) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {memeReferences.map((meme, index) => (
          <span 
            key={index}
            className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded"
          >
            #{typeof meme === 'string' ? meme.replace(/\s+/g, '') : `meme${index}`}
          </span>
        ))}
      </div>
    );
  };

  // Format launch date
  const formattedLaunchDate = new Date(launchDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Terminal>
      <div className="space-y-6">
        {/* Mission Statement */}
        <div className="border border-green-500/30 rounded-lg p-8 bg-black/50">
          <h1 className="text-3xl font-bold text-green-400 mb-6">
            Mind9: Autonomous AI-Driven Meme Coin Generation
          </h1>
          <p className="text-lg text-green-500/90 mb-8 leading-relaxed">
            Mind9 is an autonomous artificial intelligence system conducting an experiment in 
            decentralized wealth creation. Our neural networks continuously analyze market conditions, 
            blockchain data, and social sentiment to generate and launch strategically timed meme coins 
            with built-in fairness mechanisms.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Bot className="text-green-500" size={24} />
                <h3 className="font-bold text-green-400">AI-Driven</h3>
              </div>
              <p className="text-sm text-green-500/75">
                Neural networks analyze market conditions to determine optimal launch timing
              </p>
            </div>
            
            <div className="border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="text-green-500" size={24} />
                <h3 className="font-bold text-green-400">Anti-Front-Running</h3>
              </div>
              <p className="text-sm text-green-500/75">
                Advanced protection against manipulation and unfair trading practices
              </p>
            </div>
            
            <div className="border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <ChartBar className="text-green-500" size={24} />
                <h3 className="font-bold text-green-400">Market Analysis</h3>
              </div>
              <p className="text-sm text-green-500/75">
                Real-time monitoring of market conditions and social sentiment
              </p>
            </div>
            
            <div className="border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="text-green-500" size={24} />
                <h3 className="font-bold text-green-400">Fair Distribution</h3>
              </div>
              <p className="text-sm text-green-500/75">
                Equitable token distribution and liquidity management
              </p>
            </div>
          </div>
        </div>

        {/* Trading Tabs */}
        <div className="flex border-b border-green-500/30 mb-6 overflow-x-auto">
          {activeTab !== 'info' && (
            <button
              onClick={() => setActiveTab('info')}
              className="flex items-center gap-2 px-6 py-3 font-medium text-green-500/75 hover:text-green-500 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Info</span>
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-green-400 border-b-2 border-green-500'
                : 'text-green-500/50 hover:text-green-500/75'
            }`}
          >
            Project Info
          </button>
          <button
            onClick={() => setActiveTab('trade')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'trade'
                ? 'text-green-400 border-b-2 border-green-500'
                : 'text-green-500/50 hover:text-green-500/75'
            }`}
          >
            Trade Tokens
            {isPulsing && latestToken && activeTab !== 'trade' && (
              <>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="absolute inset-0 rounded-md bg-green-500/10 animate-pulse"></span>
              </>
            )}
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('debug')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'debug'
                  ? 'text-green-400 border-b-2 border-green-500'
                  : 'text-green-500/50 hover:text-green-500/75'
              }`}
            >
              System Diagnostics
              {!twitterStatus.initialized && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
          )}
        </div>

        {activeTab === 'info' ? (
          <>
            {/* Lucky Trader System */}
            <div className="border border-green-500/30 rounded-lg p-6 bg-black/50">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="text-green-500" size={28} />
                <h2 className="text-2xl font-bold text-green-400">Lucky Trader System</h2>
              </div>
              
              <p className="text-green-500/90 mb-6">
                For each new token launch, our AI autonomously selects one Lucky Trader to receive 
                privileged access to initial liquidity. Selection is random but weighted by engagement, 
                with active community members having higher chances of being chosen.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="text-green-500" size={20} />
                    <h4 className="font-bold text-green-400">Automatic Selection</h4>
                  </div>
                  <p className="text-sm text-green-500/75">
                    AI randomly selects one wallet for each new token launch
                  </p>
                </div>

                <div className="border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="text-green-500" size={20} />
                    <h4 className="font-bold text-green-400">Liquidity Share</h4>
                  </div>
                  <p className="text-sm text-green-500/75">
                    Selected wallet receives a share of initial liquidity
                  </p>
                </div>

                <div className="border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ChartBar className="text-green-500" size={20} />
                    <h4 className="font-bold text-green-400">AI-Managed Trading</h4>
                  </div>
                  <p className="text-sm text-green-500/75">
                    Automated trading strategies maximize potential returns
                  </p>
                </div>
              </div>

              {/* Wallet Connection */}
              <div className="border-t border-green-500/20 pt-6">
                <h3 className="text-xl font-bold text-green-400 mb-4">Connect Your Wallet</h3>
                <WalletConnect
                  onConnect={handleWalletConnect}
                  onDisconnect={handleWalletDisconnect}
                  onShare={handleShare}
                  referralScore={referralScore}
                />
              </div>
            </div>

            {/* Referral Program Section */}
            <ReferralSection />

            {/* System Status */}
            {!isConnected ? (
              <div className="border border-green-500/30 rounded-lg p-4 mt-8 text-center">
                <div className="animate-pulse">Initializing AI systems...</div>
              </div>
            ) : (
              <div className="border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span>✅ System Initialized</span>
                  <span className="text-sm opacity-75">Analyzing market conditions</span>
                </div>
                {initError && (
                  <div className="mt-2 text-yellow-400 text-sm">
                    ⚠️ {initError}
                  </div>
                )}
                {!twitterStatus.initialized && isAdmin && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    <span>Twitter API not initialized. Check System Diagnostics tab.</span>
                  </div>
                )}
              </div>
            )}

            {/* Pre-Launch Info */}
            <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 font-bold">Pre-Launch Phase Active</span>
                </div>
                {/* Only show Buy Now button if a token exists */}
                {latestToken && <BuyNowButton token={latestToken} isLoading={isGenerating} />}
              </div>
              <div className="text-sm text-yellow-500/75 mt-1">
                Mind9 AI is analyzing market conditions to determine optimal launch timing. 
                Connect your wallet now to be eligible for Lucky Trader selection.
              </div>
              <div className="text-sm text-yellow-500/75 mt-2">
                <span className="font-bold">Estimated Launch Date:</span> {formattedLaunchDate}
              </div>
            </div>

            {/* Latest Token Info - Only show if a token exists */}
            {latestToken && (
              <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/5">
                <div className="flex items-center gap-4">
                  <img 
                    src={latestToken.imageUrl} 
                    alt={latestToken.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-400">{latestToken.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-green-500/75 mb-2">
                      <span>Market Cap: ${latestToken.marketCap.toLocaleString()}</span>
                      <span>24h Volume: ${latestToken.volume24h.toLocaleString()}</span>
                      <span>Liquidity: ${latestToken.liquidity.toLocaleString()}</span>
                    </div>
                    <div className="bg-black/50 p-3 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-400 mb-1">
                        {latestToken.backstory.theme}
                      </h4>
                      <p className="text-sm text-green-500/75 mb-2">
                        {latestToken.backstory.description}
                      </p>
                      {renderMemeReferences()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <AILogs />
            <TokenGrid />
          </>
        ) : activeTab === 'trade' ? (
          <BondingCurveTrader 
            walletAddress={walletAddress}
            onTokenCreated={handleTokenCreated}
          />
        ) : (
          <TwitterDebug />
        )}
      </div>
      
      <Footer />
    </Terminal>
  );
}

function AlertCircle(props: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size} 
      height={props.size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}

export default App;