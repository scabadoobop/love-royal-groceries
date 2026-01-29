import { useState, useEffect } from 'react';
import MarketingLanding from './components/MarketingLanding';
import LandingPage from './components/LandingPage';
import MainApp from './components/MainApp';
import { apiService } from './services/api';
import './index.css';

interface User {
  id: string;
  username: string;
  email: string;
  householdId: string;
  role: string;
}

function AppNew() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          // Verify token is still valid
          const response = await apiService.getProfile();
          if (response.data) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear storage
            apiService.clearToken();
          }
        } catch (error) {
          // Token is invalid, clear storage
          apiService.clearToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleKeyValidated = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    apiService.clearToken();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <span className="crown" style={{ fontSize: 48 }}>👑</span>
          <h2>Royal Groceries</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLogin) {
      return <LandingPage onKeyValidated={handleKeyValidated} onBack={() => setShowLogin(false)} />;
    }
    return <MarketingLanding onGetStarted={() => setShowLogin(true)} />;
  }

  return <MainApp user={user} onLogout={handleLogout} />;
}

export default AppNew;
