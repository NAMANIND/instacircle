'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserManagerProps {
  onUserReady: (userId: string) => void;
}

export function UserManager({ onUserReady }: UserManagerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    // Check if user exists in localStorage
    const savedUserId = localStorage.getItem('instacircle_user_id');
    const savedUserName = localStorage.getItem('instacircle_user_name');
    
    if (savedUserId && savedUserName) {
      const userData = {
        id: savedUserId,
        name: savedUserName,
        email: `${savedUserName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      };
      setUser(userData);
      onUserReady(savedUserId);
    }
  }, [onUserReady]);

  const createUser = async () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const email = `${userName.toLowerCase().replace(/\s+/g, '')}@example.com`;

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName.trim(),
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const userData = await response.json();
      setUser(userData);

      // Save to localStorage
      localStorage.setItem('instacircle_user_id', userData.id);
      localStorage.setItem('instacircle_user_name', userData.name);
      localStorage.setItem('instacircle_user', JSON.stringify(userData));

      onUserReady(userData.id);
      setShowNameInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const resetUser = () => {
    localStorage.removeItem('instacircle_user');
    localStorage.removeItem('instacircle_user_id');
    localStorage.removeItem('instacircle_user_name');
    setUser(null);
    setUserName('');
    setShowNameInput(false);
  };

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name}!</CardTitle>
          <CardDescription>
            You&apos;re ready to use the radar. Your location will be shared with
            nearby users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                User ID: {user.id}
              </p>
            </div>
            <Button onClick={resetUser} variant="outline" size="sm">
              Reset User
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>
          Create a user account to start using the radar and sharing your
          location.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!showNameInput ? (
          <Button onClick={() => setShowNameInput(true)} className="w-full">
            Create User Account
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={createUser} 
                disabled={isLoading || !userName.trim()} 
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Account'}
              </Button>
              <Button 
                onClick={() => setShowNameInput(false)} 
                variant="outline" 
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
          This will create a temporary user account for testing the radar
          feature.
        </p>
      </CardContent>
    </Card>
  );
}
