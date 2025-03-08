export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

export async function handleNetworkError(error: unknown): Promise<void> {
  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('failed to fetch')) {
      console.error('Network error:', error);
      throw new NetworkError('Network connection failed. Please check your internet connection and try again.');
    }
    if (error.message.includes('User rejected') || error.message.includes('wallet')) {
      console.error('Wallet error:', error);
      throw new WalletError('Wallet connection failed. Please try again.');
    }
  }
  throw error;
}

export function isUserRejection(error: unknown): boolean {
  return error instanceof Error && 
    (error.message.includes('User rejected') || 
     (error as any).code === 4001);
}

export function handleWalletError(error: unknown): string {
  if (isUserRejection(error)) {
    return 'Transaction cancelled by user. Please try again if you want to proceed.';
  }
  
  if (error instanceof Error) {
    if (error.message.includes('insufficient balance')) {
      return 'Insufficient wallet balance. Please add more SOL to your wallet.';
    }
    if (error.message.includes('wallet not connected')) {
      return 'Please connect your wallet to continue.';
    }
    return error.message;
  }
  
  return 'An unknown error occurred. Please try again.';
}