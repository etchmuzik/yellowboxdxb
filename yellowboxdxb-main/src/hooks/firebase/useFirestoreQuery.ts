import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  where,
  orderBy,
  limit as limitConstraint,
  QueryConstraint,
  DocumentData,
  WhereFilterOp,
  OrderByDirection,
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/config/firebase';

interface Filter {
  field: string;
  operator: WhereFilterOp;
  value: string | number | boolean | Date | null | undefined;
}

interface OrderBy {
  field: string;
  direction?: OrderByDirection;
}

interface UseFirestoreQueryOptions<T> {
  filters?: Filter[];
  orderBy?: OrderBy[];
  limit?: number;
  transform?: (data: DocumentData) => T;
  onError?: (error: FirestoreError) => void;
  enabled?: boolean;
}

interface UseFirestoreQueryReturn<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  refetch: () => void;
}

export function useFirestoreQuery<T = DocumentData>(
  collectionName: string,
  options: UseFirestoreQueryOptions<T> = {}
): UseFirestoreQueryReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const { 
    filters = [], 
    orderBy: orderByOptions = [], 
    limit,
    transform,
    onError,
    enabled = true
  } = options;

  const queryConstraints = useMemo(() => {
    const constraints: QueryConstraint[] = [];

    filters.forEach(filter => {
      constraints.push(where(filter.field, filter.operator, filter.value));
    });

    orderByOptions.forEach(order => {
      constraints.push(orderBy(order.field, order.direction || 'asc'));
    });

    if (limit) {
      constraints.push(limitConstraint(limit));
    }

    return constraints;
  }, [filters, orderByOptions, limit]);

  const fetchData = useCallback(() => {
    if (!enabled) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...queryConstraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(doc => {
            const docData = { id: doc.id, ...doc.data() };
            return transform ? transform(docData) : docData;
          }) as T[];
          
          setData(items);
          setLoading(false);
        },
        (err) => {
          console.error(`Error executing query on ${collectionName}:`, err);
          setError(err);
          setLoading(false);
          onError?.(err);
        }
      );

      return unsubscribe;
    } catch (err) {
      const firestoreError = err as FirestoreError;
      console.error(`Error setting up query listener:`, firestoreError);
      setError(firestoreError);
      setLoading(false);
      onError?.(firestoreError);
      return () => {};
    }
  }, [collectionName, queryConstraints, transform, onError, enabled]);

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export type { Filter, OrderBy };