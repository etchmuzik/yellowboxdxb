
import React from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { DocumentType } from "@/types";
import { FileUploadArea } from "./FileUploadArea";
import { DocumentUploadFormValues, documentUploadSchema, DocumentUploadProps } from "./types";
import { uploadDocument } from "@/services/documentService";
import { toast } from "sonner";

interface DocumentUploadFormProps extends DocumentUploadProps {
  onOpenChange: (open: boolean) => void;
}

const documentTypes: DocumentType[] = [
  "Visa",
  "Driver License",
  "Medical Certificate",
  "Insurance",
  "Residency ID",
  "Theory Test",
  "Road Test"
];

export const DocumentUploadForm = ({ 
  riderId, 
  onSuccess, 
  onOpenChange 
}: DocumentUploadFormProps) => {
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      documentType: undefined,
      notes: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("file", file);
    }
  };

  const onSubmit = async (values: DocumentUploadFormValues) => {
    setIsUploading(true);
    try {
      const expiryDateString = values.expiryDate ? values.expiryDate.toISOString() : undefined;
      
      const result = await uploadDocument(
        riderId,
        values.file,
        values.documentType,
        expiryDateString,
        values.notes
      );
      
      if (result) {
        toast.success("Document uploaded successfully");
        form.reset();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error("Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("An error occurred while uploading the document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="documentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Upload File</FormLabel>
          <FileUploadArea 
            onFileChange={handleFileChange}
            fileName={form.watch("file")?.name}
            errorMessage={form.formState.errors.file?.message}
          />
        </FormItem>

        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiry Date (if applicable)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={`w-full pl-3 text-left font-normal ${
                        !field.value && "text-muted-foreground"
                      }`}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>No expiry date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Add any additional notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
