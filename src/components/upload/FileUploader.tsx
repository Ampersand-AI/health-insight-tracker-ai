
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    validateAndProcessFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      validateAndProcessFiles(files);
    }
  };

  const validateAndProcessFiles = (files: File[]) => {
    // Check if files are valid (PDF, JPG, PNG)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const validFiles = files.filter(file => validTypes.includes(file.type));
    
    if (validFiles.length === 0) {
      toast({
        title: "Invalid file format",
        description: "Please upload a PDF, JPG, or PNG file.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validSizeFiles = validFiles.filter(file => file.size <= maxSize);
    
    if (validSizeFiles.length < validFiles.length) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    onFilesSelected(validSizeFiles);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-background p-3 border">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Drag & drop your file here</p>
          <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
        />
        <Button 
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Select File
        </Button>
      </div>
    </div>
  );
}
