import { testTwitterConnection } from './twitterClient';

/**
 * Test function to verify Twitter API credentials and functionality
 */
export async function testTwitterAPI(): Promise<{
  success: boolean;
  message: string;
  data?: any;
  isMock?: boolean;
}> {
  try {
    console.log('[🔄] Testing Twitter API connection...');
    
    // Get API keys from environment variables
    const apiKey = import.meta.env.VITE_TWITTER_API_KEY;
    const apiSecret = import.meta.env.VITE_TWITTER_API_SECRET;
    const accessToken = import.meta.env.VITE_TWITTER_ACCESS_TOKEN;
    const accessSecret = import.meta.env.VITE_TWITTER_ACCESS_SECRET;
    
    // Log available credentials (without revealing full values)
    console.log('API Key available:', !!apiKey);
    console.log('API Secret available:', !!apiSecret);
    console.log('Access Token available:', !!accessToken);
    console.log('Access Secret available:', !!accessSecret);
    
    // Check if credentials are available
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      return {
        success: true,
        message: 'Using mock Twitter client (missing credentials)',
        isMock: true
      };
    }
    
    // Test the Twitter connection
    return await testTwitterConnection();
  } catch (error) {
    console.error('[❌] Twitter API test failed:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: `Twitter API test failed: ${errorMessage}`
    };
  }
}