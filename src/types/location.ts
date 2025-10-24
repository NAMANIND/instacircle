export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface UserLocation extends Location {
  userId: string;
  isActive: boolean;
  lastSeen: number;
}

export interface RadarSettings {
  radius: number; // in meters
  showOffline: boolean;
  privacyLevel: 'public' | 'friends' | 'private';
  autoUpdate: boolean;
}

export interface NearbyUser {
  id: string;
  name: string;
  avatar?: string;
  distance: number; // in meters
  location: Location;
  isOnline: boolean;
  lastSeen: number;
  interests?: string[];
}

export interface RadarState {
  center: Location | null;
  users: NearbyUser[];
  isLoading: boolean;
  error: string | null;
  settings: RadarSettings;
}
