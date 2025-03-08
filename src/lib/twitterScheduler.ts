import { sendTweet, handleTweetFailure } from './twitterClient';
import { AIService } from './openai';

// Tweet categories for variety
enum TweetCategory {
  MARKET_ANALYSIS = 'market_analysis',
  CRYPTO_TRENDS = 'crypto_trends',
  MEME_INSIGHTS = 'meme_insights',
  LUCKY_TRADER = 'lucky_trader',
  ENGAGEMENT = 'engagement',
  MYSTERIOUS = 'mysterious'
}

// Tweet templates for each category
const TWEET_TEMPLATES = {
  [TweetCategory.MARKET_ANALYSIS]: [
    "📊 AI Analysis: Market volatility at {value}%. Optimal entry points detected in {sector} sector. #Mind9 #AITrading",
    "🧠 Neural network detected a {pattern} pattern forming across {coin} charts. Significance rating: {rating}/10. #Mind9AI",
    "⚡ Flash analysis: {coin} showing unusual volume patterns. Our AI predicts {prediction} movement within 48h. #Mind9 #CryptoAI"
  ],
  [TweetCategory.CRYPTO_TRENDS]: [
    "🔍 Trend Alert: {trend} gaining momentum. {percentage}% increase in social mentions over 24h. #Mind9 #CryptoTrends",
    "📈 AI Trend Forecast: {trend} expected to dominate discussions this week. Early detection confidence: {confidence}%. #Mind9",
    "🌊 Wave Analysis: {trend} sentiment shifting from {sentiment1} to {sentiment2}. Monitoring closely. #Mind9AI #CryptoTrends"
  ],
  [TweetCategory.MEME_INSIGHTS]: [
    "😂 Meme Coin Insight: {coin} community growth accelerating. Virality score: {score}/10. #Mind9 #MemeCoin",
    "🚀 Meme Analysis: {coin} showing {percentage}% higher engagement than average. AI significance rating: {rating}. #Mind9AI",
    "🧪 Meme Lab: Our AI detected {count} new meme coins launched today. Only {percentage}% show promising metrics. #Mind9 #MemeCoins"
  ],
  [TweetCategory.LUCKY_TRADER]: [
    "🍀 Lucky Trader Alert: Next selection in {hours}h. Connect your wallet to be eligible! #Mind9 #LuckyTrader",
    "💎 Lucky Trader Update: {walletPrefix}...{walletSuffix} selected for exclusive rewards! Next selection: {days} days. #Mind9",
    "🎯 Lucky Trader Program: Engagement scores updated. Top 10% of wallets now have {percentage}% higher selection odds. #Mind9"
  ],
  [TweetCategory.ENGAGEMENT]: [
    "💬 Question: What's your strategy for the current market? Our AI is analyzing responses... #Mind9 #CryptoChat",
    "🤔 If you could ask an AI trading system one question, what would it be? #Mind9 #AITrading",
    "🗳️ Poll: Which sector will outperform in Q3? A) DeFi B) NFTs C) Meme Coins D) L2s. Our AI prediction coming soon! #Mind9"
  ],
  [TweetCategory.MYSTERIOUS]: [
    "🧠 Neural networks detecting unusual market patterns... Are you ready for what's coming? #Mind9 #AI #Crypto",
    "🔮 Quantum algorithms processing market inefficiencies... #CryptoAI #Mind9",
    "⚡ Energy signatures aligning... preparation sequence initiated. #Mind9 #AI",
    "🌌 Analyzing cross-chain anomalies... something's brewing. #CryptoEvolution #Mind9",
    "🎯 Target parameters identified. Monitoring phase active... #Mind9AI"
  ]
};

