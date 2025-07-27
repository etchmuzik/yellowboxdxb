import { useState, useCallback } from 'react';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  collection,
  DocumentData,
  FirestoreError,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from 'sonner';

interface MutationOptions {
  onSuccess?: (data?: DocumentReference) => void;
  onError?: (error: FirestoreError) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface UseFirestoreMutationReturn {
  create: (data: DocumentData, options?: MutationOptions) => Promise<DocumentReference | null>;
  update: (documentId: string, data: Partial<DocumentData>, options?: MutationOptions) => Promise<boolean>;
  remove: (documentId: string, options?: MutationOptions) => Promise<boolean>;
  loading: boolean;
  error: FirestoreError | null;
}

export function useFirestoreMutation(collectionName: string): UseFirestoreMutationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | null>(null);

  const create = useCallback(async (
    data: DocumentData, 
    options: MutationOptions = {}
  ): Promise<DocumentReference | null> => {
    const { 
      onSuccess, 
      onError, 
      showToast = true,
      successMessage = 'Created successfully',
      errorMessage = 'Failed to create'
    } = options;

    setLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      if (showToast) {
        toast.success(successMessage);
      }
      
      onSuccess?.(docRef);
      setLoading(false);
      return docRef;
    } catch (err) {
      const firestoreError = err as FirestoreError;
      console.error(`Error creating document in ${collectionName}:`, firestoreError);
      setError(firestoreError);
      
      if (showToast) {
        toast.error(errorMessage);
      }
      
      onError?.(firestoreError);
      setLoading(false);
      return null;
    }
  }, [collectionName]);

  const update = useCallback(async (
    documentId: string,
    data: Partial<DocumentData>,
    options: MutationOptions = {}
  ): Promise<boolean> => {
    const { 
      onSuccess, 
      onError, 
      showToast = true,
      successMessage = 'Updated successfully',
      errorMessage = 'Failed to update'
    } = options;

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      if (showToast) {
        toast.success(successMessage);
      }
      
      onSuccess?.();
      setLoading(false);
      return true;
    } catch (err) {
      const firestoreError = err as FirestoreError;
      console.error(`Error updating document ${collectionName}/${documentId}:`, firestoreError);
      setError(firestoreError);
      
      if (showToast) {
        toast.error(errorMessage);
      }
      
      onError?.(firestoreError);
      setLoading(false);
      return false;
    }
  }, [collectionName]);

  const remove = useCallback(async (
    documentId: string,
    options: MutationOptions = {}
  ): Promise<boolean> => {
    const { 
      onSuccess, 
      onError, 
      showToast = true,
      successMessage = 'Deleted successfully',
      errorMessage = 'Failed to delete'
    } = options;

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);

      if (showToast) {
        toast.success(successMessage);
      }
      
      onSuccess?.();
      setLoading(false);
      return true;
    } catch (err) {
      const firestoreError = err as FirestoreError;
      console.error(`Error deleting document ${collectionName}/${documentId}:`, firestoreError);
      setError(firestoreError);
      
      if (showToast) {
        toast.error(errorMessage);
      }
      
      onError?.(firestoreError);
      setLoading(false);
      return false;
    }
  }, [collectionName]);

  return { create, update, remove, loading, error };
}