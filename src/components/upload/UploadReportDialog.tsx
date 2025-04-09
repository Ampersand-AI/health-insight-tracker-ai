
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "./FileUploader";
import { Progress } from "@/components/ui/progress";

interface UploadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadReportDialog({ open, onOpenChange }: UploadReportDialogProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsAnalyzing(true);
          simulateAnalysis();
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const simulateAnalysis = () => {
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      onOpenChange(false);
      toast({
        title: "Analysis Complete",
        description: "Your report has been successfully analyzed and added to your dashboard.",
      });
    }, 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Health Report</DialogTitle>
          <DialogDescription>
            Upload your blood report in PDF or image format for AI analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isUploading && !isAnalyzing && (
            <FileUploader onFilesSelected={handleFileUpload} />
          )}

          {isUploading && (
            <div className="space-y-4">
              <p className="text-center">Uploading report...</p>
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress}% complete
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
              <p className="text-center">Analyzing your report...</p>
              <p className="text-xs text-center text-muted-foreground">
                Our AI is extracting and analyzing your health data
              </p>
            </div>
          )}

          {!isUploading && !isAnalyzing && (
            <div className="text-xs text-muted-foreground">
              <p>Supported formats: PDF, JPG, PNG</p>
              <p>Maximum file size: 10MB</p>
              <p>Your data is securely processed and never shared</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isUploading || isAnalyzing}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
