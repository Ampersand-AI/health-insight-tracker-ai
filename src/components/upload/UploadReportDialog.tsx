
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "./FileUploader";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { analyzeHealthReport } from "@/services/geminiService";

interface UploadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadReportDialog({ open, onOpenChange }: UploadReportDialogProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
          processFileWithGemini(files[0]);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const processFileWithGemini = async (file: File) => {
    try {
      // Call Gemini API to analyze the health report
      const analysisResults = await analyzeHealthReport(file);
      
      if (!analysisResults) {
        setIsAnalyzing(false);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the uploaded report. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const reportId = uuidv4();
      const reportType = determineReportType(file.name);
      
      // Create a new report with the analysis results
      const newReport = {
        id: reportId,
        title: file.name.replace(/\.[^/.]+$/, "") || "Health Report",
        date: new Date().toISOString(),
        type: reportType,
        status: "Analyzed",
        metrics: analysisResults.metrics,
        recommendations: analysisResults.recommendations
      };

      // Get existing reports or initialize empty array
      const existingReports = JSON.parse(localStorage.getItem('scannedReports') || '[]');
      
      // Add new report to the beginning of the array
      const updatedReports = [newReport, ...existingReports];
      
      // Save to localStorage
      localStorage.setItem('scannedReports', JSON.stringify(updatedReports));

      setIsAnalyzing(false);
      onOpenChange(false);
      
      toast({
        title: "Analysis Complete",
        description: analysisResults.summary || "Your report has been successfully analyzed and added to your dashboard.",
      });

      // Navigate to the new report
      navigate(`/report/${reportId}`);
    } catch (error) {
      console.error("Error processing file with Gemini:", error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Error",
        description: "An error occurred while analyzing your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const determineReportType = (filename: string): string => {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('blood')) return 'blood';
    if (lowerName.includes('cholesterol')) return 'cholesterol';
    if (lowerName.includes('cbc')) return 'cbc';
    return 'blood'; // Default type
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
              <p className="text-center">Analyzing your report with Gemini AI...</p>
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