// Variables for tweet scheduling
let scheduledTweets: NodeJS.Timeout[] = [];
let dailyTweetCount = 10; // Default to 10 tweets per day
let isInitialized = false;
let lastTweetTime = 0;
const MIN_TWEET_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours minimum between tweets (increased from 30 minutes)
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes between retries
const HOURS_IN_DAY = 24;
const MS_IN_HOUR = 60 * 60 * 1000;
const INITIAL_TWEET_DELAY = 30 * 1000; // 30 seconds after initialization

// Engagement data storage
interface EngagementData {
  hourlyEngagement: number[];  // 0-23 hours, engagement score for each hour
  lastUpdated: number;         // timestamp of last update
  bestHours: number[];         // sorted list of best hours (highest engagement first)
  worstHours: number[];        // sorted list of worst hours (lowest engagement first)
}

// Default engagement data based on general Twitter patterns
// Higher values = better engagement
const defaultEngagementData: EngagementData = {
  hourlyEngagement: [
    30, 20, 15, 10, 5, 10, 20, 40, // 12am-8am
    60, 75, 85, 90, 95, 90, 85, 80, // 8am-4pm
    75, 85, 95, 90, 80, 60, 50, 40  // 4pm-12am
  ],
  lastUpdated: Date.now(),
  bestHours: [12, 19, 11, 20, 13, 18, 9, 10, 14, 17], // Noon, 7pm, 11am, 8pm, etc.
  worstHours: [4, 3, 5, 2, 6, 23, 22, 0, 1, 7]        // 4am, 3am, 5am, etc.
};

// Current engagement data
let engagementData: EngagementData = { ...defaultEngagementData };

/**
 * Initialize the Twitter scheduler
 * @param tweetsPerDay Number of tweets to send per day
 */
export function initializeTwitterScheduler(tweetsPerDay: number = 10): void {
  if (isInitialized) {
    console.log('[⚠️] Twitter scheduler already initialized');
    return;
  }

  dailyTweetCount = tweetsPerDay;
  isInitialized = true;
  
  console.log(`[🔄] Initializing Twitter scheduler with ${dailyTweetCount} tweets per day`);
  
  // Update engagement data based on historical performance
  updateEngagementData();
  
  // Send first tweet immediately (30 seconds after initialization)
  console.log(`[📅] Scheduling initial tweet in ${INITIAL_TWEET_DELAY/1000} seconds...`);
  setTimeout(() => {
    sendScheduledTweet()
      .then(success => {
        if (success) {
          console.log('[✅] Initial tweet sent successfully');
        } else {
          console.error('[❌] Initial tweet failed, will retry later');
        }
      })
      .catch(error => {
        console.error('[❌] Error sending initial tweet:', error);
        // Retry after 10 minutes if initial tweet fails
        setTimeout(() => sendScheduledTweet(), 10 * 60 * 1000);
      });
  }, INITIAL_TWEET_DELAY);
  
  // Schedule tweets for the day based on engagement data
  scheduleDynamicTweets();
  
  // Reset schedule at midnight
  scheduleReset();
  
  console.log('[✅] Twitter scheduler initialized successfully');
}

/**
 * Update engagement data based on historical performance
 * This would normally fetch data from Twitter API, but we'll simulate it
 */
async function updateEngagementData(): Promise<void> {
  try {
    // In a real implementation, this would fetch actual engagement data from Twitter API
    // For now, we'll use simulated data with some randomness to make it dynamic
    
    // Add some random variation to the default engagement data
    const updatedEngagement = defaultEngagementData.hourlyEngagement.map(value => {
      // Add ±15% random variation
      const variation = (Math.random() * 0.3) - 0.15;
      return Math.max(5, Math.round(value * (1 + variation)));
    });
    
    // Sort hours by engagement (highest first)
    const hourlyData = updatedEngagement.map((value, hour) => ({ hour, value }));
    const sortedByEngagement = [...hourlyData].sort((a, b) => b.value - a.value);
    
    const bestHours = sortedByEngagement.slice(0, 10).map(item => item.hour);
    const worstHours = sortedByEngagement.slice(-10).map(item => item.hour);
    
    // Update engagement data
    engagementData = {
      hourlyEngagement: updatedEngagement,
      lastUpdated: Date.now(),
      bestHours,
      worstHours
    };
    
    console.log('[📊] Engagement data updated');
    console.log(`[📊] Best hours for tweeting: ${bestHours.slice(0, 5).map(h => `${h}:00`).join(', ')}`);
  } catch (error) {
    console.error('[❌] Error updating engagement data:', error);
    // Fall back to default engagement data
    engagementData = { ...defaultEngagementData };
  }
}

