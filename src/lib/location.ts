import { Location } from '@/types';

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private callbacks: ((location: Location) => void)[] = [];

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          resolve(location);
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  startWatching(callback: (location: Location) => void): void {
    this.callbacks.push(callback);

    if (this.watchId === null) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          this.callbacks.forEach((cb) => cb(location));
        },
        (error) => {
          console.error('Location watch error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      );
    }
  }

  stopWatching(callback?: (location: Location) => void): void {
    if (callback) {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    } else {
      this.callbacks = [];
    }

    if (this.callbacks.length === 0 && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }

  isLocationPermissionGranted(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.permissions) {
        resolve(false);
        return;
      }

      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          resolve(result.state === 'granted');
        })
        .catch(() => {
          resolve(false);
        });
    });
  }

  requestLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      this.getCurrentLocation()
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }
}

export const locationService = LocationService.getInstance();
