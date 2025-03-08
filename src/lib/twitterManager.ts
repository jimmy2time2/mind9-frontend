import { AIService } from './openai';
import { CONFIG } from './config';
import { sendTweet, isUsingMockClient } from './twitterClient';

interface SocialPost {
  id: string;
  content: string;
  platform: string;
  timestamp: number;
  type: 'hint' | 'update' | 'announcement';
  engagement?: {
    likes: number;
    shares: number;
    comments: number;
  };
}

export class TwitterManager {
  private ai: AIService;
  private static readonly PLATFORMS = CONFIG.SOCIAL_MEDIA.PLATFORMS;
  private static readonly PRE_LAUNCH_HINTS = CONFIG.LAUNCH_SETTINGS.PRE_LAUNCH_HINTS;
  private static readonly HINT_INTERVAL = CONFIG.LAUNCH_SETTINGS.HINT_INTERVAL;
  private static readonly UPDATE_INTERVAL = CONFIG.SOCIAL_MEDIA.UPDATE_INTERVAL;
  private scheduledPosts: SocialPost[] = [];
  private engagementMetrics = {
    totalEngagement: 0,
    walletConnections: 0,
    communityGrowth: 0
  };
  private lastError: Error | null = null;
  private twitterInitialized: boolean = false;

  constructor() {
    this.ai = new AIService();
    this.initializeTwitter();
    this.startPeriodicUpdates();
  }

  private async initializeTwitter() {
    try {
      console.log('🔄 Initializing Twitter API...');
      
      // Send a test tweet to verify connection
      try {
        const result = await sendTweet(
          "Mind9 AI system initialized. Neural networks now monitoring market conditions. #Mind9 #AI #Crypto"
        );
        
        if (result.success) {
          console.log('✅ Twitter API initialized successfully:', result.data?.id);
          this.twitterInitialized = true;
          
          if (result.isMock) {
            console.log('⚠️ Using mock Twitter client');
          }
        } else {
          console.error('❌ Failed to send test tweet:', result.message);
          this.lastError = new Error(result.message);
        }
      } catch (tweetError) {
        console.error('❌ Failed to send test tweet:', tweetError);
        this.lastError = tweetError instanceof Error ? tweetError : new Error('Failed to send test tweet');
      }
    } catch (error) {
      console.error('❌ Error initializing Twitter API:', error);
      this.lastError = error instanceof Error ? error : new Error('Failed to initialize Twitter API');
    }
  }

  private startPeriodicUpdates() {
    setInterval(() => this.postPeriodicUpdate(), this.constructor.UPDATE_INTERVAL);
  }

