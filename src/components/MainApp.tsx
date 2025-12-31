import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import GroceryManager from './GroceryManager';
import NotesManager from './NotesManager';
import ForumManager from './ForumManager';
import HouseholdManager from './HouseholdManager';
import QuestManager from './QuestManager';
import './MainApp.css';

interface User {
  id: string;
  username: string;
  email: string;
  householdId: string;
  role: string;
}

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

export default function MainApp({ user, onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<'groceries' | 'notes' | 'forum' | 'household' | 'quests'>('groceries');
  const [householdInfo, setHouseholdInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHouseholdInfo();
  }, []);

  const loadHouseholdInfo = async () => {
    try {
      const response = await apiService.getHouseholdInfo();
      if (response.data) {
        setHouseholdInfo(response.data.household);
      }
    } catch (error) {
      console.error('Failed to load household info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      onLogout();
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <span className="crown" style={{ fontSize: 48 }}>👑</span>
          <h2>Loading your royal household...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <span className="crown">👑</span>
            <div>
              <h1 className="royal-title">Royal Pantry & Fridge</h1>
              {householdInfo && (
                <p className="household-name">{householdInfo.name}</p>
              )}
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">Welcome, {user.username}</span>
              {user.role === 'admin' && (
                <span className="admin-badge">Admin</span>
              )}
            </div>
            <button onClick={handleLogout} className="logout-button">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={`nav-button ${activeTab === 'groceries' ? 'active' : ''}`}
          onClick={() => setActiveTab('groceries')}
        >
          🛒 Groceries
        </button>
        <button 
          className={`nav-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          💭 Notes
        </button>
        <button 
          className={`nav-button ${activeTab === 'forum' ? 'active' : ''}`}
          onClick={() => setActiveTab('forum')}
        >
          💬 Forum
        </button>
        <button 
          className={`nav-button ${activeTab === 'household' ? 'active' : ''}`}
          onClick={() => setActiveTab('household')}
        >
          👥 Household
        </button>
        <button 
          className={`nav-button ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          ⚔️ Quests
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'groceries' && <GroceryManager />}
        {activeTab === 'notes' && <NotesManager />}
        {activeTab === 'forum' && <ForumManager userRole={user.role} />}
        {activeTab === 'household' && <HouseholdManager user={user} onLogout={onLogout} />}
        {activeTab === 'quests' && <QuestManager userRole={user.role} />}
      </main>
    </div>
  );
}
