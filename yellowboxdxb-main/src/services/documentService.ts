// Adapter file: Re-exports Supabase documentService
// All existing component imports will now use Supabase Storage

export {
  getDocumentsByRiderId,
  uploadDocument,
  updateDocumentStatus,
  deleteDocument,
  getRequiredDocuments,
  downloadDocument,
  getDocumentsByStatus,
  getExpiringDocuments
} from './supabase/documentSupabaseService';
