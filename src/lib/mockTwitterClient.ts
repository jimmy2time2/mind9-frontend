/**
 * Mock Twitter client for browser environments
 * This provides a fallback when the actual Twitter API client fails to initialize
 */

// Mock Twitter API client
export class MockTwitterApi {
  private static tweetCounter = 0;
  
  constructor(credentials: any) {
    console.log('📣 Initializing Mock Twitter API client');
  }
  
  get v2() {
    return {
      tweet: async (content: string) => {
        console.log('📣 [MOCK TWITTER] Tweet:', content);
        MockTwitterApi.tweetCounter++;
        
        return {
          data: {
            id: `mock-tweet-${Date.now()}`,
            text: content
          }
        };
      },
      me: async () => {
        return {
          data: {
            id: 'mock-user-id',
            name: 'Mock Twitter User',
            username: 'mock_user'
          }
        };
      },
      userTimeline: async (userId: string, options: any) => {
        return {
          data: {
            data: Array(options?.max_results || 10).fill(null).map((_, i) => ({
              id: `mock-tweet-${i}`,
              text: `Mock tweet #${i}`,
              created_at: new Date().toISOString(),
              public_metrics: {
                like_count: Math.floor(Math.random() * 100),
                retweet_count: Math.floor(Math.random() * 50),
                reply_count: Math.floor(Math.random() * 20)
              }
            }))
          }
        };
      },
      trendingTopics: async () => {
        return {
          data: [
            { name: '#Crypto', tweet_volume: 12345 },
            { name: '#AI', tweet_volume: 54321 },
            { name: '#Blockchain', tweet_volume: 7890 }
          ]
        };
      }
    };
  }
  
  static getTweetCount() {
    return MockTwitterApi.tweetCounter;
  }
}

// Export mock client
export function createMockTwitterClient() {
  return new MockTwitterApi({
    appKey: 'mock-key',
    appSecret: 'mock-secret',
    accessToken: 'mock-token',
    accessSecret: 'mock-secret'
  });
}