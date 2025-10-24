'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';

interface PrivacySettings {
  id: string;
  userId: string;
  visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  showDistance: boolean;
  showLastSeen: boolean;
  allowNearbySearch: boolean;
}

interface PrivacySettingsProps {
  userId: string;
  onSettingsChange?: (settings: PrivacySettings) => void;
}

export function PrivacySettings({
  userId,
  onSettingsChange,
}: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrivacySettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/privacy?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch privacy settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPrivacySettings();
  }, [fetchPrivacySettings]);

  const updateSettings = async (newSettings: Partial<PrivacySettings>) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/users/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...newSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      onSettingsChange?.(updatedSettings);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisibilityChange = (
    visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE'
  ) => {
    updateSettings({ visibility });
  };

  const handleToggle = (field: keyof PrivacySettings) => {
    if (!settings) return;
    updateSettings({ [field]: !settings[field] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Loading your privacy preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Error loading settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchPrivacySettings} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control who can see your location and how much information you share
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visibility Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Who can see your location?
          </label>
          <Select
            value={settings.visibility}
            onChange={(e) => handleVisibilityChange(e.target.value as 'PUBLIC' | 'FRIENDS' | 'PRIVATE')}
            disabled={isSaving}
          >
            <option value="PUBLIC">Everyone</option>
            <option value="FRIENDS">Friends Only</option>
            <option value="PRIVATE">No One</option>
          </Select>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {settings.visibility === 'PUBLIC' &&
              'Anyone can see your location on the radar'}
            {settings.visibility === 'FRIENDS' &&
              'Only people you connect with can see your location'}
            {settings.visibility === 'PRIVATE' &&
              'Your location is completely hidden'}
          </p>
        </div>

        {/* Show Distance */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-900 dark:text-white">
              Show exact distance
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Let others see how far away you are
            </p>
          </div>
          <Switch
            checked={settings.showDistance}
            onChange={() => handleToggle('showDistance')}
            disabled={isSaving || settings.visibility === 'PRIVATE'}
          />
        </div>

        {/* Show Last Seen */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-900 dark:text-white">
              Show last seen time
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Let others see when you were last active
            </p>
          </div>
          <Switch
            checked={settings.showLastSeen}
            onChange={() => handleToggle('showLastSeen')}
            disabled={isSaving || settings.visibility === 'PRIVATE'}
          />
        </div>

        {/* Allow Nearby Search */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-900 dark:text-white">
              Allow nearby search
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Let others find you when searching nearby
            </p>
          </div>
          <Switch
            checked={settings.allowNearbySearch}
            onChange={() => handleToggle('allowNearbySearch')}
            disabled={isSaving || settings.visibility === 'PRIVATE'}
          />
        </div>

        {isSaving && (
          <div className="text-center py-2">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Saving your preferences...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