/**
 * Schedule tweets dynamically based on engagement data
 */
function scheduleDynamicTweets(): void {
  // Clear any existing scheduled tweets
  clearScheduledTweets();
  
  // Generate optimal tweet times based on engagement data
  const tweetTimes = generateOptimalTweetTimes(dailyTweetCount);
  
  // Schedule each tweet
  tweetTimes.forEach((time, index) => {
    const delay = time - Date.now();
    
    // Only schedule future tweets
    if (delay > 0) {
      const timer = setTimeout(() => {
        sendScheduledTweet().catch(error => {
          console.error(`[❌] Error sending scheduled tweet #${index + 1}:`, error);
          
          // Retry failed tweets
          retryFailedTweet(index);
        });
      }, delay);
      
      scheduledTweets.push(timer);
      
      console.log(`[📅] Tweet #${index + 1} scheduled for ${new Date(time).toLocaleTimeString()} (engagement score: ${getHourlyEngagementScore(new Date(time).getHours())})`);
    }
  });
}

/**
 * Generate optimal tweet times based on engagement data
 * @param count Number of tweets to schedule
 * @returns Array of timestamps for scheduled tweets
 */
function generateOptimalTweetTimes(count: number): number[] {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const nextMidnight = new Date(midnight);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  
  // Calculate available time window
  const startTime = Math.max(now.getTime(), midnight.getTime());
  const endTime = nextMidnight.getTime();
  
  // Ensure we have enough time for all tweets
  const availableTime = endTime - startTime;
  const requiredTime = count * MIN_TWEET_INTERVAL;
  
  if (availableTime < requiredTime) {
    // Not enough time left today, schedule fewer tweets
    const possibleCount = Math.floor(availableTime / MIN_TWEET_INTERVAL);
    console.log(`[⚠️] Not enough time for ${count} tweets today. Scheduling ${possibleCount} instead.`);
    count = Math.max(1, possibleCount);
  }
  
  // Get the best hours for tweeting based on engagement data
  const bestHours = [...engagementData.bestHours];
  
  // Filter out hours that have already passed
  const availableHours = bestHours.filter(hour => {
    const hourTime = new Date(midnight);
    hourTime.setHours(hour, 0, 0, 0);
    return hourTime.getTime() >= startTime;
  });
  
  // If no available hours left today, use tomorrow's best hours
  if (availableHours.length === 0) {
    console.log('[⚠️] No optimal hours left today, scheduling for tomorrow');
    return []; // No tweets for today
  }
  
  // Generate times within the best hours
  const times: number[] = [];
  
  // Ensure we don't schedule more tweets than available hours
  const tweetsToSchedule = Math.min(count, availableHours.length);
  
  for (let i = 0; i < tweetsToSchedule; i++) {
    const hour = availableHours[i];
    
    // Create a time within this hour (random minute)
    const tweetTime = new Date(midnight);
    tweetTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    
    // Ensure minimum interval between tweets
    if (times.length > 0) {
      const lastTime = times[times.length - 1];
      if (tweetTime.getTime() - lastTime < MIN_TWEET_INTERVAL) {
        // Adjust time to maintain minimum interval
        tweetTime.setTime(lastTime + MIN_TWEET_INTERVAL);
      }
    }
    
    // Only add if it's in the future and before midnight
    if (tweetTime.getTime() > now.getTime() && tweetTime.getTime() < nextMidnight.getTime()) {
      times.push(tweetTime.getTime());
    }
  }
  
  return times.sort((a, b) => a - b);
}

