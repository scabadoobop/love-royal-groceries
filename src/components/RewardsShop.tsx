import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './RewardsShop.css';

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  is_available: boolean;
  stock_quantity: number | null;
  created_by_name: string;
}

interface Redemption {
  id: string;
  reward_name: string;
  reward_description: string;
  points_spent: number;
  redeemed_at: string;
  status: string;
}

interface RewardsShopProps {
  availablePoints: number;
  onRedeem: () => void;
}

export default function RewardsShop({ availablePoints, onRedeem }: RewardsShopProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRewards(),
        loadRedemptions()
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRewards = async () => {
    try {
      const response = await apiService.getRewards();
      if (response.data) {
        setRewards(response.data.rewards);
      }
    } catch (err) {
      console.error('Failed to load rewards:', err);
    }
  };

  const loadRedemptions = async () => {
    try {
      const response = await apiService.getMyRedemptions();
      if (response.data) {
        setRedemptions(response.data.redemptions);
      }
    } catch (err) {
      console.error('Failed to load redemptions:', err);
    }
  };


  const requestRedemption = async (rewardId: string) => {
    if (!confirm('Request this reward? An admin will need to approve your request.')) return;

    try {
      const response = await apiService.redeemReward(rewardId);
      if (response.data) {
        onRedeem(); // Refresh points
        loadRewards();
        loadRedemptions();
        setError('');
      } else {
        setError(response.error || 'Failed to request redemption');
      }
    } catch (err) {
      setError('Failed to request redemption');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading rewards...</p>
      </div>
    );
  }

  return (
    <div className="rewards-shop">
      <div className="shop-header">
        <h2>🎁 Rewards Shop</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="error-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="shop-tabs">
        <button 
          className={`shop-tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🛒 Shop
        </button>
        <button 
          className={`shop-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 My Redemptions
        </button>
      </div>

      {activeTab === 'shop' && (
        <>
          <div className="shop-intro">
            💎 You have <strong>{availablePoints} points</strong> available. Request a reward and wait for admin approval!
          </div>

          {rewards.length === 0 ? (
            <div className="shop-note">No rewards available yet.</div>
          ) : (
            <div className="rewards-grid">
              {rewards.map(reward => (
                <div 
                  key={reward.id} 
                  className={`reward-card ${!reward.is_available ? 'unavailable' : ''} ${reward.stock_quantity !== null && reward.stock_quantity === 0 ? 'out-of-stock' : ''}`}
                >
                  <div className="reward-content">
                    <h4>{reward.name}</h4>
                    {reward.description && (
                      <p className="reward-description">{reward.description}</p>
                    )}
                    <div className="reward-cost">
                      <span className="cost-icon">💎</span>
                      <span>{reward.points_cost} points</span>
                    </div>
                    {reward.stock_quantity !== null && (
                      <div className="reward-stock">
                        {reward.stock_quantity > 0 ? (
                          <span>Stock: {reward.stock_quantity}</span>
                        ) : (
                          <span className="out-of-stock-text">Out of Stock</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="reward-actions">
                    {reward.is_available && (reward.stock_quantity === null || reward.stock_quantity > 0) && availablePoints >= reward.points_cost ? (
                      <button
                        className="royal-button primary"
                        onClick={() => requestRedemption(reward.id)}
                      >
                        📝 Request Redemption
                      </button>
                    ) : (
                      <span className="reward-unavailable">
                        {!reward.is_available ? 'Unavailable' : availablePoints < reward.points_cost ? 'Not enough points' : 'Out of stock'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="redemptions-view">
          <h3>📜 My Redemptions</h3>
          <div className="redemptions-list">
            {redemptions.length === 0 ? (
              <p>You haven't requested any redemptions yet.</p>
            ) : (
              redemptions.map(redemption => (
                <div key={redemption.id} className={`redemption-card ${redemption.status}`}>
                  <div className="redemption-content">
                    <div className="redemption-header">
                      <h4>{redemption.reward_name}</h4>
                      <span className={`status-badge ${redemption.status}`}>
                        {redemption.status}
                      </span>
                    </div>
                    {redemption.reward_description && (
                      <p>{redemption.reward_description}</p>
                    )}
                    <div className="redemption-meta">
                      <span>💎 {redemption.points_spent} points</span>
                      <span>{new Date(redemption.redeemed_at).toLocaleString()}</span>
                    </div>
                    {redemption.status === 'pending' && (
                      <p className="redemption-note">⏳ Waiting for admin approval. Points will be deducted when approved.</p>
                    )}
                    {redemption.status === 'approved' && (
                      <p className="redemption-note">✅ Approved! Points have been deducted. Waiting to be fulfilled.</p>
                    )}
                    {redemption.status === 'denied' && (
                      <p className="redemption-note">❌ Request denied. Points were not deducted.</p>
                    )}
                    {redemption.status === 'fulfilled' && (
                      <p className="redemption-note">🎉 Reward fulfilled!</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
