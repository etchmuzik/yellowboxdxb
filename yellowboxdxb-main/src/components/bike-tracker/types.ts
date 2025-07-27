
export interface RiderLocation {
  riderId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  heading: number;
  riderName: string;
  bikeType: string;
  district: string;
  status: 'Active' | 'Idle' | 'Offline';
  lastUpdated: string;
  photo?: string;
  bikeId?: string;
  bikeModel?: string;
  bikeRegistration?: string;
  gpsTrackerId?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  status: string;
  photo?: string;
}

export interface BikeMapProps {
  riders: RiderLocation[];
  selectedRiderId: string | null;
  onRiderSelect: (riderId: string) => void;
}