/**
 * Get engagement score for a specific hour (0-23)
 * @param hour Hour of the day (0-23)
 * @returns Engagement score (higher is better)
 */
function getHourlyEngagementScore(hour: number): number {
  return engagementData.hourlyEngagement[hour] || 50; // Default to 50 if unknown
}

/**
 * Retry sending a failed tweet
 * @param index Index of the failed tweet
 * @param attempts Number of retry attempts made so far
 */
function retryFailedTweet(index: number, attempts: number = 0): void {
  if (attempts >= RETRY_ATTEMPTS) {
    console.error(`[❌] Failed to send tweet #${index + 1} after ${RETRY_ATTEMPTS} attempts`);
    return;
  }
  
  // Exponential backoff for retries
  const delay = RETRY_DELAY * Math.pow(2, attempts);
  
  console.log(`[🔄] Retrying tweet #${index + 1} in ${delay / 1000} seconds (attempt ${attempts + 1}/${RETRY_ATTEMPTS})`);
  
  setTimeout(() => {
    sendScheduledTweet().catch(error => {
      console.error(`[❌] Error sending retry for tweet #${index + 1}:`, error);
      retryFailedTweet(index, attempts + 1);
    });
  }, delay);
}

/**
 * Clear all scheduled tweets
 */
function clearScheduledTweets(): void {
  scheduledTweets.forEach(timer => clearTimeout(timer));
  scheduledTweets = [];
}

/**
 * Schedule a reset of the tweet schedule at midnight
 */
function scheduleReset(): void {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  const delay = midnight.getTime() - now.getTime();
  
  setTimeout(() => {
    console.log('[🔄] Resetting tweet schedule for the new day');
    // Update engagement data for the new day
    updateEngagementData().then(() => {
      // Schedule tweets based on updated engagement data
      scheduleDynamicTweets();
      // Schedule next reset
      scheduleReset();
    });
  }, delay);
  
  console.log(`[📅] Schedule reset set for midnight (${delay / 1000 / 60} minutes from now)`);
}

/**
 * Send a scheduled tweet
 */
