
import React from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";
import { Upload } from "lucide-react";

interface FileUploadAreaProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName?: string;
  errorMessage?: string;
}

export const FileUploadArea = ({ onFileChange, fileName, errorMessage }: FileUploadAreaProps) => {
  return (
    <>
      <FormControl>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-slate-800 dark:bg-gray-900 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, PNG, JPG (MAX. 5MB)
              </p>
            </div>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={onFileChange}
            />
          </label>
        </div>
      </FormControl>
      {errorMessage && (
        <p className="text-sm font-medium text-destructive mt-2">
          {errorMessage}
        </p>
      )}
      {fileName && (
        <p className="text-sm text-muted-foreground mt-2">
          Selected: {fileName}
        </p>
      )}
    </>
  );
};
