import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UseFirestoreDocumentOptions<T> {
  transform?: (data: DocumentData) => T;
  onError?: (error: FirestoreError) => void;
  enabled?: boolean;
}

interface UseFirestoreDocumentReturn<T> {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
  exists: boolean;
  refetch: () => void;
}

export function useFirestoreDocument<T = DocumentData>(
  collectionName: string,
  documentId: string | null | undefined,
  options: UseFirestoreDocumentOptions<T> = {}
): UseFirestoreDocumentReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [exists, setExists] = useState(false);

  const { transform, onError, enabled = true } = options;

  const fetchDocument = useCallback(() => {
    if (!documentId || !enabled) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    try {
      const documentRef = doc(db, collectionName, documentId);
      
      const unsubscribe = onSnapshot(
        documentRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const docData = { id: snapshot.id, ...snapshot.data() };
            setData(transform ? transform(docData) : docData as T);
            setExists(true);
          } else {
            setData(null);
            setExists(false);
          }
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching document ${collectionName}/${documentId}:`, err);
          setError(err);
          setLoading(false);
          setExists(false);
          onError?.(err);
        }
      );

      return unsubscribe;
    } catch (err) {
      const firestoreError = err as FirestoreError;
      console.error(`Error setting up document listener:`, firestoreError);
      setError(firestoreError);
      setLoading(false);
      setExists(false);
      onError?.(firestoreError);
      return () => {};
    }
  }, [collectionName, documentId, transform, onError, enabled]);

  useEffect(() => {
    const unsubscribe = fetchDocument();
    return () => unsubscribe();
  }, [fetchDocument]);

  return { data, loading, error, exists, refetch: fetchDocument };
}