import { useState, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  limit, 
  startAfter,
  getDocs,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UseFirestorePaginationOptions<T> {
  pageSize?: number;
  queryConstraints?: QueryConstraint[];
  transform?: (data: DocumentData) => T;
  onError?: (error: FirestoreError) => void;
}

interface UseFirestorePaginationReturn<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function useFirestorePagination<T = DocumentData>(
  collectionName: string,
  options: UseFirestorePaginationOptions<T> = {}
): UseFirestorePaginationReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const lastDocument = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  const { 
    pageSize = 20, 
    queryConstraints = [], 
    transform,
    onError 
  } = options;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionName);
      const constraints: QueryConstraint[] = [
        ...queryConstraints,
        limit(pageSize)
      ];

      if (lastDocument.current) {
        constraints.push(startAfter(lastDocument.current));
      }

      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const newItems = snapshot.docs.map(doc => {
        const docData = { id: doc.id, ...doc.data() };
        return transform ? transform(docData) : docData;
      }) as T[];

      setData(prev => [...prev, ...newItems]);
      lastDocument.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);
    } catch (err) {
      const firestoreError = err as FirestoreError;
      console.error(`Error loading page from ${collectionName}:`, firestoreError);
      setError(firestoreError);
      setLoading(false);
      onError?.(firestoreError);
    }
  }, [collectionName, pageSize, queryConstraints, transform, loading, hasMore, onError]);

  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setHasMore(true);
    lastDocument.current = null;
  }, []);

  return { data, loading, error, hasMore, loadMore, reset };
}