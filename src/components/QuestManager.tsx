import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import RewardsShop from './RewardsShop';
import './QuestManager.css';

interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  is_active: boolean;
  created_by_name: string;
  completion_count: number;
}

interface QuestProgress {
  totalPoints: number;
  pointsSpent: number;
  availablePoints: number;
  todayCompletions: any[];
}

interface LeaderboardEntry {
  id: string;
  username: string;
  total_points: number;
  quests_completed: number;
}

interface QuestManagerProps {
  userRole?: string;
}

export default function QuestManager({ userRole = 'member' }: QuestManagerProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'quests' | 'shop' | 'leaderboard'>('quests');
  const [showNewQuest, setShowNewQuest] = useState(false);
  const [newQuest, setNewQuest] = useState({ title: '', description: '', points: 10 });
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadQuests(),
        loadProgress(),
        loadLeaderboard()
      ]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadQuests = async () => {
    try {
      const response = await apiService.getQuests();
      if (response.data) {
        setQuests(response.data.quests);
      }
    } catch (err) {
      console.error('Failed to load quests:', err);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await apiService.getMyQuestProgress();
      if (response.data) {
        setProgress(response.data);
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await apiService.getQuestLeaderboard();
      if (response.data) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const createQuest = async () => {
    if (!newQuest.title.trim() || newQuest.points < 1) return;

    try {
      const response = await apiService.createQuest({
        title: newQuest.title.trim(),
        description: newQuest.description.trim(),
        pointsReward: newQuest.points
      });
      if (response.data) {
        setNewQuest({ title: '', description: '', points: 10 });
        setShowNewQuest(false);
        loadQuests();
      } else {
        setError(response.error || 'Failed to create quest');
      }
    } catch (err) {
      setError('Failed to create quest');
    }
  };

  const updateQuest = async (quest: Quest) => {
    try {
      const response = await apiService.updateQuest(quest.id, {
        title: quest.title,
        description: quest.description,
        pointsReward: quest.points,
        is_active: quest.is_active
      });
      if (response.data) {
        setEditingQuest(null);
        loadQuests();
      } else {
        setError(response.error || 'Failed to update quest');
      }
    } catch (err) {
      setError('Failed to update quest');
    }
  };

  const deleteQuest = async (questId: string) => {
    if (!confirm('Are you sure you want to delete this quest?')) return;

    try {
      const response = await apiService.deleteQuest(questId);
      if (!response.error) {
        loadQuests();
      } else {
        setError(response.error || 'Failed to delete quest');
      }
    } catch (err) {
      setError('Failed to delete quest');
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const response = await apiService.completeQuest(questId);
      if (response.data) {
        setError('');
        const pointsEarned = response.data.pointsEarned || 0;
        alert(`✅ Quest completed! You earned 💎 ${pointsEarned} points!`);
        loadData(); // Reload everything
      } else {
        setError(response.error || 'Failed to complete quest');
      }
    } catch (err) {
      setError('Failed to complete quest');
    }
  };

  if (loading && !progress) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your quests...</p>
      </div>
    );
  }

  return (
    <div className="quest-manager">
      <div className="quest-header">
        <div className="header-content">
          <h2>⚔️ Royal Quests</h2>
          {progress && (
            <div className="points-display">
              <div className="points-badge">
                <span className="points-icon">💎</span>
                <span className="points-value">{progress.availablePoints}</span>
                <span className="points-label">Points</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      <div className="quest-tabs">
        <button
          className={`quest-tab ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          ⚔️ Quests
        </button>
        <button
          className={`quest-tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🏰 Shop
        </button>
        <button
          className={`quest-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          👑 Leaderboard
        </button>
      </div>

      {activeTab === 'quests' && (
        <div className="quests-view">
          {isAdmin && (
            <div className="admin-controls">
              {!showNewQuest && !editingQuest && (
                <button
                  className="royal-button primary"
                  onClick={() => setShowNewQuest(true)}
                >
                  ➕ Create New Quest
                </button>
              )}
            </div>
          )}

          {showNewQuest && (
            <div className="quest-form">
              <h3>Create New Quest</h3>
              <div className="form-group">
                <label>Quest Title</label>
                <input
                  type="text"
                  value={newQuest.title}
                  onChange={(e) => setNewQuest({...newQuest, title: e.target.value})}
                  placeholder="e.g., Clean Your Room"
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newQuest.description}
                  onChange={(e) => setNewQuest({...newQuest, description: e.target.value})}
                  placeholder="Describe what needs to be done..."
                  className="royal-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Points Reward</label>
                <input
                  type="number"
                  value={newQuest.points}
                  onChange={(e) => setNewQuest({...newQuest, points: parseInt(e.target.value) || 10})}
                  min="1"
                  max="1000"
                  className="royal-input"
                />
              </div>
              <div className="form-actions">
                <button
                  className="royal-button primary"
                  onClick={createQuest}
                  disabled={!newQuest.title.trim()}
                >
                  Create Quest
                </button>
                <button
                  className="royal-button secondary"
                  onClick={() => {
                    setShowNewQuest(false);
                    setNewQuest({ title: '', description: '', points: 10 });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {editingQuest && (
            <div className="quest-form">
              <h3>Edit Quest</h3>
              <div className="form-group">
                <label>Quest Title</label>
                <input
                  type="text"
                  value={editingQuest.title}
                  onChange={(e) => setEditingQuest({...editingQuest, title: e.target.value})}
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingQuest.description || ''}
                  onChange={(e) => setEditingQuest({...editingQuest, description: e.target.value})}
                  className="royal-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Points Reward</label>
                <input
                  type="number"
                  value={editingQuest.points}
                  onChange={(e) => setEditingQuest({...editingQuest, points: parseInt(e.target.value) || 10})}
                  min="1"
                  max="1000"
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingQuest.is_active}
                    onChange={(e) => setEditingQuest({...editingQuest, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>
              <div className="form-actions">
                <button
                  className="royal-button primary"
                  onClick={() => updateQuest(editingQuest)}
                >
                  Save Changes
                </button>
                <button
                  className="royal-button secondary"
                  onClick={() => setEditingQuest(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="quests-list">
            {quests.length === 0 ? (
              <div className="empty-state">
                <p>No quests available. {isAdmin && 'Create your first quest!'}</p>
              </div>
            ) : (
              quests.map(quest => (
                <div
                  key={quest.id}
                  className={`quest-card ${!quest.is_active ? 'inactive' : ''}`}
                >
                  <div className="quest-content">
                    <div className="quest-header-row">
                      <h4>{quest.title}</h4>
                      <div className="quest-points">💎 {quest.points} points</div>
                    </div>
                    {quest.description && (
                      <p className="quest-description">{quest.description}</p>
                    )}
                    <div className="quest-meta">
                      <span>Completed {quest.completion_count} times</span>
                      {!quest.is_active && <span className="inactive-badge">Inactive</span>}
                    </div>
                  </div>
                  <div className="quest-actions">
                    {isAdmin ? (
                      <>
                        <button
                          className="royal-button small"
                          onClick={() => setEditingQuest(quest)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="royal-button small danger"
                          onClick={() => deleteQuest(quest.id)}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    ) : quest.is_active ? (
                      <button
                        className="royal-button primary"
                        onClick={() => completeQuest(quest.id)}
                      >
                        ✅ Complete Quest
                      </button>
                    ) : (
                      <span className="quest-unavailable">Unavailable</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'shop' && progress && (
              <RewardsShop 
                availablePoints={progress.availablePoints}
                onRedeem={loadProgress}
              />
      )}

      {activeTab === 'leaderboard' && (
        <div className="leaderboard-view">
          <h3>🏆 Quest Leaderboard</h3>
          <div className="leaderboard-list">
            {leaderboard.length === 0 ? (
              <div className="empty-state">
                <p>No quests completed yet. Start completing quests to appear on the leaderboard!</p>
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`leaderboard-entry ${index === 0 ? 'first' : ''} ${index === 1 ? 'second' : ''} ${index === 2 ? 'third' : ''}`}
                >
                  <div className="leaderboard-rank">
                    {index === 0 && '👑'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">{entry.username}</div>
                    <div className="leaderboard-stats">
                      <span>💎 {entry.total_points} points</span>
                      <span>⚔️ {entry.quests_completed} quests</span>
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

