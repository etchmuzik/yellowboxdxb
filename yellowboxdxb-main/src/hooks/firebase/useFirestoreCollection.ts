import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint, 
  DocumentData,
  Query,
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UseFirestoreCollectionOptions<T> {
  queryConstraints?: QueryConstraint[];
  transform?: (data: DocumentData) => T;
  onError?: (error: FirestoreError) => void;
}

interface UseFirestoreCollectionReturn<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  refetch: () => void;
}

export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  options: UseFirestoreCollectionOptions<T> = {}
): UseFirestoreCollectionReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const { queryConstraints = [], transform, onError } = options;

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionName);
      const q = queryConstraints.length > 0 
        ? query(collectionRef, ...queryConstraints)
        : collectionRef;

      const unsubscribe = onSnapshot(
        q as Query<DocumentData>,
        (snapshot) => {
          const items = snapshot.docs.map(doc => {
            const docData = { id: doc.id, ...doc.data() };
            return transform ? transform(docData) : docData;
          }) as T[];
          
          setData(items);
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err);
          setLoading(false);
          onError?.(err);
        }
      );

      return unsubscribe;
    } catch (err) {
      const firestoreError = err as FirestoreError;
      console.error(`Error setting up ${collectionName} listener:`, firestoreError);
      setError(firestoreError);
      setLoading(false);
      onError?.(firestoreError);
      return () => {};
    }
  }, [collectionName, queryConstraints, transform, onError]);

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}