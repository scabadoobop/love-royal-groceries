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
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRewards(),
        loadRedemptions()
      ]);
    } catch (err) {
      setError('Failed to load data');
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
    if (!newReward.name.trim() || newReward.points_cost < 1) return;

    try {
      const stockQty = newReward.hasStock ? parseInt(newReward.stock_quantity) : undefined;
      const response = await apiService.createReward(
        newReward.name.trim(),
        newReward.description.trim(),
        newReward.points_cost,
        stockQty
      );
      if (response.data) {
        setNewReward({ name: '', description: '', points_cost: 50, stock_quantity: '', hasStock: false });
        setShowNewReward(false);
        loadRewards();
      } else {
        setError(response.error || 'Failed to create reward');
      }
    } catch (err) {
      setError('Failed to create reward');
    }
  };

  const updateReward = async (reward: Reward) => {
    try {
      const response = await apiService.updateReward(reward.id, {
        name: reward.name,
        description: reward.description,
        points_cost: reward.points_cost,
        stock_quantity: reward.stock_quantity,
        is_available: reward.is_available
      });
      if (response.data) {
        setEditingReward(null);
        loadRewards();
      } else {
        setError(response.error || 'Failed to update reward');
      }
    } catch (err) {
      setError('Failed to update reward');
    }
  };

  const deleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const response = await apiService.deleteReward(rewardId);
      if (!response.error) {
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
        setError('');
        loadData();
        onRedeem(); // Refresh points
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
        <p>Loading rewards shop...</p>
      </div>
    );
  }

  return (
    <div className="rewards-shop">
      <div className="shop-header">
        <h2>🏰 Royal Rewards Shop</h2>
        <div className="points-display">
          <div className="points-badge">
            <span className="points-icon">💎</span>
            <span className="points-value">{availablePoints}</span>
            <span className="points-label">Available Points</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {!isAdmin && (
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
      )}

      {activeTab === 'shop' && (
        <div className="shop-view">
          {isAdmin && (
            <div className="admin-controls">
              {!showNewReward && !editingReward && (
                <button
                  className="royal-button primary"
                  onClick={() => setShowNewReward(true)}
                >
                  ➕ Add New Reward
                </button>
              )}
            </div>
          )}

          {showNewReward && (
            <div className="reward-form">
              <h3>Add New Reward</h3>
              <div className="form-group">
                <label>Reward Name</label>
                <input
                  type="text"
                  value={newReward.name}
                  onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                  placeholder="e.g., Extra Screen Time"
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newReward.description}
                  onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                  placeholder="Describe the reward..."
                  className="royal-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Points Cost</label>
                <input
                  type="number"
                  value={newReward.points_cost}
                  onChange={(e) => setNewReward({...newReward, points_cost: parseInt(e.target.value) || 50})}
                  min="1"
                  max="10000"
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newReward.hasStock}
                    onChange={(e) => setNewReward({...newReward, hasStock: e.target.checked})}
                  />
                  Limited Stock
                </label>
                {newReward.hasStock && (
                  <input
                    type="number"
                    value={newReward.stock_quantity}
                    onChange={(e) => setNewReward({...newReward, stock_quantity: e.target.value})}
                    placeholder="Stock quantity"
                    min="1"
                    className="royal-input"
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="form-actions">
                <button
                  className="royal-button primary"
                  onClick={createReward}
                  disabled={!newReward.name.trim()}
                >
                  Add Reward
                </button>
                <button
                  className="royal-button secondary"
                  onClick={() => {
                    setShowNewReward(false);
                    setNewReward({ name: '', description: '', points_cost: 50, stock_quantity: '', hasStock: false });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {editingReward && (
            <div className="reward-form">
              <h3>Edit Reward</h3>
              <div className="form-group">
                <label>Reward Name</label>
                <input
                  type="text"
                  value={editingReward.name}
                  onChange={(e) => setEditingReward({...editingReward, name: e.target.value})}
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingReward.description || ''}
                  onChange={(e) => setEditingReward({...editingReward, description: e.target.value})}
                  className="royal-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Points Cost</label>
                <input
                  type="number"
                  value={editingReward.points_cost}
                  onChange={(e) => setEditingReward({...editingReward, points_cost: parseInt(e.target.value) || 50})}
                  min="1"
                  max="10000"
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity (leave empty for unlimited)</label>
                <input
                  type="number"
                  value={editingReward.stock_quantity || ''}
                  onChange={(e) => setEditingReward({...editingReward, stock_quantity: e.target.value ? parseInt(e.target.value) : null})}
                  min="0"
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingReward.is_available}
                    onChange={(e) => setEditingReward({...editingReward, is_available: e.target.checked})}
                  />
                  Available
                </label>
              </div>
              <div className="form-actions">
                <button
                  className="royal-button primary"
                  onClick={() => updateReward(editingReward)}
                >
                  Save Changes
                </button>
                <button
                  className="royal-button secondary"
                  onClick={() => setEditingReward(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="rewards-grid">
            {rewards.length === 0 ? (
              <div className="empty-state">
                <p>No rewards available. {isAdmin && 'Add your first reward!'}</p>
              </div>
            ) : (
              rewards.map(reward => {
                const canAfford = availablePoints >= reward.points_cost;
                const inStock = reward.stock_quantity === null || reward.stock_quantity > 0;
                const isAvailable = reward.is_available && inStock && canAfford;

                return (
                  <div
                    key={reward.id}
                    className={`reward-card ${!reward.is_available ? 'unavailable' : ''} ${!inStock ? 'out-of-stock' : ''}`}
                  >
                    <div className="reward-content">
                      <h4>{reward.name}</h4>
                      {reward.description && (
                        <p className="reward-description">{reward.description}</p>
                      )}
                      <div className="reward-cost">
                        <span className="cost-icon">💎</span>
                        <span className="cost-value">{reward.points_cost} points</span>
                      </div>
                      {reward.stock_quantity !== null && (
                        <div className="reward-stock">
                          {reward.stock_quantity > 0 ? (
                            <span>📦 {reward.stock_quantity} left</span>
                          ) : (
                            <span className="out-of-stock-text">Out of stock</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="reward-actions">
                      {isAdmin ? (
                        <>
                          <button
                            className="royal-button small"
                            onClick={() => setEditingReward(reward)}
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
                      ) : isAvailable ? (
                        <button
                          className="royal-button primary"
                          onClick={() => redeemReward(reward.id)}
                        >
                          🛒 Redeem
                        </button>
                      ) : (
                        <span className="reward-unavailable">
                          {!canAfford && 'Not enough points'}
                          {!inStock && 'Out of stock'}
                          {!reward.is_available && 'Unavailable'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="redemptions-view">
          <h3>📜 My Redemption History</h3>
          <div className="redemptions-list">
            {redemptions.length === 0 ? (
              <div className="empty-state">
                <p>You haven't redeemed any rewards yet.</p>
              </div>
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



