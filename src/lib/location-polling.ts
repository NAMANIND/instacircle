import { Location, NearbyUser } from '@/types';

export class LocationPollingService {
  private static instance: LocationPollingService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private currentUserId: string | null = null;
  private onLocationUpdate: ((location: Location) => void) | null = null;
  private onNearbyUsersUpdate: ((users: NearbyUser[]) => void) | null = null;

  static getInstance(): LocationPollingService {
    if (!LocationPollingService.instance) {
      LocationPollingService.instance = new LocationPollingService();
    }
    return LocationPollingService.instance;
  }

  startPolling(
    userId: string,
    onLocationUpdate: (location: Location) => void,
    onNearbyUsersUpdate: (users: NearbyUser[]) => void,
    intervalMs: number = 5000 // 5 seconds default
  ) {
    // Don't restart if already polling for the same user
    if (this.isPolling && this.currentUserId === userId) {
      return;
    }

    if (this.isPolling) {
      this.stopPolling();
    }

    this.currentUserId = userId;
    this.onLocationUpdate = onLocationUpdate;
    this.onNearbyUsersUpdate = onNearbyUsersUpdate;
    this.isPolling = true;

    // Start immediate polling
    this.poll();

    // Set up interval
    this.pollingInterval = setInterval(() => {
      this.poll();
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    this.currentUserId = null;
    this.onLocationUpdate = null;
    this.onNearbyUsersUpdate = null;
  }

  private async poll() {
    if (!this.currentUserId || !this.isPolling) return;

    try {
      // Get current location
      const location = await this.getCurrentLocation();
      if (location) {
        // Update location on server
        await this.updateLocationOnServer(location);

        // Notify listeners
        this.onLocationUpdate?.(location);

        // Fetch nearby users
        const nearbyUsers = await this.fetchNearbyUsers(location);
        this.onNearbyUsersUpdate?.(nearbyUsers);
      }
    } catch (error) {
      console.error('Location polling error:', error);
    }
  }

  private async getCurrentLocation(): Promise<Location | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
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
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // 30 seconds
        }
      );
    });
  }

  private async updateLocationOnServer(location: Location): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const response = await fetch('/api/users/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.currentUserId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update location on server');
      }
    } catch (error) {
      console.error('Error updating location on server:', error);
    }
  }

  private async fetchNearbyUsers(location: Location): Promise<NearbyUser[]> {
    if (!this.currentUserId) return [];

    try {
      const response = await fetch(
        `/api/users/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=2000000&userId=${this.currentUserId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby users');
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      return [];
    }
  }

  // Manual location update (for immediate updates)
  async updateLocationManually(location: Location): Promise<void> {
    if (!this.currentUserId) return;

    await this.updateLocationOnServer(location);
    this.onLocationUpdate?.(location);

    const nearbyUsers = await this.fetchNearbyUsers(location);
    this.onNearbyUsersUpdate?.(nearbyUsers);
  }

  // Get current polling status
  getPollingStatus(): { isPolling: boolean; userId: string | null } {
    return {
      isPolling: this.isPolling,
      userId: this.currentUserId,
    };
  }
}

export const locationPollingService = LocationPollingService.getInstance();
