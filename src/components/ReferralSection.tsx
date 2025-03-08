import React from 'react';
import { Share2, Twitter, Trophy, Users, Heart, MessageCircle, Repeat } from 'lucide-react';

export function ReferralSection() {
  const handleFollow = () => {
    window.open('https://twitter.com/mind9ai', '_blank');
  };

  const handleRetweet = () => {
    window.open('https://twitter.com/intent/retweet?tweet_id=LATEST_TWEET_ID', '_blank');
  };

  const handleLike = () => {
    window.open('https://twitter.com/intent/like?tweet_id=LATEST_TWEET_ID', '_blank');
  };

  const handleComment = () => {
    window.open('https://twitter.com/intent/tweet?in_reply_to=LATEST_TWEET_ID', '_blank');
  };

  return (
    <div className="border border-green-500/30 rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="text-green-500" size={24} />
        <h2 className="text-2xl font-bold text-green-400">Referral & Engagement Program</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Twitter className="text-green-500 mt-1" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-green-400 mb-4">Twitter Engagement</h3>
              <div className="grid grid-cols-1 gap-3">
                {/* Follow Button */}
                <div className="group relative overflow-hidden rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 transition-colors hover:bg-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-blue-400">Follow @mind9ai</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-500/75">Earn</span>
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-sm font-medium text-blue-400">
                          +10 points
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleFollow}
                      className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      <Twitter size={18} />
                      Follow
                    </button>
                  </div>
                </div>

                {/* Retweet Button */}
                <div className="group relative overflow-hidden rounded-lg border border-green-500/30 bg-green-500/5 p-4 transition-colors hover:bg-green-500/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-green-400">Retweet Latest</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-500/75">Earn</span>
                        <span className="rounded bg-green-500/20 px-2 py-0.5 text-sm font-medium text-green-400">
                          +5 points
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRetweet}
                      className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-black transition-all hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/25"
                    >
                      <Repeat size={18} />
                      Retweet
                    </button>
                  </div>
                </div>

                {/* Like Button */}
                <div className="group relative overflow-hidden rounded-lg border border-pink-500/30 bg-pink-500/5 p-4 transition-colors hover:bg-pink-500/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-pink-400">Like Post</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-pink-500/75">Earn</span>
                        <span className="rounded bg-pink-500/20 px-2 py-0.5 text-sm font-medium text-pink-400">
                          +3 points
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleLike}
                      className="flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 font-medium text-white transition-all hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/25"
                    >
                      <Heart size={18} />
                      Like
                    </button>
                  </div>
                </div>

                {/* Comment Button */}
                <div className="group relative overflow-hidden rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 transition-colors hover:bg-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-blue-400">Leave Comment</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-500/75">Earn</span>
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-sm font-medium text-blue-400">
                          +5 points
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleComment}
                      className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      <MessageCircle size={18} />
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-start gap-3">
              <Trophy className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-green-400">Lucky Trader Selection</h3>
                <p className="text-sm text-green-500/75 mt-2">
                  Every week, our AI randomly selects a Lucky Trader. The more points you earn, the higher your chances of being selected!
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-start gap-3">
              <Users className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-green-400">Community Rankings</h3>
                <p className="text-sm text-green-500/75 mt-2">
                  Compete with other traders and climb the leaderboard. Top engagers receive special benefits and increased selection odds.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-start gap-3">
              <Share2 className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-green-400">Referral Rewards</h3>
                <p className="text-sm text-green-500/75 mt-2">
                  Share your unique referral link and earn bonus points when new users join through your link!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <h4 className="text-lg font-semibold text-green-400 mb-2">Next Lucky Trader Selection</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: '45%' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-green-500/75">
              <span>3 days remaining</span>
              <span>Weekly Selection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}