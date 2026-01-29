import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './AdminRewardsManager.css';

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
  reward_id: string;
  reward_name: string;
  reward_description: string;
  user_id: string;
  user_name: string;
  points_spent: number;
  redeemed_at: string;
  status: 'pending' | 'approved' | 'denied' | 'fulfilled';
}

interface AdminRewardsManagerProps {
  userRole: string;
}

export default function AdminRewardsManager({ userRole }: AdminRewardsManagerProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewReward, setShowNewReward] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'redemptions'>('rewards');
  const [redemptionFilter, setRedemptionFilter] = useState<'all' | 'pending' | 'approved' | 'denied' | 'fulfilled'>('all');

  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    points_cost: 50,
    stock_quantity: '',
    hasStock: false
  });

  useEffect(() => {
    if (userRole === 'admin') {
      loadData();
    }
  }, [userRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadRewards(), loadRedemptions()]);
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
      setError('Failed to load rewards');
    }
  };

  const loadRedemptions = async () => {
    try {
      const response = await apiService.getAllRedemptions();
      if (response.data) {
        setRedemptions(response.data.redemptions);
      }
    } catch (err) {
      console.error('Failed to load redemptions:', err);
      setError('Failed to load redemptions');
    }
  };

  const createReward = async () => {
    if (!newReward.name.trim() || newReward.points_cost < 1) {
      setError('Name and points cost (min 1) are required');
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
        setError('');
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
        stock_quantity: reward.stock_quantity ?? undefined,
        is_available: reward.is_available
      });

      if (response.data) {
        setEditingReward(null);
        loadRewards();
        setError('');
      } else {
        setError(response.error || 'Failed to update reward');
      }
    } catch (err) {
      setError('Failed to update reward');
    }
  };

  const deleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward? This cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.deleteReward(rewardId);
      if (response.data !== undefined) {
        loadRewards();
        setError('');
      } else {
        setError(response.error || 'Failed to delete reward');
      }
    } catch (err) {
      setError('Failed to delete reward');
    }
  };

  const updateRedemptionStatus = async (redemptionId: string, status: string) => {
    try {
      const response = await apiService.updateRedemptionStatus(redemptionId, status);
      if (response.data) {
        loadRedemptions();
        setError('');
      } else {
        setError(response.error || 'Failed to update redemption status');
      }
    } catch (err) {
      setError('Failed to update redemption status');
    }
  };

  const filteredRedemptions = redemptions.filter(r => 
    redemptionFilter === 'all' || r.status === redemptionFilter
  );

  if (userRole !== 'admin') {
    return (
      <div className="admin-rewards-manager">
        <div className="error-message">
          Admin access required to manage rewards.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-rewards-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-rewards-manager">
      <div className="rewards-header">
        <h2>🎁 Manage Rewards</h2>
        <div className="header-actions">
          <button 
            className="royal-button primary"
            onClick={() => {
              setShowNewReward(!showNewReward);
              setEditingReward(null);
            }}
          >
            {showNewReward ? 'Cancel' : '+ New Reward'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="error-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="rewards-tabs">
        <button 
          className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          Rewards
        </button>
        <button 
          className={`tab-button ${activeTab === 'redemptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('redemptions')}
        >
          Redemptions {redemptions.filter(r => r.status === 'pending').length > 0 && (
            <span className="pending-badge">{redemptions.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {activeTab === 'rewards' && (
        <>
          {/* New Reward Form */}
          {showNewReward && (
            <div className="reward-form-card">
              <h3>Create New Reward</h3>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  className="royal-input"
                  value={newReward.name}
                  onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                  placeholder="Reward title"
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
                <label>Cost Points *</label>
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
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              <button className="royal-button primary" onClick={createReward}>
                Create Reward
              </button>
            </div>
          )}

          {/* Edit Reward Form */}
          {editingReward && (
            <div className="reward-form-card">
              <h3>Edit Reward</h3>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  className="royal-input"
                  value={editingReward.name}
                  onChange={(e) => setEditingReward({...editingReward, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="royal-textarea"
                  value={editingReward.description || ''}
                  onChange={(e) => setEditingReward({...editingReward, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Cost Points *</label>
                <input
                  type="number"
                  className="royal-input"
                  value={editingReward.points_cost}
                  onChange={(e) => setEditingReward({...editingReward, points_cost: parseInt(e.target.value) || 0})}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Stock Quantity (leave empty for unlimited)</label>
                <input
                  type="number"
                  className="royal-input"
                  value={editingReward.stock_quantity || ''}
                  onChange={(e) => setEditingReward({...editingReward, stock_quantity: e.target.value ? parseInt(e.target.value) : null})}
                  min="0"
                  placeholder="Unlimited"
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
                <button className="royal-button primary" onClick={() => updateReward(editingReward)}>
                  Save Changes
                </button>
                <button className="royal-button secondary" onClick={() => setEditingReward(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rewards List */}
          <div className="rewards-list">
            {rewards.length === 0 ? (
              <div className="empty-state">
                <p>No rewards yet. Create your first reward!</p>
              </div>
            ) : (
              rewards.map(reward => (
                <div key={reward.id} className={`reward-card ${!reward.is_available ? 'unavailable' : ''}`}>
                  <div className="reward-card-header">
                    <div className="reward-title-section">
                      <h3>{reward.name}</h3>
                      {!reward.is_available && <span className="unavailable-badge">Unavailable</span>}
                    </div>
                    <div className="reward-actions">
                      <button
                        className="royal-button small"
                        onClick={() => {
                          setEditingReward(reward);
                          setShowNewReward(false);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="royal-button small danger"
                        onClick={() => deleteReward(reward.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {reward.description && (
                    <p className="reward-description">{reward.description}</p>
                  )}

                  <div className="reward-meta">
                    <div className="meta-item">
                      <span className="meta-label">Cost:</span>
                      <span className="meta-value">💎 {reward.points_cost} points</span>
                    </div>
                    {reward.stock_quantity !== null && (
                      <div className="meta-item">
                        <span className="meta-label">Stock:</span>
                        <span className="meta-value">{reward.stock_quantity}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <span className="meta-label">Created by:</span>
                      <span className="meta-value">{reward.created_by_name}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'redemptions' && (
        <div className="redemptions-section">
          <div className="redemptions-filters">
            <label>Filter by Status:</label>
            <select
              className="royal-input"
              value={redemptionFilter}
              onChange={(e) => setRedemptionFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
          </div>

          <div className="redemptions-list">
            {filteredRedemptions.length === 0 ? (
              <div className="empty-state">
                <p>No redemptions found.</p>
              </div>
            ) : (
              filteredRedemptions.map(redemption => (
                <div key={redemption.id} className={`redemption-card ${redemption.status}`}>
                  <div className="redemption-header">
                    <div>
                      <h4>{redemption.reward_name}</h4>
                      <p className="redemption-user">Requested by: {redemption.user_name}</p>
                    </div>
                    <span className={`status-badge ${redemption.status}`}>
                      {redemption.status}
                    </span>
                  </div>

                  {redemption.reward_description && (
                    <p className="redemption-description">{redemption.reward_description}</p>
                  )}

                  <div className="redemption-meta">
                    <span>💎 {redemption.points_spent} points</span>
                    <span>{new Date(redemption.redeemed_at).toLocaleString()}</span>
                  </div>

                  {redemption.status === 'pending' && (
                    <div className="redemption-actions">
                      <button
                        className="royal-button small success"
                        onClick={() => updateRedemptionStatus(redemption.id, 'approved')}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="royal-button small danger"
                        onClick={() => updateRedemptionStatus(redemption.id, 'denied')}
                      >
                        ❌ Deny
                      </button>
                    </div>
                  )}

                  {redemption.status === 'approved' && (
                    <div className="redemption-actions">
                      <button
                        className="royal-button small"
                        onClick={() => updateRedemptionStatus(redemption.id, 'fulfilled')}
                      >
                        ✓ Mark Fulfilled
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

