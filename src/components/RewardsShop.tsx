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
  userRole?: string;
  availablePoints: number;
  onRedeem: () => void;
}

export default function RewardsShop({ userRole = 'member', availablePoints, onRedeem }: RewardsShopProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewReward, setShowNewReward] = useState(false);
  const [newReward, setNewReward] = useState({ 
    name: '', 
    description: '', 
    points_cost: 50,
    stock_quantity: '',
    hasStock: false
  });
  // const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');

  const isAdmin = userRole === 'admin';

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

  const createReward = async () => {
    if (!newReward.name || !newReward.points_cost) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await apiService.createReward(
        newReward.name,
        newReward.description,
        newReward.points_cost,
        newReward.hasStock && newReward.stock_quantity ? parseInt(newReward.stock_quantity) : undefined
      );

      if (response.data) {
        setShowNewReward(false);
        setNewReward({ name: '', description: '', points_cost: 50, stock_quantity: '', hasStock: false });
        loadRewards();
      } else {
        setError(response.error || 'Failed to create reward');
      }
    } catch (err) {
      setError('Failed to create reward');
    }
  };

  // const updateReward = async (reward: Reward) => {
  //   try {
  //     const response = await apiService.updateReward(reward.id, {
  //       name: reward.name,
  //       description: reward.description,
  //       points_cost: reward.points_cost,
  //       stock_quantity: reward.stock_quantity ?? undefined,
  //       is_available: reward.is_available
  //     });
  //     if (response.data) {
  //       setEditingReward(null);
  //       loadRewards();
  //     } else {
  //       setError(response.error || 'Failed to update reward');
  //     }
  //   } catch (err) {
  //     setError('Failed to update reward');
  //   }
  // };

  const deleteReward = async (rewardId: string) => {
    if (!confirm('Delete this reward?')) return;

    try {
      const response = await apiService.deleteReward(rewardId);
      if (response.data !== undefined) {
        loadRewards();
      } else {
        setError(response.error || 'Failed to delete reward');
      }
    } catch (err) {
      setError('Failed to delete reward');
    }
  };

  const redeemReward = async (rewardId: string) => {
    if (!confirm('Redeem this reward?')) return;

    try {
      const response = await apiService.redeemReward(rewardId);
      if (response.data) {
        onRedeem(); // Refresh points
        loadRewards();
        loadRedemptions();
      } else {
        setError(response.error || 'Failed to redeem reward');
      }
    } catch (err) {
      setError('Failed to redeem reward');
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
        {isAdmin && (
          <button 
            className="royal-button primary"
            onClick={() => setShowNewReward(!showNewReward)}
          >
            {showNewReward ? 'Cancel' : '+ New Reward'}
          </button>
        )}
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
          {showNewReward && isAdmin && (
            <div className="reward-form">
              <h3>Create New Reward</h3>
              <div className="form-group">
                <label>Name *</label>
                <input
                  className="royal-input"
                  value={newReward.name}
                  onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                  placeholder="Reward name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="royal-textarea"
                  value={newReward.description}
                  onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                  placeholder="Reward description"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Points Cost *</label>
                <input
                  type="number"
                  className="royal-input"
                  value={newReward.points_cost}
                  onChange={(e) => setNewReward({...newReward, points_cost: parseInt(e.target.value) || 0})}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newReward.hasStock}
                    onChange={(e) => setNewReward({...newReward, hasStock: e.target.checked})}
                  />
                  Track Stock
                </label>
                {newReward.hasStock && (
                  <input
                    type="number"
                    className="royal-input"
                    value={newReward.stock_quantity}
                    onChange={(e) => setNewReward({...newReward, stock_quantity: e.target.value})}
                    placeholder="Stock quantity"
                    min="0"
                  />
                )}
              </div>
              <button className="royal-button primary" onClick={createReward}>
                Create Reward
              </button>
            </div>
          )}

          <div className="shop-intro">
            💎 You have <strong>{availablePoints} points</strong> available to redeem!
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
                    {isAdmin ? (
                      <>
                        <button
                          className="royal-button small"
                          onClick={() => {/* TODO: Implement edit */}}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="royal-button small danger"
                          onClick={() => deleteReward(reward.id)}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    ) : reward.is_available && (reward.stock_quantity === null || reward.stock_quantity > 0) && availablePoints >= reward.points_cost ? (
                      <button
                        className="royal-button primary"
                        onClick={() => redeemReward(reward.id)}
                      >
                        🛒 Redeem
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
          <h3>📜 My Redemption History</h3>
          <div className="redemptions-list">
            {redemptions.length === 0 ? (
              <p>You haven't redeemed any rewards yet.</p>
            ) : (
              redemptions.map(redemption => (
                <div key={redemption.id} className="redemption-card">
                  <div className="redemption-content">
                    <h4>{redemption.reward_name}</h4>
                    {redemption.reward_description && (
                      <p>{redemption.reward_description}</p>
                    )}
                    <div className="redemption-meta">
                      <span>💎 {redemption.points_spent} points</span>
                      <span>{new Date(redemption.redeemed_at).toLocaleString()}</span>
                      <span className={`status-badge ${redemption.status}`}>
                        {redemption.status}
                      </span>
                    </div>
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
