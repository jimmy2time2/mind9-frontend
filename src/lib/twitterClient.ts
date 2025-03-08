import { MockTwitterApi, createMockTwitterClient } from './mockTwitterClient';

// Create a singleton Twitter client to avoid multiple initializations
let twitterClient: any = null;
let useMockClient = true; // Default to mock client

/**
 * Get a Twitter API client instance
 * This function ensures we only create one instance of the client
 */
export function getTwitterClient(): any {
  if (twitterClient) {
    return twitterClient;
  }

  try {
    // Get API keys from environment variables
    const apiKey = import.meta.env.VITE_TWITTER_API_KEY;
    const apiSecret = import.meta.env.VITE_TWITTER_API_SECRET;
    const accessToken = import.meta.env.VITE_TWITTER_ACCESS_TOKEN;
    const accessSecret = import.meta.env.VITE_TWITTER_ACCESS_SECRET;
    
    // Check if credentials are available
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      console.warn('⚠️ Missing Twitter API credentials in environment variables, using mock client');
      twitterClient = createMockTwitterClient();
      return twitterClient;
    }
    
    // Always use mock client in browser environment
    console.log('⚠️ Using mock Twitter client in browser environment');
    twitterClient = createMockTwitterClient();
    return twitterClient;
    
  } catch (error) {
    console.error('❌ Error initializing Twitter client, using mock:', error);
    twitterClient = createMockTwitterClient();
    return twitterClient;
  }
}

/**
 * Send a tweet using the Twitter API
 */
export async function sendTweet(content: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
  isMock?: boolean;
}> {
  try {
    const client = getTwitterClient();
    
    if (!client) {
      return {
        success: false,
        message: 'Twitter client not initialized'
      };
    }
    
    // Send the tweet
    const tweet = await client.v2.tweet(content);
    
    // Log successful tweet
    console.log(`[✅] Tweet Sent: ${content}`);
    
    return {
      success: true,
      message: 'Tweet sent successfully',
      data: tweet.data,
      isMock: useMockClient
    };
  } catch (error) {
    console.error(`[❌] Tweet Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Provide more detailed error information
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: `Failed to send tweet: ${errorMessage}`,
      isMock: useMockClient
    };
  }
}

/**
 * Test the Twitter API connection
 */
export async function testTwitterConnection(): Promise<{
  success: boolean;
  message: string;
  data?: any;
  isMock?: boolean;
}> {
  try {
    // First test if we can get user info
    const client = getTwitterClient();
    if (!client) {
      return {
        success: false,
        message: 'Twitter client not initialized',
        isMock: useMockClient
      };
    }
    
    try {
      // Test the API connection by getting user info
      const userInfo = await client.v2.me();
      console.log('[✅] Twitter API connection successful');
    } catch (apiError) {
      console.error(`[❌] Twitter API connection failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
      return {
        success: false,
        message: `Twitter API connection failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        isMock: useMockClient
      };
    }
    
    // Then try to send a test tweet
    const result = await sendTweet(
      "Mind9 AI test tweet: Verifying autonomous posting system. 🚀 #Mind9 #AI #Crypto"
    );
    
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      isMock: useMockClient
    };
  }
}

/**
 * Check if we're using the mock client
 */
export function isUsingMockClient(): boolean {
  return useMockClient;
}

/**
 * Handle tweet failure with retry mechanism
 */
export async function handleTweetFailure(
  content: string, 
  error: any, 
  retryCount: number = 0
): Promise<boolean> {
  const maxRetries = 5;
  
  if (retryCount >= maxRetries) {
    console.error(`[❌] Failed to send tweet after ${maxRetries} attempts. Giving up.`);
    return false;
  }
  
  // Check for rate limiting (429)
  if (error.code === 429 || (error.message && error.message.includes('rate limit'))) {
    const waitTime = 15 * 60 * 1000; // 15 minutes
    console.log(`[⚠️] Rate Limited. Retrying in 15 minutes... (Attempt ${retryCount + 1}/${maxRetries})`);
    
    return new Promise(resolve => {
      setTimeout(async () => {
        try {
          const result = await sendTweet(content);
          resolve(result.success);
        } catch (retryError) {
          const success = await handleTweetFailure(content, retryError, retryCount + 1);
          resolve(success);
        }
      }, waitTime);
    });
  } else {
    // Other errors - retry sooner
    const waitTime = 5 * 60 * 1000; // 5 minutes
    console.log(`[⚠️] Tweet failed. Retrying in 5 minutes... (Attempt ${retryCount + 1}/${maxRetries})`);
    
    return new Promise(resolve => {
      setTimeout(async () => {
        try {
          const result = await sendTweet(content);
          resolve(result.success);
        } catch (retryError) {
          const success = await handleTweetFailure(content, retryError, retryCount + 1);
          resolve(success);
        }
      }, waitTime);
    });
  }
}