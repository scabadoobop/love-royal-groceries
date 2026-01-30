import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './AdminQuestsManager.css';

interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  assigned_to: string | null;
  assigned_to_name: string | null;
  is_active: boolean;
  created_by_name: string;
  completion_count: number;
}

interface Member {
  id: string;
  username: string;
}

interface AdminQuestsManagerProps {
  userRole: string;
}

export default function AdminQuestsManager({ userRole }: AdminQuestsManagerProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewQuest, setShowNewQuest] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [filterAssigned, setFilterAssigned] = useState<'all' | 'assigned' | 'unassigned'>('all');

  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    pointsReward: 10,
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    assignedTo: '' as string | null
  });

  useEffect(() => {
    if (userRole === 'admin') {
      loadData();
    }
  }, [userRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadQuests(), loadMembers()]);
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
      setError('Failed to load quests');
    }
  };

  const loadMembers = async () => {
    try {
      const response = await apiService.getHouseholdMembers();
      if (response.data) {
        setMembers(response.data.members);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const createQuest = async () => {
    if (!newQuest.title.trim() || newQuest.pointsReward < 1) {
      setError('Title and points (min 1) are required');
      return;
    }

    try {
      const response = await apiService.createQuest({
        title: newQuest.title,
        description: newQuest.description || undefined,
        pointsReward: newQuest.pointsReward,
        frequency: newQuest.frequency,
        assignedTo: newQuest.assignedTo || null
      });

      if (response.data) {
        setShowNewQuest(false);
        setNewQuest({ title: '', description: '', pointsReward: 10, frequency: 'daily', assignedTo: '' });
        setError('');
        alert('✅ Quest created successfully!');
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
        frequency: quest.frequency,
        assignedTo: quest.assigned_to,
        is_active: quest.is_active
      });

      if (response.data) {
        setEditingQuest(null);
        setError('');
        alert('✅ Quest updated successfully!');
        loadQuests();
      } else {
        setError(response.error || 'Failed to update quest');
      }
    } catch (err) {
      setError('Failed to update quest');
    }
  };

  const deleteQuest = async (questId: string) => {
    if (!confirm('Are you sure you want to delete this quest? This cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.deleteQuest(questId);
      if (response.data !== undefined) {
        loadQuests();
        setError('');
      } else {
        setError(response.error || 'Failed to delete quest');
      }
    } catch (err) {
      setError('Failed to delete quest');
    }
  };

  const toggleQuestActive = async (quest: Quest) => {
    const updatedQuest = { ...quest, is_active: !quest.is_active };
    await updateQuest(updatedQuest);
  };

  // Filter quests
  const filteredQuests = quests.filter(quest => {
    // Search filter
    if (searchTerm && !quest.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !quest.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Active filter
    if (filterActive === 'active' && !quest.is_active) return false;
    if (filterActive === 'inactive' && quest.is_active) return false;

    // Frequency filter
    if (filterFrequency !== 'all' && quest.frequency !== filterFrequency) return false;

    // Assigned filter
    if (filterAssigned === 'assigned' && !quest.assigned_to) return false;
    if (filterAssigned === 'unassigned' && quest.assigned_to) return false;

    return true;
  });

  if (userRole !== 'admin') {
    return (
      <div className="admin-quests-manager">
        <div className="error-message">
          Admin access required to manage quests.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-quests-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading quests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-quests-manager">
      <div className="quests-header">
        <h2>⚔️ Manage Quests</h2>
        <button 
          className="royal-button primary"
          onClick={() => {
            setShowNewQuest(!showNewQuest);
            setEditingQuest(null);
          }}
        >
          {showNewQuest ? 'Cancel' : '+ New Quest'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="error-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="quests-filters">
        <div className="search-group">
          <label>Search</label>
          <input
            type="text"
            className="royal-input"
            placeholder="Search quests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            className="royal-input"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Frequency</label>
          <select
            className="royal-input"
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Assignment</label>
          <select
            className="royal-input"
            value={filterAssigned}
            onChange={(e) => setFilterAssigned(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">All Members</option>
          </select>
        </div>
      </div>

      {/* New Quest Form */}
      {showNewQuest && (
        <div className="quest-form-card">
          <h3>Create New Quest</h3>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              className="royal-input"
              value={newQuest.title}
              onChange={(e) => setNewQuest({...newQuest, title: e.target.value})}
              placeholder="Quest title"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="royal-textarea"
              value={newQuest.description}
              onChange={(e) => setNewQuest({...newQuest, description: e.target.value})}
              placeholder="Quest description"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Points Reward *</label>
              <input
                type="number"
                className="royal-input"
                value={newQuest.pointsReward}
                onChange={(e) => setNewQuest({...newQuest, pointsReward: parseInt(e.target.value) || 0})}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Frequency *</label>
              <select
                className="royal-input"
                value={newQuest.frequency}
                onChange={(e) => setNewQuest({...newQuest, frequency: e.target.value as any})}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Assign To</label>
            <select
              className="royal-input"
              value={newQuest.assignedTo || ''}
              onChange={(e) => setNewQuest({...newQuest, assignedTo: e.target.value || null})}
            >
              <option value="">All Members</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.username}</option>
              ))}
            </select>
          </div>

          <button className="royal-button primary" onClick={createQuest}>
            Create Quest
          </button>
        </div>
      )}

      {/* Edit Quest Form */}
      {editingQuest && (
        <div className="quest-form-card">
          <h3>Edit Quest</h3>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              className="royal-input"
              value={editingQuest.title}
              onChange={(e) => setEditingQuest({...editingQuest, title: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="royal-textarea"
              value={editingQuest.description || ''}
              onChange={(e) => setEditingQuest({...editingQuest, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Points Reward *</label>
              <input
                type="number"
                className="royal-input"
                value={editingQuest.points}
                onChange={(e) => setEditingQuest({...editingQuest, points: parseInt(e.target.value) || 0})}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Frequency *</label>
              <select
                className="royal-input"
                value={editingQuest.frequency}
                onChange={(e) => setEditingQuest({...editingQuest, frequency: e.target.value as any})}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Assign To</label>
            <select
              className="royal-input"
              value={editingQuest.assigned_to || ''}
              onChange={(e) => setEditingQuest({...editingQuest, assigned_to: e.target.value || null})}
            >
              <option value="">All Members</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.username}</option>
              ))}
            </select>
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
            <button className="royal-button primary" onClick={() => updateQuest(editingQuest)}>
              Save Changes
            </button>
            <button className="royal-button secondary" onClick={() => setEditingQuest(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quests List */}
      <div className="quests-list">
        {filteredQuests.length === 0 ? (
          <div className="empty-state">
            <p>No quests found. {searchTerm || filterActive !== 'all' || filterFrequency !== 'all' || filterAssigned !== 'all' ? 'Try adjusting your filters.' : 'Create your first quest!'}</p>
          </div>
        ) : (
          filteredQuests.map(quest => (
            <div key={quest.id} className={`quest-card ${!quest.is_active ? 'inactive' : ''}`}>
              <div className="quest-card-header">
                <div className="quest-title-section">
                  <h3>{quest.title}</h3>
                  {!quest.is_active && <span className="inactive-badge">Inactive</span>}
                  <span className="frequency-badge">{quest.frequency}</span>
                </div>
                <div className="quest-actions">
                  <button
                    className="royal-button small"
                    onClick={() => {
                      setEditingQuest(quest);
                      setShowNewQuest(false);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="royal-button small danger"
                    onClick={() => deleteQuest(quest.id)}
                  >
                    🗑️ Delete
                  </button>
                  <button
                    className="royal-button small"
                    onClick={() => toggleQuestActive(quest)}
                  >
                    {quest.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </button>
                </div>
              </div>

              {quest.description && (
                <p className="quest-description">{quest.description}</p>
              )}

              <div className="quest-meta">
                <div className="meta-item">
                  <span className="meta-label">Points:</span>
                  <span className="meta-value">💎 {quest.points}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Assigned to:</span>
                  <span className="meta-value">{quest.assigned_to_name || 'All Members'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Completions:</span>
                  <span className="meta-value">{quest.completion_count}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Created by:</span>
                  <span className="meta-value">{quest.created_by_name}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

