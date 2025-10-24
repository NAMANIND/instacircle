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

  useEffect(() => {
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('instacircle_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      onUserReady(userData.id);
    }
  }, [onUserReady]);

  const createUser = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const name = `User_${Math.random().toString(36).substr(2, 9)}`;
      const email = `${name.toLowerCase()}@example.com`;

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const userData = await response.json();
      setUser(userData);

      // Save to localStorage
      localStorage.setItem('instacircle_user', JSON.stringify(userData));

      onUserReady(userData.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const resetUser = () => {
    localStorage.removeItem('instacircle_user');
    setUser(null);
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

        <Button onClick={createUser} disabled={isLoading} className="w-full">
          {isLoading ? 'Creating User...' : 'Create User Account'}
        </Button>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
          This will create a temporary user account for testing the radar
          feature.
        </p>
      </CardContent>
    </Card>
  );
}
