
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import * as auth from '../services/authService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await auth.authenticateUser(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password.');
      }
    } catch (e) {
      setError('An error occurred during login. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const dummyUserCredentials = [
      {u: 'admin', p: 'adminpass'},
      {u: 'neteng', p: 'netengpass'},
      {u: 'operator', p: 'oppass'},
      {u: 'guest', p: 'guestpass'}
  ];

  const handleDummyUserClick = (u: string, p: string) => {
      setUsername(u);
      setPassword(p);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md">
        
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                <path d="M12 12V8"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Meraki Migration Portal</h1>
          <p className="text-[var(--color-text-secondary)]">
            Sign in to migrate devices between dashboards
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-8 shadow-xl border border-[var(--color-border-primary)] animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Username
              </label>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                  className="pl-10 mt-1 block w-full px-4 py-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border-primary)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Password
              </label>
              <div className="relative">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                  className="pl-10 mt-1 block w-full px-4 py-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border-primary)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 flex items-center" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span className="ml-2">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-[var(--radius-md)] shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] focus:ring-[var(--color-primary)] disabled:opacity-50 transition-all transform active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)]">
            <p className="text-[var(--color-text-secondary)] text-center text-sm">
              Need help? Contact your administrator
            </p>
          </div>
        </div>

        {/* Demo Info Card */}
        
        
        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)] animate-fade-slide-up" style={{ animationDelay: '400ms' }}>
          <p>
            This portal uses secure authentication to protect your Meraki infrastructure
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