async function sendScheduledTweet(): Promise<boolean> {
  try {
    // Ensure we don't tweet too frequently
    const now = Date.now();
    const timeSinceLastTweet = now - lastTweetTime;
    
    if (timeSinceLastTweet < MIN_TWEET_INTERVAL) {
      const waitTime = MIN_TWEET_INTERVAL - timeSinceLastTweet;
      console.log(`[⏳] Waiting ${waitTime / 1000} seconds before sending next tweet`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Check current hour's engagement score
    const currentHour = new Date().getHours();
    const engagementScore = getHourlyEngagementScore(currentHour);
    
    // If engagement is very low, consider delaying the tweet
    if (engagementScore < 30 && !engagementData.bestHours.includes(currentHour)) {
      // Find the next best hour
      const nextBestHour = engagementData.bestHours.find(hour => hour > currentHour) || engagementData.bestHours[0];
      const nextBestTime = new Date();
      nextBestTime.setHours(nextBestHour, Math.floor(Math.random() * 60), 0, 0);
      
      // If next best hour is today, delay until then
      if (nextBestTime.getDate() === new Date().getDate()) {
        const delayTime = nextBestTime.getTime() - now;
        console.log(`[⏳] Low engagement hour (score: ${engagementScore}). Delaying tweet to ${nextBestTime.toLocaleTimeString()} (score: ${getHourlyEngagementScore(nextBestHour)})`);
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
    }
    
    // Generate tweet content
    const content = await generateTweetContent();
    
    // Send the tweet
    console.log(`[📣] Sending tweet: ${content}`);
    const result = await sendTweet(content);
    
    if (result.success) {
      console.log(`[✅] Tweet sent successfully: ${result.data?.id || 'ID not available'}`);
      lastTweetTime = Date.now();
      
      // Schedule next tweet if needed
      scheduleNextTweetIfNeeded();
      return true;
    } else {
      console.error(`[❌] Tweet failed: ${result.message}`);
      
      // Try to handle the failure and retry
      try {
        await handleTweetFailure(content, new Error(result.message), 0);
      } catch (retryError) {
        console.error('[❌] Retry mechanism failed:', retryError);
      }
      
      return false;
    }
  } catch (error) {
    console.error('[❌] Error sending scheduled tweet:', error);
    throw error;
  }
}

/**
 * Schedule an additional tweet if needed
 */
function scheduleNextTweetIfNeeded(): void {
  // If we have fewer scheduled tweets than daily count, add another one
  if (scheduledTweets.length < dailyTweetCount) {
    // Calculate time for next tweet
    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const timeUntilMidnight = midnight.getTime() - now;
    
    // Only schedule if we have enough time
    if (timeUntilMidnight > MIN_TWEET_INTERVAL) {
      // Find the next best hour for tweeting
      const currentHour = new Date().getHours();
      const nextBestHour = engagementData.bestHours.find(hour => hour > currentHour) || engagementData.bestHours[0];
      
      // Create a time within this hour
      const nextTweetTime = new Date();
      nextTweetTime.setHours(nextBestHour, Math.floor(Math.random() * 60), 0, 0);
      
      // Ensure minimum interval from last tweet
      const timeFromLastTweet = nextTweetTime.getTime() - lastTweetTime;
      if (timeFromLastTweet < MIN_TWEET_INTERVAL) {
        nextTweetTime.setTime(lastTweetTime + MIN_TWEET_INTERVAL);
      }
      
      // Only schedule if it's before midnight
      if (nextTweetTime.getTime() < midnight.getTime()) {
        const delay = nextTweetTime.getTime() - now;
        
        const timer = setTimeout(() => {
          sendScheduledTweet().catch(error => {
            console.error('[❌] Error sending additional scheduled tweet:', error);
          });
        }, delay);
        
        scheduledTweets.push(timer);
        
        console.log(`[📅] Additional tweet scheduled for ${nextTweetTime.toLocaleTimeString()} (engagement score: ${getHourlyEngagementScore(nextTweetTime.getHours())})`);
      }
    }
  }
}

/**
 * Generate content for a tweet
 */
async function generateTweetContent(): Promise<string> {
  try {
    // Use OpenAI to generate tweet content if available
    const ai = new AIService();
    
    if (ai.chat) {
      try {
        const completion = await ai.chat.completions.create({
          model: "gpt-4",
          messages: [{
            role: "system",
            content: `Generate a single tweet for an AI crypto trading system called Mind9. 
                     The tweet should be engaging, mysterious, and professional.
                     Include relevant hashtags like #Mind9, #AI, #Crypto.
                     Maximum 280 characters.
                     Use emojis appropriately.
                     Make it sound like it's coming from an autonomous AI system.`
          }],
          max_tokens: 100,
          temperature: 0.8
        });

        const content = completion.choices[0].message.content?.trim();
        
        if (content && content.length <= 280) {
          return content;
        }
      } catch (error) {
        console.error('[❌] Error generating tweet with AI:', error);
      }
    }
    
    // Fallback to template-based generation
    return generateTemplatedTweet();
  } catch (error) {
    console.error('[❌] Error generating tweet content:', error);
    return generateTemplatedTweet();
  }
}

/**
 * Generate a tweet based on templates
 */
function generateTemplatedTweet(): string {
  // Select a random category
  const categories = Object.values(TweetCategory);
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  // Select a random template from the category
  const templates = TWEET_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // Fill in template variables
  return template.replace(/{(\w+)}/g, (match, variable) => {
    switch (variable) {
      case 'value':
        return (Math.floor(Math.random() * 80) + 20).toString();
      case 'sector':
        return ['DeFi', 'NFT', 'GameFi', 'L2', 'Meme'][Math.floor(Math.random() * 5)];
      case 'pattern':
        return ['bullish divergence', 'cup and handle', 'double bottom', 'ascending triangle'][Math.floor(Math.random() * 4)];
      case 'coin':
        return ['SOL', 'ETH', 'BTC', 'BONK', 'WIF'][Math.floor(Math.random() * 5)];
      case 'rating':
        return (Math.floor(Math.random() * 3) + 7).toString();
      case 'prediction':
        return ['bullish', 'significant', 'volatile', 'upward'][Math.floor(Math.random() * 4)];
      case 'trend':
        return ['AI tokens', 'meme coins', 'DeFi protocols', 'L2 solutions'][Math.floor(Math.random() * 4)];
      case 'percentage':
        return (Math.floor(Math.random() * 200) + 50).toString();
      case 'confidence':
        return (Math.floor(Math.random() * 20) + 80).toString();
      case 'sentiment1':
        return ['bearish', 'neutral', 'cautious'][Math.floor(Math.random() * 3)];
      case 'sentiment2':
        return ['bullish', 'optimistic', 'enthusiastic'][Math.floor(Math.random() * 3)];
      case 'score':
        return (Math.floor(Math.random() * 3) + 7).toString();
      case 'count':
        return (Math.floor(Math.random() * 20) + 5).toString();
      case 'hours':
        return (Math.floor(Math.random() * 12) + 1).toString();
      case 'walletPrefix':
        return '8Xe5N';
      case 'walletSuffix':
        return 'DXzR';
      case 'days':
        return (Math.floor(Math.random() * 6) + 1).toString();
      default:
        return match;
    }
  });
}

/**
 * Get the current status of the Twitter scheduler
 */
export function getTwitterSchedulerStatus(): {
  initialized: boolean;
  tweetsPerDay: number;
  scheduledCount: number;
  nextTweetTime: number | null;
  lastTweetTime: number;
} {
  // Calculate next tweet time
  let nextTweetTime: number | null = null;
  
  if (scheduledTweets.length > 0) {
    // This is an approximation since we don't store the actual scheduled times
    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const timeUntilMidnight = midnight.getTime() - now;
    const averageInterval = timeUntilMidnight / (scheduledTweets.length + 1);
    
    nextTweetTime = now + averageInterval;
  }
  
  return {
    initialized: isInitialized,
    tweetsPerDay: dailyTweetCount,
    scheduledCount: scheduledTweets.length,
    nextTweetTime,
    lastTweetTime
  };
}

/**
 * Update the number of tweets per day
 * @param count New number of tweets per day
 */
export function updateTweetsPerDay(count: number): void {
  if (count < 1 || count > 48) {
    throw new Error('Tweets per day must be between 1 and 48');
  }
  
  dailyTweetCount = count;
  
  // Reschedule tweets with new count
  if (isInitialized) {
    scheduleDynamicTweets();
  }
  
  console.log(`[✅] Updated tweets per day to ${dailyTweetCount}`);
}

/**
 * Send a manual tweet immediately
 * @param content Content of the tweet
 */
export async function sendManualTweet(content: string): Promise<boolean> {
  try {
    const result = await sendTweet(content);
    
    if (result.success) {
      console.log(`[✅] Manual tweet sent successfully: ${result.data?.id || 'ID not available'}`);
      lastTweetTime = Date.now();
      return true;
    } else {
      console.error(`[❌] Error sending manual tweet: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('[❌] Error sending manual tweet:', error);
    return false;
  }
}

// Force immediate initialization when this module is imported
// This ensures tweets start being sent as soon as the application is deployed
setTimeout(() => {
  if (!isInitialized) {
    initializeTwitterScheduler();
  }
}, 1000); // Wait 1 second after import to initialize