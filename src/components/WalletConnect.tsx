import React, { useState, useEffect } from 'react';
import { Wallet, Share2, AlertCircle, Trophy, ExternalLink } from 'lucide-react';
import type { ReferralScore } from '../types';
import { isUserRejection, handleWalletError } from '../lib/errorHandling';
import { monitoring } from '../lib/monitoring';
import { walletAddressValidator } from '../lib/validation';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  onShare: (twitterUsername: string, shareUrl: string) => void;
  referralScore?: ReferralScore | null;
}

export function WalletConnect({ 
  onConnect, 
  onDisconnect, 
  onShare,
  referralScore 
}: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState<string>('');
  const [isEditingTwitter, setIsEditingTwitter] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;
  const retryDelay = 2000; // 2 seconds

  useEffect(() => {
    // Check if Phantom is installed
    const checkPhantom = async () => {
      try {
        if ("solana" in window) {
          const provider = (window as any).solana;
          if (provider?.isPhantom) {
            setIsPhantomInstalled(true);
            try {
              // Auto-connect if previously authorized
              const resp = await provider.connect({ onlyIfTrusted: true });
              handleConnection(resp.publicKey.toString());
            } catch (error) {
              // Ignore user rejection errors for auto-connect
              if (!isUserRejection(error)) {
                console.error('Auto-connect error:', error);
                monitoring.recordError({
                  message: 'Auto-connect error',
                  timestamp: Date.now(),
                  metadata: { error }
                });
              }
            }
          } else {
            setIsPhantomInstalled(false);
          }
        } else {
          setIsPhantomInstalled(false);
        }
      } catch (error) {
        console.warn('Phantom check failed:', error);
        setIsPhantomInstalled(false);
        monitoring.recordError({
          message: 'Phantom check failed',
          timestamp: Date.now(),
          metadata: { error }
        });
      }
    };

    checkPhantom();
  }, []);

  // Show retry button after 5 seconds if there was an error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setShowRetryButton(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowRetryButton(false);
    }
  }, [error]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setShowRetryButton(false);
      setConnectionAttempts(prev => prev + 1);

      if (!isPhantomInstalled) {
        setError("Phantom Wallet not found. Please install it first.");
        setIsConnecting(false);
        return;
      }

      if (connectionAttempts >= maxConnectionAttempts) {
        setError("Maximum connection attempts reached. Please wait a moment before trying again.");
        setIsConnecting(false);
        // Reset attempts after delay
        setTimeout(() => setConnectionAttempts(0), 30000);
        return;
      }

      if ("solana" in window) {
        const provider = (window as any).solana;
        if (provider?.isPhantom) {
          try {
            const resp = await provider.connect();
            const publicKey = resp.publicKey.toString();
            
            // Validate wallet address
            const validation = walletAddressValidator.validate(publicKey);
            if (!validation.isValid) {
              throw new Error(validation.errors[0]);
            }
            
            handleConnection(publicKey);
          } catch (error) {
            // Handle user rejection gracefully
            if (isUserRejection(error)) {
              console.log("User rejected the connection request");
              setError("Connection cancelled. Please try again when you're ready to connect.");
            } else {
              console.error("Connection error:", error);
              monitoring.recordError({
                message: 'Connection error',
                timestamp: Date.now(),
                metadata: { error }
              });
              setError(handleWalletError(error));

              // Show retry button immediately for non-rejection errors
              setShowRetryButton(true);
            }
          }
        } else {
          setError("Phantom Wallet not found. Please install it first.");
        }
      } else {
        setError("Phantom Wallet not found. Please install it first.");
      }
    } catch (error) {
      console.error('Connection error:', error);
      monitoring.recordError({
        message: 'Connection error',
        timestamp: Date.now(),
        metadata: { error }
      });
      setError(handleWalletError(error));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnection = async (publicKey: string) => {
    try {
      setAddress(publicKey);
      onConnect(publicKey);
      // Reset connection attempts on successful connection
      setConnectionAttempts(0);
      setError(null);
    } catch (error) {
      console.error('Error handling connection:', error);
      monitoring.recordError({
        message: 'Error handling connection',
        timestamp: Date.now(),
        metadata: { error }
      });
      setError(handleWalletError(error));
    }
  };

  const disconnectWallet = () => {
    try {
      if ("solana" in window) {
        const provider = (window as any).solana;
        if (provider?.isPhantom) {
          provider.disconnect();
        }
      }
      setAddress(null);
      onDisconnect();
      // Reset connection attempts and error state on disconnect
      setConnectionAttempts(0);
      setError(null);
    } catch (error) {
      console.error('Disconnect error:', error);
      monitoring.recordError({
        message: 'Disconnect error',
        timestamp: Date.now(),
        metadata: { error }
      });
      setError(handleWalletError(error));
    }
  };

  const handleTwitterSubmit = async () => {
    if (!address || !twitterUsername) return;

    try {
      setIsEditingTwitter(false);
    } catch (error) {
      console.error('Error updating Twitter username:', error);
      monitoring.recordError({
        message: 'Error updating Twitter username',
        timestamp: Date.now(),
        metadata: { error }
      });
      setError(handleWalletError(error));
    }
  };

  const shareOnTwitter = () => {
    if (!address) return;

    const tweetText = encodeURIComponent(
      "I'm joining the Mind9 AI revolution! The first autonomous AI system creating fair, high-value meme coins. Join me and get a chance to be selected for exclusive rewards! 🚀🤖 #Mind9 #AI #Crypto"
    );
    const referralUrl = encodeURIComponent(
      `https://mind9.netlify.app/ref/${address}`
    );
    const shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${referralUrl}`;

    // Open Twitter share dialog
    window.open(shareUrl, '_blank');

    // Track share
    onShare(twitterUsername || '@username', shareUrl);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-lg">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!isPhantomInstalled && (
        <div className="flex flex-col gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle size={18} />
            <span className="font-medium">Phantom Wallet not found</span>
          </div>
          <p className="text-sm text-yellow-500/90">
            To connect your wallet, you need to install Phantom first.
          </p>
          <a 
            href="https://phantom.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors w-full justify-center"
          >
            Install Phantom Wallet
            <ExternalLink size={16} />
          </a>
        </div>
      )}

      {!address ? (
        <div className="space-y-3">
          <button
            onClick={connectWallet}
            disabled={isConnecting || (!isPhantomInstalled && !("solana" in window)) || connectionAttempts >= maxConnectionAttempts}
            className="w-full bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet size={18} />
                Connect Wallet
              </>
            )}
          </button>
          
          {showRetryButton && connectionAttempts < maxConnectionAttempts && (
            <button
              onClick={connectWallet}
              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 justify-center transition-colors"
            >
              <RefreshCw size={18} />
              Retry Connection
            </button>
          )}
        </div>
      ) : (
        <div className="border border-green-500/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="text-green-500" size={18} />
              <span className="text-green-400 font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="text-red-500 hover:text-red-400 text-sm"
            >
              Disconnect
            </button>
          </div>

          {/* Twitter Username */}
          <div className="border-t border-green-500/20 pt-4">
            {isEditingTwitter ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={twitterUsername}
                  onChange={(e) => setTwitterUsername(e.target.value)}
                  placeholder="Your Twitter username"
                  className="flex-1 bg-black border border-green-500/30 rounded px-3 py-2 text-green-400 placeholder-green-500/50 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={handleTwitterSubmit}
                  className="bg-green-500 text-black px-4 py-2 rounded font-bold hover:bg-green-600 transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">Twitter Username:</span>
                  <span className="text-green-500">
                    {twitterUsername || 'Not set'}
                  </span>
                </div>
                <button
                  onClick={() => setIsEditingTwitter(true)}
                  className="text-green-500 hover:text-green-400 text-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Referral Score */}
          {referralScore && (
            <div className="border-t border-green-500/20 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400">Referral Score</span>
                <span className="text-green-500 font-bold">
                  {Math.round(referralScore.score * 100)}%
                </span>
              </div>
              <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${referralScore.score * 100}%` }}
                />
              </div>
              <p className="text-sm text-green-500/75 mt-2">
                Share Mind9 to increase your chances of being selected!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={shareOnTwitter}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 justify-center transition-colors"
            >
              <Share2 size={18} />
              Share on Twitter
            </button>
            
            <button
              onClick={() => setShowLeaderboard(true)}
              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2 justify-center transition-colors"
            >
              <Trophy size={18} />
              View Leaderboard
            </button>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-2xl w-full mx-auto relative">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="absolute top-4 right-4 text-green-500 hover:text-green-400"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <Trophy className="text-green-500" size={24} />
              <h2 className="text-2xl font-bold text-green-400">Mind9 Leaderboard</h2>
            </div>
            
            <div className="text-center text-green-500/75 py-8">
              Leaderboard data will be available after launch
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X(props: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}

function RefreshCw(props: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>;
}