import React, { useState } from 'react';
import { Trophy, Users, X } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<'engagers' | 'lucky'>('engagers');
  
  // Mock data for demonstration
  const topEngagers = [
    {
      id: '1',
      wallet_address: '8Xe5N4KF8PPtBvY9JvPBxiMv4zkzQ4RmMetgNuJRDXzR',
      twitter_username: 'crypto_whale',
      engagement_score: 95
    },
    {
      id: '2',
      wallet_address: 'owDmhKhbP8P5p5y2vwEWK4LpaX7sdC4ZY1BLSmKq2oq',
      twitter_username: 'meme_trader',
      engagement_score: 87
    },
    {
      id: '3',
      wallet_address: '3nV4fFHeY3kJbTqFA8yQyrtBA31qvED4kXi8gjQVckze',
      twitter_username: 'ai_enthusiast',
      engagement_score: 76
    }
  ];
  
  const luckyTraders = [
    {
      id: '1',
      user_profiles: {
        wallet_address: '5JAeM8wrmFMmUe56dvi6v5TxdrNj6UuuXiwEUTD1u7nP',
        twitter_username: 'lucky_one'
      },
      selection_date: new Date().toISOString(),
      reward_status: 'claimed'
    },
    {
      id: '2',
      user_profiles: {
        wallet_address: '8Xe5N4KF8PPtBvY9JvPBxiMv4zkzQ4RmMetgNuJRDXzR',
        twitter_username: 'crypto_whale'
      },
      selection_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      reward_status: 'pending'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-2xl w-full mx-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-green-500 hover:text-green-400"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <Trophy className="text-green-500" size={24} />
          <h2 className="text-2xl font-bold text-green-400">Mind9 Leaderboard</h2>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('engagers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'engagers'
                ? 'bg-green-500 text-black'
                : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
            }`}
          >
            <Users size={18} />
            Top Engagers
          </button>
          <button
            onClick={() => setActiveTab('lucky')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'lucky'
                ? 'bg-green-500 text-black'
                : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
            }`}
          >
            <Trophy size={18} />
            Lucky Traders
          </button>
        </div>

        {activeTab === 'engagers' ? (
          <div className="space-y-4">
            {topEngagers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 border border-green-500/20 rounded-lg bg-green-500/5"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-500 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-green-400">
                      {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                    </span>
                    {user.twitter_username && (
                      <span className="text-sm text-green-500/75">
                        @{user.twitter_username}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-green-500/75">
                      Engagement Score: {user.engagement_score}
                    </div>
                    <div className="h-2 bg-green-500/20 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (user.engagement_score / (topEngagers[0]?.engagement_score || 1)) * 100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {luckyTraders.map((selection) => (
              <div
                key={selection.id}
                className="flex items-center gap-4 p-4 border border-green-500/20 rounded-lg bg-green-500/5"
              >
                <Trophy
                  size={24}
                  className={
                    selection.reward_status === 'claimed'
                      ? 'text-yellow-500'
                      : 'text-green-500/50'
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-green-400">
                      {selection.user_profiles.wallet_address.slice(0, 6)}...
                      {selection.user_profiles.wallet_address.slice(-4)}
                    </span>
                    {selection.user_profiles.twitter_username && (
                      <span className="text-sm text-green-500/75">
                        @{selection.user_profiles.twitter_username}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-green-500/75">
                      Selected: {new Date(selection.selection_date).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        selection.reward_status === 'claimed'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-green-500/20 text-green-500'
                      }`}
                    >
                      {selection.reward_status.charAt(0).toUpperCase() +
                        selection.reward_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}