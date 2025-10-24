'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Location, NearbyUser, RadarSettings } from '@/types';
import { locationService } from '@/lib/location';
import { locationPollingService } from '@/lib/location-polling';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RadarProps {
  userId: string;
  onUserSelect?: (user: NearbyUser) => void;
  className?: string;
}

export function Radar({ userId, onUserSelect, className }: RadarProps) {
  const [center, setCenter] = useState<Location | null>(null);
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<RadarSettings>({
    radius: 1000, // 1km default
    showOffline: false,
    privacyLevel: 'public',
    autoUpdate: true,
  });
  const [customRadius, setCustomRadius] = useState('');
  const [showRadiusInput, setShowRadiusInput] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Real users will be fetched from the backend

  const startLocationPolling = useCallback(() => {
    if (!center || !userId) return;

    locationPollingService.startPolling(
      userId,
      (location) => {
        setCenter(location);
      },
      (nearbyUsers) => {
        setUsers(nearbyUsers);
      },
      1000 // Poll every 5 seconds
    );
  }, [center, userId]);

  const drawUsers = useCallback((
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    users.forEach((user) => {
      if (!settings.showOffline && !user.isOnline) return;
      if (!center || !user.location) return;

      // Calculate exact distance using Haversine formula
      const exactDistance = locationService.calculateDistance(
        center.latitude,
        center.longitude,
        user.location.latitude,
        user.location.longitude
      );

      const distanceRatio = Math.min(exactDistance / settings.radius, 1);
      
      // Calculate angle based on actual bearing from user's location
      const angle = Math.atan2(
        user.location.longitude - center.longitude,
        user.location.latitude - center.latitude
      );

      const x = centerX + Math.cos(angle) * distanceRatio * maxRadius;
      const y = centerY + Math.sin(angle) * distanceRatio * maxRadius;

      // Draw user dot
      ctx.fillStyle = user.isOnline ? '#22c55e' : '#6b7280';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw user name with exact distance
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(user.name, x, y - 10);
      
      // Draw exact distance
      ctx.font = '10px sans-serif';
      ctx.fillText(locationService.formatDistance(exactDistance), x, y + 15);
    });
  }, [users, settings, center]);

  const startRadarAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw radar background
      drawRadarBackground(ctx, canvas);

      // Draw radar sweep
      drawRadarSweep(ctx, canvas, angle);

      // Draw users
      drawUsers(ctx, canvas);

      angle += 0.02;
      if (angle > Math.PI * 2) angle = 0;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [drawUsers]);

  useEffect(() => {
    initializeLocation();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userId) {
      startLocationPolling();
    }
  }, [userId, startLocationPolling]);

  useEffect(() => {
    if (center) {
      startRadarAnimation();
    }
  }, [center, startRadarAnimation]);

  useEffect(() => {
    return () => {
      locationPollingService.stopPolling();
    };
  }, []);

  const initializeLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await locationService.isLocationPermissionGranted();
      if (!hasPermission) {
        const granted = await locationService.requestLocationPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      const location = await locationService.getCurrentLocation();
      setCenter(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      // Use mock location for demo
      setCenter({
        latitude: 37.7749,
        longitude: -122.4194,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const drawRadarBackground = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    // Draw concentric circles
    for (let i = 1; i <= 4; i++) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius * i) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw crosshairs
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, canvas.height - 20);
    ctx.moveTo(20, centerY);
    ctx.lineTo(canvas.width - 20, centerY);
    ctx.stroke();
  };

  const drawRadarSweep = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    angle: number
  ) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    // Create gradient for sweep
    const gradient = ctx.createLinearGradient(
      centerX,
      centerY,
      centerX + Math.cos(angle) * maxRadius,
      centerY + Math.sin(angle) * maxRadius
    );
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, maxRadius, angle - 0.1, angle + 0.1);
    ctx.closePath();
    ctx.fill();
  };

  const handleUserClick = (user: NearbyUser) => {
    onUserSelect?.(user);
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <Card className="p-6 w-full max-w-md">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            People Nearby
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {users.filter((u) => u.isOnline).length} online • {users.length}{' '}
            total
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Getting your location...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              {error}
            </p>
            <Button onClick={initializeLocation} size="sm">
              Try Again
            </Button>
          </div>
        )}

        {center && !isLoading && (
          <>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-900"
              />
              <div className="absolute top-2 left-2 text-xs text-green-400 font-mono">
                RADAR
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    No people found in your area
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Try increasing the radius or check back later
                  </p>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {center && user.location 
                            ? locationService.formatDistance(
                                locationService.calculateDistance(
                                  center.latitude,
                                  center.longitude,
                                  user.location.latitude,
                                  user.location.longitude
                                )
                              ) + ' away'
                            : locationService.formatDistance(user.distance) + ' away'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {user.interests?.slice(0, 2).join(', ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSettings((prev) => ({
              ...prev,
              radius: prev.radius === 1000 ? 500 : 1000,
            }))
          }
        >
          {settings.radius === 1000 ? '1km' : '500m'} radius
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRadiusInput(!showRadiusInput)}
        >
          Custom
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSettings((prev) => ({ ...prev, showOffline: !prev.showOffline }))
          }
        >
          {settings.showOffline ? 'Hide offline' : 'Show offline'}
        </Button>
      </div>

      {showRadiusInput && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={customRadius}
              onChange={(e) => setCustomRadius(e.target.value)}
              placeholder="Enter radius in meters"
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <Button
              size="sm"
              onClick={() => {
                const radius = parseInt(customRadius);
                if (radius > 0 && radius <= 10000) {
                  setSettings((prev) => ({ ...prev, radius }));
                  setShowRadiusInput(false);
                  setCustomRadius('');
                }
              }}
              disabled={!customRadius || parseInt(customRadius) <= 0 || parseInt(customRadius) > 10000}
            >
              Set
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowRadiusInput(false);
                setCustomRadius('');
              }}
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Enter radius in meters (1-10000m)
          </p>
        </div>
      )}
    </div>
  );
}