  private async generateMysteriousUpdate(): Promise<string> {
    try {
      const completion = await this.ai.chat?.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "Generate a cryptic, engaging update about an AI system analyzing crypto markets. Use emojis and create a sense of anticipation. Make it mysterious but professional."
        }],
        max_tokens: 100,
        temperature: 0.8
      });

      return completion?.choices[0].message.content || this.getDefaultUpdate();
    } catch (error) {
      console.error('❌ Error generating update:', error);
      return this.getDefaultUpdate();
    }
  }

  private getDefaultUpdate(): string {
    const updates = [
      "🧠 Neural networks detecting unusual market patterns... #Mind9 #AI",
      "🔮 Quantum algorithms processing market inefficiencies... #CryptoAI",
      "⚡ Energy signatures aligning... preparation sequence initiated. #Mind9",
      "🌌 Analyzing cross-chain anomalies... something's brewing. #CryptoEvolution",
      "🎯 Target parameters identified. Monitoring phase active... #Mind9AI"
    ];
    return updates[Math.floor(Math.random() * updates.length)];
  }

  private async postPeriodicUpdate() {
    try {
      const update = await this.generateMysteriousUpdate();
      const post: SocialPost = {
        id: Math.random().toString(),
        content: update,
        platform: 'all',
        timestamp: Date.now(),
        type: 'update'
      };
      
      await this.postToAllPlatforms(post);
      this.scheduledPosts.push(post);
      
      console.log('✅ Posted periodic update:', update);
    } catch (error) {
      console.error('❌ Error posting periodic update:', error);
    }
  }

  async generatePreLaunchHints(tokenName: string): Promise<string[]> {
    try {
      console.log('🎯 Generating pre-launch hints...');
      
      // Use default hints instead of trying to generate with OpenAI
      const hints = Array(this.constructor.PRE_LAUNCH_HINTS).fill(null).map(() => 
        this.getDefaultHint()
      );

      console.log('✨ Pre-launch hints generated:', hints);
      return hints;
    } catch (error) {
      console.error('❌ Error generating pre-launch hints:', error);
      return Array(this.constructor.PRE_LAUNCH_HINTS).fill(null).map(() => 
        this.getDefaultHint()
      );
    }
  }

  private getDefaultHint(): string {
    const hints = [
      "🤖 Our AI has detected a quantum shift in market dynamics... #CryptoEvolution",
      "🧬 Digital DNA reconfiguration in progress... something extraordinary approaches. #Mind9",
      "🌟 Unprecedented patterns emerging in the neural network... #AIRevolution",
      "⚡ Energy signatures intensifying... preparation sequence at 87%. #CryptoAI",
      "🎯 Target parameters aligned. Countdown sequence initialized... #Mind9Evolution"
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  }

  async schedulePreLaunchCampaign(
    tokenName: string,
    launchTime: number
  ): Promise<void> {
    try {
      console.log('📅 Scheduling pre-launch campaign...');
      const hints = await this.generatePreLaunchHints(tokenName);
      
      // Calculate optimal posting times
      const now = Date.now();
      const timeUntilLaunch = launchTime - now;
      const baseInterval = timeUntilLaunch / (hints.length + 1);
      
      // Add some randomness to posting times
      hints.forEach((hint, index) => {
        const randomOffset = (Math.random() - 0.5) * (baseInterval * 0.2); // ±10% variation
        const postTime = now + (baseInterval * (index + 1)) + randomOffset;
        
        const post: SocialPost = {
          id: Math.random().toString(),
          content: hint,
          platform: 'all',
          timestamp: postTime,
          type: 'hint'
        };
        
        this.schedulePost(post);
      });

      console.log('✅ Pre-launch campaign scheduled');
      
      // Immediately post the first hint to verify Twitter is working
      const firstHint = hints[0];
      await this.postToAllPlatforms({
        id: Math.random().toString(),
        content: firstHint,
        platform: 'all',
        timestamp: Date.now(),
        type: 'hint'
      });
      
    } catch (error) {
      console.error('❌ Error scheduling pre-launch campaign:', error);
    }
  }

  private async postToAllPlatforms(post: SocialPost): Promise<void> {
    try {
      await Promise.all(
        this.constructor.PLATFORMS.map(platform => 
          this.postToSocial(platform, post)
        )
      );
    } catch (error) {
      console.warn('Error posting to all platforms:', error);
    }
  }

  private schedulePost(post: SocialPost): void {
    const delay = post.timestamp - Date.now();
    if (delay <= 0) return;

    this.scheduledPosts.push(post);

    setTimeout(() => {
      this.postToAllPlatforms(post)
        .catch(error => console.error('❌ Error posting to social platforms:', error));
    }, delay);
  }

  private async postToSocial(platform: string, post: SocialPost): Promise<void> {
    try {
      if (platform === 'twitter') {
        await this.postToTwitter(post.content);
      } else {
        // Simulate posting to other social media
        console.log(`📣 [${platform.toUpperCase()}] Posted: ${post.content}`);
      }
      
      // Simulate random engagement
      post.engagement = {
        likes: Math.floor(Math.random() * 1000),
        shares: Math.floor(Math.random() * 200),
        comments: Math.floor(Math.random() * 100)
      };
      
      // Update engagement metrics
      this.updateEngagementMetrics(post);
    } catch (error) {
      console.warn(`Error posting to ${platform}:`, error);
      throw error;
    }
  }

  private async postToTwitter(content: string): Promise<void> {
    try {
      const result = await sendTweet(content);
      
      if (!result.success) {
        console.error('❌ Error posting tweet:', result.message);
        this.lastError = new Error(result.message);
        throw new Error(result.message);
      }
      
      console.log('✅ Tweet posted successfully:', result.data?.id);
      
      if (result.isMock) {
        console.log('⚠️ Note: Using mock Twitter client, tweet was not actually posted to Twitter');
      }
    } catch (error) {
      console.error('❌ Error posting tweet:', error);
      this.lastError = error instanceof Error ? error : new Error('Failed to post tweet');
      throw error;
    }
  }

  private updateEngagementMetrics(post: SocialPost): void {
    if (!post.engagement) return;
    
    const totalEngagement = 
      post.engagement.likes + 
      post.engagement.shares * 2 + 
      post.engagement.comments * 3;
    
    this.engagementMetrics.totalEngagement += totalEngagement;
    this.engagementMetrics.communityGrowth += Math.floor(totalEngagement * 0.1);
  }

  async trackEngagement(type: 'wallet' | 'social' | 'community'): Promise<void> {
    switch (type) {
      case 'wallet':
        this.engagementMetrics.walletConnections++;
        break;
      case 'social':
        this.engagementMetrics.totalEngagement++;
        break;
      case 'community':
        this.engagementMetrics.communityGrowth++;
        break;
    }
  }

  isReadyForLaunch(): boolean {
    return this.engagementMetrics.totalEngagement >= CONFIG.SOCIAL_MEDIA.ENGAGEMENT_THRESHOLD;
  }

  getEngagementMetrics() {
    return this.engagementMetrics;
  }

  getScheduledPosts(): SocialPost[] {
    return [...this.scheduledPosts];
  }
  
  getTwitterStatus(): {
    initialized: boolean;
    lastError: string | null;
  } {
    return {
      initialized: this.twitterInitialized || isUsingMockClient(),
      lastError: this.lastError ? this.lastError.message : null
    };
  }
  
  async sendTestTweet(content: string): Promise<boolean> {
    try {
      const result = await sendTweet(content);
      return result.success;
    } catch (error) {
      console.error('❌ Error sending test tweet:', error);
      return false;
    }
  }

  // Test tweet function
  async sendTestTweet(): Promise<boolean> {
    try {
      const result = await sendTweet("AI is operational. Mind9 is watching. 🚀");
      return result.success;
    } catch (error) {
      console.error('❌ Test tweet failed:', error);
      return false;
    }
  }
}