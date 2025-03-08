import React, { useEffect, useRef, useState } from 'react';
import { Wallet, X, Check, Loader } from 'lucide-react';
import { WalletConnect } from './WalletConnect';

const ASCII_LOGO = `
███╗   ███╗██╗███╗   ██╗██████╗  ██████╗ 
████╗ ████║██║████╗  ██║██╔══██╗██╔═████╗
██╔████╔██║██║██╔██╗ ██║██║  ██║██║██╔██║
██║╚██╔╝██║██║██║╚██╗██║██║  ██║████╔╝██║
██║ ╚═╝ ██║██║██║ ╚████║██████╔╝╚██████╔╝
╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ 
`;

interface TerminalProps {
  children: React.ReactNode;
}

export function Terminal({ children }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Reset scroll position to top when component mounts
    if (terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }

    const handleScroll = () => {
      if (terminalRef.current) {
        setIsScrolled(terminalRef.current.scrollTop > 0);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showWalletModal) {
        setShowWalletModal(false);
      }
    };

    terminalRef.current?.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleEscape);
    
    // Also reset the main window scroll position
    window.scrollTo(0, 0);
    
    return () => {
      terminalRef.current?.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [children, showWalletModal]);

  const handleWalletConnect = async (address: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Wallet connected:', address);
      setSuccessMessage('Wallet connected successfully! You are now eligible for Lucky Trader selection.');
      setShowWalletModal(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletDisconnect = () => {
    setSuccessMessage('Wallet disconnected successfully');
    setShowWalletModal(false);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleShare = (twitterUsername: string, shareUrl: string) => {
    console.log('Shared:', { twitterUsername, shareUrl });
    setSuccessMessage('Shared successfully! Your Lucky Trader odds have increased.');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 p-4 font-mono smooth-scroll">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-3 rounded-lg border border-green-500/30 backdrop-blur-sm animate-fade-in">
          <Check size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <nav className={`
        border-b border-green-500/30 pb-4 mb-8 sticky top-0 z-40 transition-all duration-200
        ${isScrolled ? 'bg-black/95 backdrop-blur-sm' : 'bg-transparent'}
      `}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="hidden md:block">
            <pre className="text-xs leading-none">{ASCII_LOGO}</pre>
          </div>
          <div className="block md:hidden">
            <span className="text-xl font-bold">MIND9</span>
          </div>
          <button
            onClick={() => setShowWalletModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200
              bg-green-500 hover:bg-green-600 text-black font-bold focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Connect Wallet"
          >
            <Wallet size={18} />
            <span>Connect Wallet</span>
          </button>
        </div>
      </nav>
      
      <div 
        ref={terminalRef}
        className="container mx-auto bg-black/50 border border-green-500/30 rounded-lg p-4 md:p-6 h-[calc(100vh-12rem)] overflow-y-auto terminal-scroll"
        role="main"
      >
        <div className="space-y-6">
          {children}
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-modal-title"
        >
          <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-md w-full mx-auto relative">
            <button
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 text-green-500 hover:text-green-400 focus:outline-none focus:text-green-400"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            
            <h2 id="wallet-modal-title" className="text-xl font-bold text-green-400 mb-4">
              Connect Your Wallet
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {isConnecting ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader size={24} className="animate-spin text-green-500" />
                <span className="text-green-400">Connecting wallet...</span>
              </div>
            ) : (
              <WalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                onShare={handleShare}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}