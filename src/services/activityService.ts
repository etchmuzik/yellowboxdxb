import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  riderId?: string;
}

export const getRecentActivities = async (limitCount: number = 20): Promise<Activity[]> => {
  try {
    const activitiesRef = collection(db, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Activity[];
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};