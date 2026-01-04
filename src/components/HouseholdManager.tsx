import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './HouseholdManager.css';

interface User {
  id: string;
  username: string;
  email: string;
  householdId: string;
  role: string;
}

interface HouseholdInfo {
  id: string;
  name: string;
  key_code: string;
  created_at: string;
  member_count: number;
}

interface Member {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login: string;
}

interface HouseholdManagerProps {
  user: User;
  onLogout: () => void;
}

export default function HouseholdManager({ user, onLogout }: HouseholdManagerProps) {
  const [householdInfo, setHouseholdInfo] = useState<HouseholdInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showKeyRegenerate, setShowKeyRegenerate] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadHouseholdData();
  }, []);

  const loadHouseholdData = async () => {
    try {
      setLoading(true);
      const [infoResponse, membersResponse] = await Promise.all([
        apiService.getHouseholdInfo(),
        apiService.getHouseholdMembers()
      ]);

      if (infoResponse.data) {
        setHouseholdInfo(infoResponse.data.household);
        setNewName(infoResponse.data.household.name);
      } else {
        setError(infoResponse.error || 'Failed to load household info');
      }

      if (membersResponse.data) {
        setMembers(membersResponse.data.members);
      } else {
        setError(membersResponse.error || 'Failed to load members');
      }
    } catch (err) {
      setError('Failed to load household data');
    } finally {
      setLoading(false);
    }
  };

  const regenerateKey = async () => {
    if (!confirm('Are you sure you want to regenerate the household key? This will invalidate the current key.')) {
      return;
    }

    try {
      const response = await apiService.regenerateHouseholdKey();
      if (response.data) {
        setHouseholdInfo(prev => prev ? { ...prev, key_code: response.data!.newKey } : null);
        setShowKeyRegenerate(false);
        alert('Household key regenerated successfully! Share the new key with your family members.');
      } else {
        setError(response.error || 'Failed to regenerate key');
      }
    } catch (err) {
      setError('Failed to regenerate key');
    }
  };

  const updateHouseholdName = async () => {
    if (!newName.trim()) return;

    try {
      const response = await apiService.updateHouseholdName(newName.trim());
      if (response.data) {
        setHouseholdInfo(prev => prev ? { ...prev, name: response.data!.name } : null);
        setShowNameEdit(false);
      } else {
        setError(response.error || 'Failed to update name');
      }
    } catch (err) {
      setError('Failed to update name');
    }
  };

  const copyKeyToClipboard = () => {
    if (householdInfo) {
      navigator.clipboard.writeText(householdInfo.key_code);
      alert('Household key copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading household information...</p>
      </div>
    );
  }

  return (
    <div className="household-manager">
      <div className="household-header">
        <h2>Household Management</h2>
        {user.role === 'admin' && (
          <div className="admin-badges">
            <span className="admin-badge">👑 Admin</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {householdInfo && (
        <div className="household-info">
          <div className="info-card">
            <h3>Household Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Household Name</label>
                {showNameEdit ? (
                  <div className="edit-group">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="royal-input"
                    />
                    <button 
                      className="royal-button primary small"
                      onClick={updateHouseholdName}
                      disabled={!newName.trim()}
                    >
                      Save
                    </button>
                    <button 
                      className="royal-button secondary small"
                      onClick={() => {
                        setShowNameEdit(false);
                        setNewName(householdInfo.name);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="info-value">
                    <span>{householdInfo.name}</span>
                    {user.role === 'admin' && (
                      <button 
                        className="edit-btn"
                        onClick={() => setShowNameEdit(true)}
                        title="Edit household name"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="info-item">
                <label>Household Key</label>
                <div className="key-group">
                  <code className="key-code">{householdInfo.key_code}</code>
                  <button 
                    className="copy-btn"
                    onClick={copyKeyToClipboard}
                    title="Copy key to clipboard"
                  >
                    📋
                  </button>
                  {user.role === 'admin' && (
                    <button 
                      className="regenerate-btn"
                      onClick={() => setShowKeyRegenerate(true)}
                      title="Regenerate key"
                    >
                      🔄
                    </button>
                  )}
                </div>
              </div>

              <div className="info-item">
                <label>Created</label>
                <span className="info-value">
                  {new Date(householdInfo.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="info-item">
                <label>Members</label>
                <span className="info-value">
                  {householdInfo.member_count} member{householdInfo.member_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {showKeyRegenerate && (
            <div className="regenerate-modal">
              <div className="modal-content">
                <h3>Regenerate Household Key</h3>
                <p>This will create a new household key and invalidate the current one. Make sure to share the new key with all family members.</p>
                <div className="modal-actions">
                  <button 
                    className="royal-button primary"
                    onClick={regenerateKey}
                  >
                    Regenerate Key
                  </button>
                  <button 
                    className="royal-button secondary"
                    onClick={() => setShowKeyRegenerate(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="members-section">
        <h3>Household Members</h3>
        <div className="members-list">
          {members.map(member => (
            <div key={member.id} className="member-card">
              <div className="member-info">
                <div className="member-header">
                  <h4>{member.username}</h4>
                  {member.role === 'admin' && (
                    <span className="role-badge admin">👑 Admin</span>
                  )}
                  {member.role === 'member' && (
                    <span className="role-badge member">👤 Member</span>
                  )}
                </div>
                <p className="member-email">{member.email}</p>
                <div className="member-meta">
                  <span>Joined: {new Date(member.created_at).toLocaleDateString()}</span>
                  {member.last_login && (
                    <span>Last seen: {new Date(member.last_login).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              {user.role === 'admin' && user.id !== member.id && (
                <div className="member-actions">
                  {member.role === 'member' ? (
                    <button
                      className="royal-button small"
                      onClick={async () => {
                        const res = await apiService.updateMemberRole(member.id, 'admin');
                        if (res.data) setMembers(members.map(m => m.id === member.id ? { ...m, role: 'admin' } : m));
                      }}
                    >
                      Make Admin
                    </button>
                  ) : (
                    <button
                      className="royal-button small"
                      onClick={async () => {
                        const res = await apiService.updateMemberRole(member.id, 'member');
                        if (res.data) setMembers(members.map(m => m.id === member.id ? { ...m, role: 'member' } : m));
                      }}
                    >
                      Make Member
                    </button>
                  )}
                  <button
                    className="royal-button danger small"
                    onClick={async () => {
                      if (!confirm(`Remove ${member.username}?`)) return;
                      const res = await apiService.removeMember(member.id);
                      if (!res.error) setMembers(members.filter(m => m.id !== member.id));
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="household-actions">
        <div className="action-card">
          <h4>🔑 Share Household Key</h4>
          <p>Share the household key with family members so they can join your household.</p>
          <button 
            className="royal-button primary"
            onClick={copyKeyToClipboard}
          >
            Copy Key to Clipboard
          </button>
        </div>

        <div className="action-card">
          <h4>📱 Mobile Access</h4>
          <p>Access your household from any device by visiting the same URL and using the household key.</p>
          <button 
            className="royal-button secondary"
            onClick={() => window.open(window.location.origin, '_blank')}
          >
            Open in New Tab
          </button>
        </div>

        <div className="action-card">
          <h4>🚪 Sign Out</h4>
          <p>Sign out of your account. You can sign back in anytime with your username and password.</p>
          <button 
            className="royal-button danger"
            onClick={onLogout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
