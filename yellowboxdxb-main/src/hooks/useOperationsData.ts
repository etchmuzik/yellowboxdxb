import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Rider, Bike } from '@/types';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  riderId?: string;
}

interface OperationsData {
  riders: Rider[];
  bikes: Bike[];
  activities: Activity[];
  loading: boolean;
}

export function useOperationsData(): OperationsData {
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const unsubscribeRiders = onSnapshot(
      collection(db, 'riders'),
      (snapshot) => {
        const ridersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Rider[];
        setRiders(ridersData);
      },
      (error) => {
        console.error('Error fetching riders:', error);
      }
    );

    const unsubscribeBikes = onSnapshot(
      collection(db, 'bikes'),
      (snapshot) => {
        const bikesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bike[];
        setBikes(bikesData);
      },
      (error) => {
        console.error('Error fetching bikes:', error);
      }
    );

    const unsubscribeActivities = onSnapshot(
      query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        const activitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];
        setActivities(activitiesData);
      },
      (error) => {
        console.error('Error fetching activities:', error);
      }
    );

    setLoading(false);

    return () => {
      unsubscribeRiders();
      unsubscribeBikes();
      unsubscribeActivities();
    };
  }, []);

  return { riders, bikes, activities, loading };
}

export type { Activity };