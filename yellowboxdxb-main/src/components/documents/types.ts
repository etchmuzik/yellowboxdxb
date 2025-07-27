
import { z } from "zod";
import { DocumentType } from "@/types";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const documentUploadSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File size must be less than 5MB")
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Only .pdf, .jpeg and .png files are accepted"
    ),
  expiryDate: z.date().optional(),
  notes: z.string().optional(),
});

export type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>;

export interface DocumentUploadProps {
  riderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isUploading?: boolean;
}
