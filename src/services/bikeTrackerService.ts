import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, Timestamp, setDoc, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/config/firestore-schema";

export interface BikeLocation {
  riderId: string;
  riderName: string;
  bikeId: string;
  bikeModel: string;
  bikeType?: string;
  bikeRegistration?: string;
  gpsTrackerId?: string;
  latitude: number;
  longitude: number;
  status: 'Active' | 'Idle' | 'Offline';
  speed: number;
  lastUpdate: Date;
  district?: string;
  battery?: number;
}

export class BikeTrackerService {
  // Subscribe to real-time bike locations
  static subscribeToLocations(callback: (locations: BikeLocation[]) => void) {
    const locationsQuery = query(
      collection(db, COLLECTIONS.BIKE_LOCATIONS),
      where("isActive", "==", true)
    );

    return onSnapshot(locationsQuery, (snapshot) => {
      const locations: BikeLocation[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        locations.push({
          riderId: doc.id,
          riderName: data.riderName || 'Unknown Rider',
          bikeId: data.bikeId || '',
          bikeModel: data.bikeModel || 'Unknown Model',
          bikeType: data.bikeType,
          bikeRegistration: data.bikeRegistration,
          gpsTrackerId: data.gpsTrackerId,
          latitude: data.latitude || 25.2048, // Default to Dubai center
          longitude: data.longitude || 55.2708,
          status: data.status || 'Offline',
          speed: data.speed || 0,
          lastUpdate: data.lastUpdate?.toDate() || new Date(),
          district: data.district || this.getDistrictFromCoordinates(data.latitude, data.longitude),
          battery: data.battery || 100
        });
      });

      callback(locations);
    });
  }

  // Update rider location
  static async updateLocation(riderId: string, locationData: {
    latitude: number;
    longitude: number;
    speed?: number;
    status?: 'Active' | 'Idle' | 'Offline';
    battery?: number;
  }) {
    try {
      const locationRef = doc(db, COLLECTIONS.BIKE_LOCATIONS, riderId);
      
      await setDoc(locationRef, {
        ...locationData,
        district: this.getDistrictFromCoordinates(locationData.latitude, locationData.longitude),
        lastUpdate: serverTimestamp(),
        isActive: true
      }, { merge: true });
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  }

  // Initialize location document for a new rider
  static async initializeRiderLocation(riderId: string, riderData: {
    riderName: string;
    bikeId: string;
    bikeModel: string;
    bikeType?: string;
    bikeRegistration?: string;
    gpsTrackerId?: string;
  }) {
    try {
      const locationRef = doc(db, COLLECTIONS.BIKE_LOCATIONS, riderId);
      
      await setDoc(locationRef, {
        ...riderData,
        latitude: 25.2048, // Dubai center
        longitude: 55.2708,
        status: 'Offline',
        speed: 0,
        battery: 100,
        district: 'Downtown Dubai',
        lastUpdate: serverTimestamp(),
        isActive: true
      }, { merge: true });
    } catch (error) {
      console.error("Error initializing rider location:", error);
      throw error;
    }
  }

  // Get district name from coordinates
  private static getDistrictFromCoordinates(lat: number, lng: number): string {
    const districts = [
      { name: "Dubai Marina", lat: 25.0701, lng: 55.1397, radius: 0.02 },
      { name: "Downtown Dubai", lat: 25.1972, lng: 55.2744, radius: 0.02 },
      { name: "Deira", lat: 25.2788, lng: 55.3242, radius: 0.03 },
      { name: "Jumeirah", lat: 25.2048, lng: 55.2708, radius: 0.03 },
      { name: "Al Quoz", lat: 25.1539, lng: 55.2362, radius: 0.02 },
      { name: "Business Bay", lat: 25.1857, lng: 55.2795, radius: 0.02 },
      { name: "JLT", lat: 25.0675, lng: 55.1376, radius: 0.015 },
      { name: "Palm Jumeirah", lat: 25.1124, lng: 55.1390, radius: 0.02 },
      { name: "Dubai Silicon Oasis", lat: 25.1279, lng: 55.3807, radius: 0.03 },
      { name: "Al Barsha", lat: 25.1112, lng: 55.2130, radius: 0.02 }
    ];

    // Find the closest district
    for (const district of districts) {
      const distance = Math.sqrt(
        Math.pow(lat - district.lat, 2) + 
        Math.pow(lng - district.lng, 2)
      );
      
      if (distance <= district.radius) {
        return district.name;
      }
    }

    // If no district found, determine by general area
    if (lat > 25.2 && lng > 55.3) return "Deira";
    if (lat < 25.1 && lng < 55.2) return "Dubai Marina";
    
    return "Dubai"; // Default
  }

  // Get delivery statistics for a rider
  static async getRiderDeliveryStats(riderId: string, days: number = 7) {
    try {
      const deliveriesQuery = query(
        collection(db, COLLECTIONS.DELIVERIES),
        where("riderId", "==", riderId),
        where("timestamp", ">=", new Date(Date.now() - days * 24 * 60 * 60 * 1000))
      );

      const snapshot = await deliveriesQuery.get();
      
      return {
        totalDeliveries: snapshot.size,
        averagePerDay: snapshot.size / days,
        lastDelivery: snapshot.docs[0]?.data().timestamp?.toDate() || null
      };
    } catch (error) {
      console.error("Error fetching delivery stats:", error);
      return {
        totalDeliveries: 0,
        averagePerDay: 0,
        lastDelivery: null
      };
    }
  }
}