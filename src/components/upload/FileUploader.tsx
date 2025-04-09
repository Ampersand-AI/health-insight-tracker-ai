
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    console.log("Validating files:", files.map(f => `${f.name} (${f.type}, ${f.size} bytes)`));
    
    // Check if files are valid (PDF, JPG, PNG)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const validFiles = files.filter(file => validTypes.includes(file.type));
    
    if (validFiles.length === 0) {
      toast({
        title: "Invalid file format",
        description: "Please upload a PDF, JPG, or PNG file.",
        variant: "destructive",
      });
      console.log("Invalid file format. Accepted types:", validTypes);
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
      console.log("File too large. Maximum size:", maxSize, "bytes");
      return;
    }
    
    // Only take the first file
    const selectedFile = validSizeFiles[0];
    setSelectedFile(selectedFile);
    
    console.log("File validated successfully:", selectedFile.name);
    onFilesSelected([selectedFile]);
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <File className="h-5 w-5 text-red-500" />;
    } else if (file.type.startsWith('image/')) {
      return <FileType className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // Format file size to be human-readable
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-black bg-gray-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        {!selectedFile ? (
          <>
            <div className="rounded-full bg-gray-50 p-3 border border-gray-200">
              <Upload className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Drag & drop your file here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
            </div>
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {getFileIcon(selectedFile)}
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-destructive"
              >
                Change
              </Button>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
        />
        
        {!selectedFile ? (
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Select File
          </Button>
        ) : (
          <div className="text-xs text-gray-500 italic">
            File ready for analysis. Your health report will be processed with AI.
          </div>
        )}
      </div>
    </div>
  );
}
