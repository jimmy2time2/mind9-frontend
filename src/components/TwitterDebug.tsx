import React, { useState, useEffect } from 'react';
import { Twitter, AlertCircle, Check, RefreshCw, AlertTriangle, Lock, Eye, EyeOff, Send } from 'lucide-react';
import { testTwitterAPI } from '../lib/twitterTest';
import { isUsingMockClient } from '../lib/twitterClient';
import { getTwitterSchedulerStatus, updateTweetsPerDay, sendManualTweet } from '../lib/twitterScheduler';

export function TwitterDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    isMock?: boolean;
  } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [schedulerStatus, setSchedulerStatus] = useState<{
    initialized: boolean;
    tweetsPerDay: number;
    scheduledCount: number;
    nextTweetTime: number | null;
    lastTweetTime: number;
  } | null>(null);
  const [tweetsPerDay, setTweetsPerDay] = useState(10);
  const [manualTweet, setManualTweet] = useState('');
  const [isSendingTweet, setIsSendingTweet] = useState(false);
  const [tweetResult, setTweetResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Admin password - in a real app, this would be server-side
  // For demo purposes only - this is not secure
  const ADMIN_PASSWORD = 'mind9admin2025';
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 300; // 5 minutes in seconds

  useEffect(() => {
    if (isLocked && lockTimer > 0) {
      const timer = setTimeout(() => {
        setLockTimer(lockTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTimer === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [isLocked, lockTimer]);

  useEffect(() => {
    if (isAuthorized) {
      // Get scheduler status
      try {
        const status = getTwitterSchedulerStatus();
        setSchedulerStatus(status);
        setTweetsPerDay(status.tweetsPerDay);
      } catch (error) {
        console.error('Error getting scheduler status:', error);
      }
      
      // Set up interval to refresh scheduler status
      const interval = setInterval(() => {
        try {
          const status = getTwitterSchedulerStatus();
          setSchedulerStatus(status);
        } catch (error) {
          console.error('Error refreshing scheduler status:', error);
        }
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  const handleTest = async () => {
    if (!isAuthorized) return;
    
    setIsLoading(true);
    try {
      const testResult = await testTwitterAPI();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (isLocked) return;
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockTimer(LOCK_TIME);
      }
      
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPassword('');
    setResult(null);
    setSchedulerStatus(null);
    setTweetResult(null);
  };

  const handleUpdateTweetsPerDay = () => {
    try {
      updateTweetsPerDay(tweetsPerDay);
      
      // Update scheduler status
      const status = getTwitterSchedulerStatus();
      setSchedulerStatus(status);
      
      setTweetResult({
        success: true,
        message: `Successfully updated tweets per day to ${tweetsPerDay}`
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setTweetResult(null), 3000);
    } catch (error) {
      setTweetResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleSendManualTweet = async () => {
    if (!manualTweet.trim()) return;
    
    setIsSendingTweet(true);
    try {
      const success = await sendManualTweet(manualTweet);
      
      setTweetResult({
        success,
        message: success ? 'Tweet sent successfully' : 'Failed to send tweet'
      });
      
      if (success) {
        setManualTweet('');
        
        // Update scheduler status
        const status = getTwitterSchedulerStatus();
        setSchedulerStatus(status);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setTweetResult(null), 3000);
    } catch (error) {
      setTweetResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSendingTweet(false);
    }
  };

  const handleSendTestTweet = async () => {
    setIsSendingTweet(true);
    setManualTweet("Mind9 AI test tweet: Verifying autonomous posting system. 🚀 #Mind9 #AI #Crypto");
    
    try {
      const success = await sendManualTweet("Mind9 AI test tweet: Verifying autonomous posting system. 🚀 #Mind9 #AI #Crypto");
      
      setTweetResult({
        success,
        message: success 
          ? '✅ Twitter API working: Test tweet posted successfully.' 
          : 'Failed to send test tweet'
      });
      
      // Update scheduler status
      const status = getTwitterSchedulerStatus();
      setSchedulerStatus(status);
      
      // Clear success message after 5 seconds
      setTimeout(() => setTweetResult(null), 5000);
    } catch (error) {
      setTweetResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSendingTweet(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthorized) {
    return (
      <div className="border border-green-500/30 rounded-lg p-6 bg-black/50 space-y-4">
        <div className="flex items-center gap-3">
          <Lock className="text-green-500" size={24} />
          <h2 className="text-xl font-bold text-green-400">System Diagnostics</h2>
        </div>
        
        <div className="p-4 rounded-lg bg-black/30 border border-green-500/20">
          <p className="text-green-500/90 mb-4">
            This area contains sensitive system diagnostics and is restricted to authorized personnel only.
          </p>
          
          {isLocked ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
              <AlertCircle className="mx-auto text-red-400 mb-2" size={24} />
              <p className="text-red-400 font-medium">Access temporarily locked</p>
              <p className="text-red-400/75 text-sm mt-1">
                Too many failed attempts. Please try again in {formatTime(lockTimer)}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin password"
                  className="w-full bg-black border border-green-500/30 rounded-lg px-3 py-2 text-green-400 placeholder-green-500/50"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-green-500/50 hover:text-green-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <button
                onClick={handleLogin}
                className="w-full bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Authenticate
              </button>
              
              {attempts > 0 && (
                <p className="text-yellow-400 text-xs text-center">
                  Invalid password. Attempts: {attempts}/{MAX_ATTEMPTS}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-green-500/30 rounded-lg p-6 bg-black/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Twitter className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-green-400">System Diagnostics</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Test Connection
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
          >
            <Lock size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Twitter Scheduler Status */}
      <div className="p-4 rounded-lg bg-black/30 border border-green-500/20">
        <h3 className="text-lg font-semibold text-green-400 mb-3">Twitter Scheduler Status</h3>
        
        {schedulerStatus ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-black/50 rounded border border-green-500/20">
                <div className="text-sm font-semibold text-green-400">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  {schedulerStatus.initialized ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <Check size={16} />
                      Initialized
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertCircle size={16} />
                      Not Initialized
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-black/50 rounded border border-green-500/20">
                <div className="text-sm font-semibold text-green-400">Tweets Per Day</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-green-500">{schedulerStatus.tweetsPerDay}</span>
                </div>
              </div>
              
              <div className="p-3 bg-black/50 rounded border border-green-500/20">
                <div className="text-sm font-semibold text-green-400">Scheduled Tweets</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-green-500">{schedulerStatus.scheduledCount}</span>
                </div>
              </div>
              
              <div className="p-3 bg-black/50 rounded border border-green-500/20">
                <div className="text-sm font-semibold text-green-400">Last Tweet</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-green-500">
                    {schedulerStatus.lastTweetTime ? 
                      new Date(schedulerStatus.lastTweetTime).toLocaleTimeString() : 
                      'No tweets sent yet'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-black/50 rounded border border-green-500/20">
              <div className="text-sm font-semibold text-green-400">Next Tweet</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-500">
                  {schedulerStatus.nextTweetTime ? 
                    new Date(schedulerStatus.nextTweetTime).toLocaleTimeString() : 
                    'No tweets scheduled'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm text-green-500/75 mb-1 block">Tweets Per Day</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={tweetsPerDay}
                  onChange={(e) => setTweetsPerDay(parseInt(e.target.value) || 10)}
                  className="w-full bg-black border border-green-500/30 rounded-lg px-3 py-2 text-green-400"
                />
              </div>
              <div className="pt-6">
                <button
                  onClick={handleUpdateTweetsPerDay}
                  className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-green-500/50">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Loading scheduler status...
          </div>
        )}
      </div>

      {/* Twitter API Test */}
      <div className="p-4 rounded-lg bg-black/30 border border-green-500/20">
        <h3 className="text-lg font-semibold text-green-400 mb-3">Twitter API Test</h3>
        
        <div className="space-y-4">
          <p className="text-green-500/75">
            Send a test tweet to verify the Twitter API is working correctly. This will post a tweet with the following content:
          </p>
          
          <div className="p-3 bg-black/50 rounded border border-green-500/20 text-green-400">
            Mind9 AI test tweet: Verifying autonomous posting system. 🚀 #Mind9 #AI #Crypto
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSendTestTweet}
              disabled={isSendingTweet}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingTweet ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Sending Test Tweet...
                </>
              ) : (
                <>
                  <Twitter size={18} />
                  Send Test Tweet
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Tweet */}
      <div className="p-4 rounded-lg bg-black/30 border border-green-500/20">
        <h3 className="text-lg font-semibold text-green-400 mb-3">Send Manual Tweet</h3>
        
        <div className="space-y-4">
          <textarea
            value={manualTweet}
            onChange={(e) => setManualTweet(e.target.value)}
            placeholder="Enter tweet content..."
            className="w-full bg-black border border-green-500/30 rounded-lg px-3 py-2 text-green-400 placeholder-green-500/50 min-h-[100px]"
            maxLength={280}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-500/75">
              {manualTweet.length}/280 characters
            </div>
            
            <button
              onClick={handleSendManualTweet}
              disabled={!manualTweet.trim() || isSendingTweet}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingTweet ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Tweet
                </>
              )}
            </button>
          </div>
          
          {tweetResult && (
            <div className={`p-3 rounded-lg ${
              tweetResult.success 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {tweetResult.success ? (
                <div className="flex items-center gap-2">
                  <Check size={18} />
                  <span>{tweetResult.message}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span>{tweetResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isUsingMockClient() && (
        <div className="p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-400 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-400">
                Using Mock Twitter Client
              </h3>
              <p className="text-sm mt-1 text-yellow-500/90">
                The system is currently using a mock Twitter client. Tweets will be logged to the console but not actually posted to Twitter.
                This is a fallback mechanism when the real Twitter API client fails to initialize or when API credentials are missing.
              </p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-lg ${
          result.success 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <Check className="text-green-400 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-400 mt-0.5" size={20} />
            )}
            <div>
              <h3 className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'Connection Successful' : 'Connection Failed'}
                {result.success && result.isMock && ' (Mock)'}
              </h3>
              <p className="text-sm mt-1">
                {result.message}
              </p>
              {result.isMock && (
                <p className="text-sm mt-1 text-yellow-400">
                  Note: This is using the mock Twitter client. No actual tweets were posted to Twitter.
                </p>
              )}
              {result.data && (
                <div className="mt-2 p-2 bg-black/50 rounded border border-green-500/20 font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-green-500/20 pt-4 text-sm text-green-500/75">
        <h3 className="font-semibold text-green-400 mb-2">Troubleshooting Steps:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Verify Twitter API credentials in the .env file</li>
          <li>Check for rate limits or account restrictions</li>
          <li>Ensure the Twitter account has proper developer permissions</li>
          <li>Verify network connectivity to Twitter's API endpoints</li>
          <li>Check for any recent Twitter API policy changes</li>
        </ol>
      </div>

      <div className="border-t border-green-500/20 pt-4 mt-4">
        <h3 className="font-semibold text-green-400 mb-2">Environment Variables:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-black/30 rounded border border-green-500/20">
            <div className="text-sm font-semibold text-green-400">VITE_TWITTER_API_KEY</div>
            <div className="text-xs mt-1 font-mono">
              {import.meta.env.VITE_TWITTER_API_KEY ? 
                `${import.meta.env.VITE_TWITTER_API_KEY.substring(0, 2)}${'*'.repeat(6)}${import.meta.env.VITE_TWITTER_API_KEY.substring(import.meta.env.VITE_TWITTER_API_KEY.length - 2)}` : 
                'Not set'}
            </div>
          </div>
          <div className="p-3 bg-black/30 rounded border border-green-500/20">
            <div className="text-sm font-semibold text-green-400">VITE_TWITTER_API_SECRET</div>
            <div className="text-xs mt-1 font-mono">
              {import.meta.env.VITE_TWITTER_API_SECRET ? 
                `${import.meta.env.VITE_TWITTER_API_SECRET.substring(0, 2)}${'*'.repeat(10)}${import.meta.env.VITE_TWITTER_API_SECRET.substring(import.meta.env.VITE_TWITTER_API_SECRET.length - 2)}` : 
                'Not set'}
            </div>
          </div>
          <div className="p-3 bg-black/30 rounded border border-green-500/20">
            <div className="text-sm font-semibold text-green-400">VITE_TWITTER_ACCESS_TOKEN</div>
            <div className="text-xs mt-1 font-mono">
              {import.meta.env.VITE_TWITTER_ACCESS_TOKEN ? 
                `${import.meta.env.VITE_TWITTER_ACCESS_TOKEN.substring(0, 2)}${'*'.repeat(10)}${import.meta.env.VITE_TWITTER_ACCESS_TOKEN.substring(import.meta.env.VITE_TWITTER_ACCESS_TOKEN.length - 2)}` : 
                'Not set'}
            </div>
          </div>
          <div className="p-3 bg-black/30 rounded border border-green-500/20">
            <div className="text-sm font-semibold text-green-400">VITE_TWITTER_ACCESS_SECRET</div>
            <div className="text-xs mt-1 font-mono">
              {import.meta.env.VITE_TWITTER_ACCESS_SECRET ? 
                `${import.meta.env.VITE_TWITTER_ACCESS_SECRET.substring(0, 2)}${'*'.repeat(10)}${import.meta.env.VITE_TWITTER_ACCESS_SECRET.substring(import.meta.env.VITE_TWITTER_ACCESS_SECRET.length - 2)}` : 
                'Not set'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}