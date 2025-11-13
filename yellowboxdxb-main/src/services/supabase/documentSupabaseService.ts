import { supabase } from '../../config/supabase';
import { RiderDocument, DocumentStatus, DocumentType } from '../../types';

// Use native crypto.randomUUID() for ID generation
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const TABLE_NAME = "rider_documents";
const STORAGE_BUCKET = "documents";

/**
 * Get all documents for a specific rider
 */
export const getDocumentsByRiderId = async (riderId: string): Promise<RiderDocument[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('rider_id', riderId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error("Error fetching rider documents:", error);
      return [];
    }

    return (data || []).map(doc => ({
      id: doc.id,
      riderId: doc.rider_id,
      type: doc.type as DocumentType,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      uploadDate: doc.upload_date,
      expiryDate: doc.expiry_date,
      status: doc.status as DocumentStatus,
      notes: doc.notes
    }));
  } catch (error) {
    console.error("Error fetching rider documents:", error);
    return [];
  }
};

/**
 * Upload a document file and create database record
 */
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
    const filePath = `${riderId}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      throw uploadError;
    }

    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    // Create document record in database
    const documentId = generateId();
    const newDocument = {
      id: documentId,
      rider_id: riderId,
      type: documentType,
      file_name: fileName,
      file_url: publicUrl,
      upload_date: new Date().toISOString(),
      expiry_date: expiryDate || null,
      status: 'Pending',
      notes: notes || null
    };

    const { data: insertData, error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert([newDocument])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating document record:", insertError);
      // Try to delete the uploaded file if database insert fails
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw insertError;
    }

    // Convert to RiderDocument type
    const documentWithId: RiderDocument = {
      id: insertData.id,
      riderId: insertData.rider_id,
      type: insertData.type as DocumentType,
      fileName: insertData.file_name,
      fileUrl: insertData.file_url,
      uploadDate: insertData.upload_date,
      expiryDate: insertData.expiry_date,
      status: insertData.status as DocumentStatus,
      notes: insertData.notes
    };

    // Trigger webhook for N8N sync (optional)
    try {
      await triggerDocumentWebhook(documentId, 'created', documentWithId);
    } catch (webhookError) {
      console.error("Error triggering webhook:", webhookError);
      // Don't fail the upload if webhook fails
    }

    return documentWithId;
  } catch (error) {
    console.error("Error uploading document:", error);
    return null;
  }
};

/**
 * Update document status and notes
 */
export const updateDocumentStatus = async (
  documentId: string,
  status: DocumentStatus,
  notes?: string
): Promise<boolean> => {
  try {
    const updates: any = { status };
    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating document status:", error);
      return false;
    }

    // Trigger webhook for N8N sync
    if (data) {
      const updatedDocument: RiderDocument = {
        id: data.id,
        riderId: data.rider_id,
        type: data.type as DocumentType,
        fileName: data.file_name,
        fileUrl: data.file_url,
        uploadDate: data.upload_date,
        expiryDate: data.expiry_date,
        status: data.status as DocumentStatus,
        notes: data.notes
      };

      try {
        await triggerDocumentWebhook(documentId, 'updated', updatedDocument);
      } catch (webhookError) {
        console.error("Error triggering webhook:", webhookError);
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating document status:", error);
    return false;
  }
};

/**
 * Delete a document (both file and database record)
 */
export const deleteDocument = async (documentId: string, fileUrl?: string): Promise<boolean> => {
  try {
    // Get document data before deletion for webhook
    const { data: docData, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      console.error("Error fetching document for deletion:", fetchError);
    }

    const documentData: RiderDocument | null = docData ? {
      id: docData.id,
      riderId: docData.rider_id,
      type: docData.type as DocumentType,
      fileName: docData.file_name,
      fileUrl: docData.file_url,
      uploadDate: docData.upload_date,
      expiryDate: docData.expiry_date,
      status: docData.status as DocumentStatus,
      notes: docData.notes
    } : null;

    // Delete file from storage
    if (fileUrl && documentData) {
      // Extract file path from URL
      const filePath = `${documentData.riderId}/${documentData.fileName}`;
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (deleteError) {
        console.error("Error deleting file from storage:", deleteError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete document record from database
    const { error: deleteDbError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', documentId);

    if (deleteDbError) {
      console.error("Error deleting document record:", deleteDbError);
      return false;
    }

    // Trigger webhook for N8N sync
    if (documentData) {
      try {
        await triggerDocumentWebhook(documentId, 'deleted', documentData);
      } catch (webhookError) {
        console.error("Error triggering webhook:", webhookError);
      }
    }

    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
};

/**
 * Get required documents based on application stage
 */
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

/**
 * Download a document file
 */
export const downloadDocument = async (filePath: string): Promise<Blob | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(filePath);

    if (error) {
      console.error("Error downloading document:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error downloading document:", error);
    return null;
  }
};

/**
 * Get documents by status
 */
export const getDocumentsByStatus = async (status: DocumentStatus): Promise<RiderDocument[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('status', status)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error("Error fetching documents by status:", error);
      return [];
    }

    return (data || []).map(doc => ({
      id: doc.id,
      riderId: doc.rider_id,
      type: doc.type as DocumentType,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      uploadDate: doc.upload_date,
      expiryDate: doc.expiry_date,
      status: doc.status as DocumentStatus,
      notes: doc.notes
    }));
  } catch (error) {
    console.error("Error fetching documents by status:", error);
    return [];
  }
};

/**
 * Get expiring documents (within next 30 days)
 */
export const getExpiringDocuments = async (days: number = 30): Promise<RiderDocument[]> => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDate.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error("Error fetching expiring documents:", error);
      return [];
    }

    return (data || []).map(doc => ({
      id: doc.id,
      riderId: doc.rider_id,
      type: doc.type as DocumentType,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      uploadDate: doc.upload_date,
      expiryDate: doc.expiry_date,
      status: doc.status as DocumentStatus,
      notes: doc.notes
    }));
  } catch (error) {
    console.error("Error fetching expiring documents:", error);
    return [];
  }
};

/**
 * Trigger webhook for N8N sync (optional integration)
 */
const triggerDocumentWebhook = async (
  documentId: string,
  action: 'created' | 'updated' | 'deleted',
  documentData: RiderDocument
): Promise<void> => {
  // Placeholder for N8N webhook integration
  // This would be implemented based on your N8N workflow
  console.log(`Document ${action}:`, documentId);

  // Example webhook call (uncomment when N8N is configured):
  // const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  // if (webhookUrl) {
  //   await fetch(webhookUrl, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       type: 'document',
  //       action,
  //       id: documentId,
  //       data: documentData
  //     })
  //   });
  // }
};
