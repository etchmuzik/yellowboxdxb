
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { RiderDocument, DocumentStatus, DocumentType } from "../types";
import { triggerSync } from "./webhookService";

// Use native crypto.randomUUID() instead of uuid package
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const COLLECTION = "rider_documents";

export const getDocumentsByRiderId = async (riderId: string): Promise<RiderDocument[]> => {
  try {
    const q = query(collection(db, COLLECTION), where("riderId", "==", riderId));
    const docsSnapshot = await getDocs(q);
    return docsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RiderDocument));
  } catch (error) {
    console.error("Error fetching rider documents:", error);
    return [];
  }
};

export const uploadDocument = async (
  riderId: string, 
  file: File, 
  documentType: string,
  expiryDate?: string,
  notes?: string
): Promise<RiderDocument | null> => {
  try {
    // Create unique file path
    const fileExtension = file.name.split('.').pop();
    const fileName = `${riderId}_${documentType.replace(/\s/g, '_')}_${generateId()}.${fileExtension}`;
    const filePath = `documents/${riderId}/${fileName}`;
    
    // Upload file to storage
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(storageRef);
    
    // Create document record
    const documentId = generateId();
    const newDocument: Omit<RiderDocument, "id"> & { riderId: string } = {
      riderId,
      type: documentType as DocumentType,
      fileName: fileName,
      fileUrl: fileUrl,
      uploadDate: new Date().toISOString(),
      expiryDate: expiryDate || undefined,
      status: 'Pending',
      notes: notes || undefined,
    };
    
    // Save to Firestore
    await setDoc(doc(db, COLLECTION, documentId), newDocument);
    
    const documentWithId = { id: documentId, ...newDocument };
    
    // Trigger webhook for N8N sync
    await triggerSync('document', documentId, 'created', documentWithId);
    
    return documentWithId;
  } catch (error) {
    console.error("Error uploading document:", error);
    return null;
  }
};

export const updateDocumentStatus = async (
  documentId: string, 
  status: DocumentStatus, 
  notes?: string
): Promise<boolean> => {
  try {
    const updates: Partial<RiderDocument> = { status };
    if (notes) updates.notes = notes;
    
    await updateDoc(doc(db, COLLECTION, documentId), updates);
    
    // Get updated document data for webhook
    const docSnapshot = await getDoc(doc(db, COLLECTION, documentId));
    if (docSnapshot.exists()) {
      const updatedDocument = { id: documentId, ...docSnapshot.data() } as RiderDocument;
      await triggerSync('document', documentId, 'updated', updatedDocument);
    }
    
    return true;
  } catch (error) {
    console.error("Error updating document status:", error);
    return false;
  }
};

export const deleteDocument = async (documentId: string, fileUrl?: string): Promise<boolean> => {
  try {
    // Get document data before deletion for webhook
    const docSnapshot = await getDoc(doc(db, COLLECTION, documentId));
    const documentData = docSnapshot.exists() ? { id: documentId, ...docSnapshot.data() } as RiderDocument : null;
    
    // Delete file from storage if URL is provided
    if (fileUrl) {
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
    }
    
    // Delete document record
    await deleteDoc(doc(db, COLLECTION, documentId));
    
    // Trigger webhook for N8N sync
    if (documentData) {
      await triggerSync('document', documentId, 'deleted', documentData);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
};

// Determine which documents are required based on the application stage
export const getRequiredDocuments = (applicationStage: string): DocumentType[] => {
  switch (applicationStage) {
    case 'Applied':
      return ['Visa'] as DocumentType[];
    case 'Docs Verified':
      return ['Visa', 'Insurance'] as DocumentType[];
    case 'Theory Test':
      return ['Visa', 'Insurance', 'Theory Test'] as DocumentType[];
    case 'Road Test':
      return ['Visa', 'Insurance', 'Theory Test', 'Road Test'] as DocumentType[];
    case 'Medical':
      return ['Visa', 'Insurance', 'Theory Test', 'Road Test', 'Medical Certificate'] as DocumentType[];
    case 'ID Issued':
      return ['Visa', 'Insurance', 'Theory Test', 'Road Test', 'Medical Certificate', 'Residency ID'] as DocumentType[];
    case 'Active':
      return ['Visa', 'Insurance', 'Driver License', 'Medical Certificate', 'Residency ID'] as DocumentType[];
    default:
      return ['Visa'] as DocumentType[];
  }
};
