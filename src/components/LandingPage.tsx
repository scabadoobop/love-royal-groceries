import { useState } from 'react';
import { apiService } from '../services/api';
import './LandingPage.css';

interface User {
  id: string;
  username: string;
  email: string;
  householdId: string;
  role: string;
}

interface LandingPageProps {
  onKeyValidated: (user: User) => void;
}

export default function LandingPage({ onKeyValidated }: LandingPageProps) {
  const [step, setStep] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Registration form state
  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    householdKey: ''
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // Household key validation removed; backend supports optional key on register

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await apiService.register({
        username: regForm.username,
        email: regForm.email,
        password: regForm.password,
        householdKey: regForm.householdKey?.trim() || undefined,
      });
      if (data) {
        onKeyValidated(data.user);
      } else {
        setError(error || 'Registration failed');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      const { data, error } = await apiService.login({
        username: loginForm.username,
        password: loginForm.password,
      });
      if (data) {
        onKeyValidated(data.user);
      } else {
        setError(error || 'Login failed');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt('Enter your email address:');
    if (!email) return;

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      alert(data.message);
    } catch (err) {
      alert('Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <span className="crown">👑</span>
          <h1 className="royal-title">Royal Pantry & Fridge</h1>
          <p className="landing-subtitle">Secure household grocery management</p>
        </div>

        <div className="landing-card">
          {step === 'register' && (
            <div className="register-step">
              <h2>Create your account</h2>
              <p>Sign up to start using Royal Pantry & Fridge.</p>

              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={regForm.username}
                    onChange={(e) => setRegForm({...regForm, username: e.target.value})}
                    placeholder="Choose a username"
                    className="royal-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                    placeholder="your@email.com"
                    className="royal-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                    placeholder="Create a secure password"
                    className="royal-input"
                    required
                    minLength={8}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="householdKey">Household Key (optional)</label>
                  <input
                    id="householdKey"
                    type="text"
                    value={regForm.householdKey}
                    onChange={(e) => setRegForm({...regForm, householdKey: e.target.value.toUpperCase()})}
                    placeholder="Enter a key if you were given one"
                    className="royal-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({...regForm, confirmPassword: e.target.value})}
                    placeholder="Confirm your password"
                    className="royal-input"
                    required
                    minLength={8}
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button 
                  type="submit"
                  disabled={loading}
                  className="royal-button primary"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="auth-switch">
                <p>Already have an account?</p>
                <button 
                  onClick={() => setStep('login')}
                  className="link-button"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {step === 'login' && (
            <div className="login-step">
              <h2>Sign In</h2>
              <p>Welcome back! Sign in to access your household.</p>

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="loginUsername">Username or Email</label>
                  <input
                    id="loginUsername"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    placeholder="Enter your username or email"
                    className="royal-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="loginPassword">Password</label>
                  <input
                    id="loginPassword"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="Enter your password"
                    className="royal-input"
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button 
                  type="submit"
                  disabled={loading}
                  className="royal-button primary"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="auth-actions">
                <button 
                  onClick={handleForgotPassword}
                  className="link-button"
                >
                  Forgot Password?
                </button>
                
              </div>
            </div>
          )}
        </div>

        <div className="landing-features">
          <h3>What you'll get:</h3>
          <div className="features-grid">
            <div className="feature">
              <span className="feature-icon">🛒</span>
              <h4>Grocery Management</h4>
              <p>Track items, quantities, and low stock alerts</p>
            </div>
            <div className="feature">
              <span className="feature-icon">💬</span>
              <h4>Household Chat</h4>
              <p>Discuss recipes, tips, and household matters</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <h4>Secure & Private</h4>
              <p>Your data is encrypted and only shared with your household</p>
            </div>
            <div className="feature">
              <span className="feature-icon">📱</span>
              <h4>Multi-Device</h4>
              <p>Access from any device, anywhere</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
