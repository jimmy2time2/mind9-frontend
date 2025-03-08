import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, Wallet, BarChart, DollarSign, Rocket, Info, AlertCircle } from 'lucide-react';
import { BondingCurveManager, TokenState } from '../lib/bondingCurve';
import { TokenCandleChart } from './TokenCandleChart';
import { MemeToken } from '../types';

interface BondingCurveTraderProps {
  walletAddress: string | null;
  onTokenCreated?: (token: MemeToken) => void;
}

export function BondingCurveTrader({ walletAddress, onTokenCreated }: BondingCurveTraderProps) {
  const [bondingCurveManager] = useState(() => new BondingCurveManager());
  const [activeTokens, setActiveTokens] = useState<TokenState[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenState | null>(null);
  const [solAmount, setSolAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  // Migration parameters
  const { threshold, liquidityPercentage, raydiumMigrationFee } = bondingCurveManager.getMigrationParams();

  // Load tokens when component mounts
  useEffect(() => {
    const tokens = bondingCurveManager.getAllTokens();
    setActiveTokens(tokens);
    
    // If there are tokens, select the first one
    if (tokens.length > 0) {
      setSelectedToken(tokens[0]);
    } else {
      // No tokens exist yet - don't auto-generate one
      // This ensures no tokens appear until the launch date
    }
  }, []);

  const generateNewAIToken = async () => {
    try {
      setIsGeneratingToken(true);
      
      // Generate a new AI token
      const result = await bondingCurveManager.generateAIToken();
      
      if (result.success && result.tokenAddress) {
        // Update active tokens
        const updatedTokens = bondingCurveManager.getAllTokens();
        setActiveTokens(updatedTokens);
        
        // Select the new token
        const newToken = bondingCurveManager.getTokenState(result.tokenAddress);
        if (newToken) {
          setSelectedToken(newToken);
        }
        
        // Convert to MemeToken format and notify parent
        if (onTokenCreated && newToken) {
          const memeToken: MemeToken = {
            id: newToken.tokenAddress,
            name: `${newToken.name}`,
            symbol: newToken.symbol,
            imageUrl: `https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=128&h=128&fit=crop&auto=format&q=90`,
            marketCap: newToken.marketCap,
            volume24h: newToken.reserveBalance * 2, // Simulated volume
            liquidity: newToken.reserveBalance,
            dexUrl: `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${newToken.tokenAddress}`,
            createdAt: newToken.createdAt,
            creator: 'Mind9',
            liquidityLocked: 70,
            whaleLimit: 2.5,
            backstory: {
              theme: "AI meets Internet Culture",
              description: `${newToken.name} emerged from the depths of the internet, where artificial intelligence and meme culture collided in an epic fusion of technology and humor.`,
              origin: `Created by Mind9 AI system through advanced market analysis and neural network optimization.`,
              memeReferences: [
                "Neural Networks",
                "To the Moon",
                "Diamond Hands",
                "AI Revolution"
              ]
            }
          };
          
          onTokenCreated(memeToken);
        }
      }
    } catch (error) {
      console.error('Error generating AI token:', error);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleTokenSelect = (token: TokenState) => {
    setSelectedToken(token);
    setSolAmount('');
    setTokenAmount('');
    setTransactionStatus({ type: null, message: '' });
  };

  const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSolAmount(value);

    // Calculate token amount based on bonding curve
    if (selectedToken && value) {
      try {
        const tokenAmount = bondingCurveManager.calculateTokenAmount(
          parseFloat(value),
          selectedToken
        );
        setTokenAmount(tokenAmount.toFixed(2));
      } catch (error) {
        setTokenAmount('');
      }
    } else {
      setTokenAmount('');
    }
  };

  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTokenAmount(value);

    // Calculate SOL amount based on bonding curve
    if (selectedToken && value) {
      try {
        const solReturn = bondingCurveManager.calculateSolReturn(
          parseFloat(value),
          selectedToken
        );
        setSolAmount(solReturn.toFixed(4));
      } catch (error) {
        setSolAmount('');
      }
    } else {
      setSolAmount('');
    }
  };

  const handleBuy = async () => {
    if (!selectedToken || !solAmount || !walletAddress) {
      setTransactionStatus({
        type: 'error',
        message: 'Please connect your wallet and enter a valid amount'
      });
      return;
    }

    setIsLoading(true);
    setTransactionStatus({ type: null, message: '' });

    try {
      const result = await bondingCurveManager.buyTokens(
        selectedToken.tokenAddress,
        parseFloat(solAmount),
        walletAddress
      );

      if (result.success) {
        setTransactionStatus({
          type: 'success',
          message: `Successfully purchased ${parseFloat(tokenAmount).toFixed(2)} tokens at ${result.newPrice?.toFixed(6)} SOL each`
        });

        // Update active tokens
        setActiveTokens(bondingCurveManager.getAllTokens());
        
        // Update selected token
        const updatedToken = bondingCurveManager.getTokenState(selectedToken.tokenAddress);
        if (updatedToken) {
          setSelectedToken(updatedToken);
        }

        // Clear inputs
        setSolAmount('');
        setTokenAmount('');
      } else {
        setTransactionStatus({
          type: 'error',
          message: 'Transaction failed. Please try again.'
        });
      }
    } catch (error) {
      setTransactionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!selectedToken || !tokenAmount || !walletAddress) {
      setTransactionStatus({
        type: 'error',
        message: 'Please connect your wallet and enter a valid amount'
      });
      return;
    }

    setIsLoading(true);
    setTransactionStatus({ type: null, message: '' });

    try {
      const result = await bondingCurveManager.sellTokens(
        selectedToken.tokenAddress,
        parseFloat(tokenAmount),
        walletAddress
      );

      if (result.success) {
        setTransactionStatus({
          type: 'success',
          message: `Successfully sold ${parseFloat(tokenAmount).toFixed(2)} tokens for ${result.solReturn?.toFixed(4)} SOL`
        });

        // Update active tokens
        setActiveTokens(bondingCurveManager.getAllTokens());
        
        // Update selected token
        const updatedToken = bondingCurveManager.getTokenState(selectedToken.tokenAddress);
        if (updatedToken) {
          setSelectedToken(updatedToken);
        }

        // Clear inputs
        setSolAmount('');
        setTokenAmount('');
      } else {
        setTransactionStatus({
          type: 'error',
          message: 'Transaction failed. Please try again.'
        });
      }
    } catch (error) {
      setTransactionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trading Interface */}
      <div className="border border-green-500/30 rounded-lg p-6 bg-black/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-green-500" size={24} />
            <h2 className="text-2xl font-bold text-green-400">Mind9 AI-Generated Tokens</h2>
          </div>
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
          >
            <Info size={18} />
            <span>How it works</span>
          </button>
        </div>

        {/* How It Works Modal */}
        {showInfoModal && (
          <div className="mb-6 border border-green-500/20 rounded-lg p-4 bg-black/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-green-400">How Mind9 Trading Works</h3>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="text-green-500 hover:text-green-400"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="border border-green-500/20 rounded-lg p-3 bg-black/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">1</div>
                  <h4 className="font-medium text-green-400 text-sm">AI Analysis</h4>
                </div>
                <p className="text-xs text-green-500/75">
                  Our AI analyzes market conditions to determine optimal token parameters.
                </p>
              </div>

              <div className="border border-green-500/20 rounded-lg p-3 bg-black/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">2</div>
                  <h4 className="font-medium text-green-400 text-sm">Token Creation</h4>
                </div>
                <p className="text-xs text-green-500/75">
                  AI generates tokens with optimal parameters and bonding curve configuration.
                </p>
              </div>

              <div className="border border-green-500/20 rounded-lg p-3 bg-black/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">3</div>
                  <h4 className="font-medium text-green-400 text-sm">Trading Phase</h4>
                </div>
                <p className="text-xs text-green-500/75">
                  Users can buy and sell tokens on the bonding curve at any time.
                </p>
              </div>

              <div className="border border-green-500/20 rounded-lg p-3 bg-black/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">4</div>
                  <h4 className="font-medium text-green-400 text-sm">Market Cap Growth</h4>
                </div>
                <p className="text-xs text-green-500/75">
                  As more users buy tokens, the market cap grows toward the migration threshold.
                </p>
              </div>

              <div className="border border-green-500/20 rounded-lg p-3 bg-black/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center font-bold text-xs">5</div>
                  <h4 className="font-medium text-green-400 text-sm">DEX Migration</h4>
                </div>
                <p className="text-xs text-green-500/75">
                  When threshold is reached, tokens automatically migrate to Raydium with locked liquidity.
                </p>
              </div>
            </div>
            
            <div className="text-xs text-green-500/75">
              <p className="mb-2">
                <strong className="text-green-400">Bonding Curve Mechanics:</strong> Tokens are priced according to a mathematical formula. The price increases as more tokens 
                are purchased and decreases as tokens are sold. All tokens are backed by a reserve of SOL.
              </p>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <span className="text-green-500/75">Migration Threshold:</span>
                  <span className="text-green-400 ml-1">${threshold.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-green-500/75">Liquidity Provision:</span>
                  <span className="text-green-400 ml-1">{liquidityPercentage * 100}% of Market Cap</span>
                </div>
                <div>
                  <span className="text-green-500/75">Raydium Migration Fee:</span>
                  <span className="text-green-400 ml-1">{raydiumMigrationFee} SOL</span>
                </div>
              </div>
              <p className="mt-2 text-yellow-400 text-xs">
                <strong>Note:</strong> The {raydiumMigrationFee} SOL Raydium migration fee is taken from the token's liquidity pool and does not require additional payment from users.
              </p>
            </div>
          </div>
        )}

        {/* Token Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">AI-Generated Tokens</h3>
              <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                Mind9 AI
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {activeTokens.length === 0 ? (
                <div className="text-center py-8 text-green-500/50 border border-green-500/20 rounded-lg p-4">
                  <p>AI is analyzing market conditions</p>
                  <p className="text-sm mt-2">Tokens will be generated when conditions are optimal</p>
                  {isGeneratingToken && (
                    <div className="mt-4 flex justify-center">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              ) : (
                activeTokens.map((token) => (
                  <div
                    key={token.tokenAddress}
                    onClick={() => handleTokenSelect(token)}
                    className={`
                      border rounded-lg p-3 cursor-pointer transition-colors
                      ${selectedToken?.tokenAddress === token.tokenAddress
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-green-500/30 hover:border-green-500/50 bg-black/30'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-green-400">{token.symbol}</div>
                      <div className="text-sm text-green-500/75">
                        {token.currentPrice.toFixed(6)} SOL
                      </div>
                    </div>
                    <div className="text-xs text-green-500/50 mt-1">{token.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-green-500/50">
                        MCap: ${token.marketCap.toFixed(2)}
                      </div>
                      <div className="text-xs text-green-500/50">
                        Reserve: {token.reserveBalance.toFixed(2)} SOL
                      </div>
                    </div>
                    {token.migrationReady && (
                      <div className="mt-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-center">
                        Raydium Listed
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chart and Trading Interface */}
          <div className="md:col-span-3 space-y-6">
            {/* Price Chart */}
            <TokenCandleChart token={selectedToken} />

            {/* Trading Interface */}
            <div className="border border-green-500/30 rounded-lg p-4 bg-black/30">
              {selectedToken ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-green-400">
                      {selectedToken.name} Trading
                    </h3>
                    <div className="text-sm text-green-500/75">
                      Current Price: {selectedToken.currentPrice.toFixed(6)} SOL
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-green-500/75">SOL Amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={solAmount}
                          onChange={handleSolAmountChange}
                          placeholder="0.0"
                          className="w-full bg-black border border-green-500/30 rounded-lg px-3 py-2 text-green-400 placeholder-green-500/50"
                        />
                        <div className="absolute right-3 top-2 text-green-500/50">SOL</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowRight className="text-green-500/50" size={24} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-green-500/75">Token Amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={tokenAmount}
                          onChange={handleTokenAmountChange}
                          placeholder="0.0"
                          className="w-full bg-black border border-green-500/30 rounded-lg px-3 py-2 text-green-400 placeholder-green-500/50"
                        />
                        <div className="absolute right-3 top-2 text-green-500/50">
                          {selectedToken.symbol}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleBuy}
                      disabled={!walletAddress || !solAmount || isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-black px-4 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Buy'}
                    </button>
                    <button
                      onClick={handleSell}
                      disabled={!walletAddress || !tokenAmount || isLoading}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Sell'}
                    </button>
                  </div>

                  {transactionStatus.type && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      transactionStatus.type === 'success' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {transactionStatus.type === 'success' ? (
                        <div className="flex items-center gap-2">
                          <Check size={18} />
                          <span>{transactionStatus.message}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={18} />
                          <span>{transactionStatus.message}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Token Stats */}
                  <div className="mt-6 border-t border-green-500/20 pt-4">
                    <h4 className="text-sm font-semibold text-green-400 mb-3">Token Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <BarChart size={16} className="text-green-500/75" />
                        <div className="text-sm">
                          <div className="text-green-500/50">Market Cap</div>
                          <div className="text-green-400">${selectedToken.marketCap.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-green-500/75" />
                        <div className="text-sm">
                          <div className="text-green-500/50">Reserve</div>
                          <div className="text-green-400">{selectedToken.reserveBalance.toFixed(4)} SOL</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-green-500/75" />
                        <div className="text-sm">
                          <div className="text-green-500/50">Price</div>
                          <div className="text-green-400">{selectedToken.currentPrice.toFixed(6)} SOL</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-green-500/75" />
                        <div className="text-sm">
                          <div className="text-green-500/50">Holders</div>
                          <div className="text-green-400">{selectedToken.holders}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Migration Status */}
                  <div className="mt-4 border-t border-green-500/20 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Rocket size={16} className="text-green-500/75" />
                        <h4 className="text-sm font-semibold text-green-400">Raydium Migration</h4>
                      </div>
                      {selectedToken.migrationReady ? (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          Listed
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                          {Math.round((selectedToken.marketCap / threshold) * 100)}% Ready
                        </span>
                      )}
                    </div>
                    <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (selectedToken.marketCap / threshold) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-green-500/50 mt-1">
                      ${selectedToken.marketCap.toFixed(2)} / ${threshold.toFixed(2)} Market Cap
                    </div>
                    <div className="text-xs text-green-500/50 mt-1">
                      {liquidityPercentage * 100}% of market cap (${(selectedToken.marketCap * liquidityPercentage).toFixed(2)}) will be provided as liquidity
                    </div>
                    <div className="text-xs text-yellow-400 mt-1">
                      <strong>Migration Fee:</strong> {raydiumMigrationFee} SOL (deducted from liquidity pool)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Info size={48} className="text-green-500/30 mb-4" />
                  <p className="text-green-500/50 text-center mb-4">
                    {activeTokens.length > 0 
                      ? "Select a token from the list to start trading" 
                      : "AI is analyzing market conditions to generate optimal tokens"}
                  </p>
                  {isGeneratingToken && (
                    <div className="mt-4 flex justify-center">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Check(props: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

function Users(props: { size: number, className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function X(props: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}