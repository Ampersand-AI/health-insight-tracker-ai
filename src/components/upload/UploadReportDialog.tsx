
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "./FileUploader";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { performOCR } from "@/services/openAIOCRService";
import { analyzeHealthReport } from "@/services/openAIService";

interface UploadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadReportDialog({ open, onOpenChange }: UploadReportDialogProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<"ocr" | "analysis">("ocr");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) return;

    const apiKey = localStorage.getItem("openrouter_api_key");
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenRouter API key in the settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsProcessing(true);
          setProcessingStage("ocr");
          processFile(files[0]);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const processFile = async (file: File) => {
    try {
      // Step 1: Perform OCR on the uploaded file
      setProcessingStage("ocr");
      const ocrResult = await performOCR(file);
      
      if (!ocrResult) {
        setIsProcessing(false);
        toast({
          title: "OCR Failed",
          description: "Could not extract text from the uploaded report. Please check your API key and try again.",
          variant: "destructive",
        });
        return;
      }

      // Step 2: Analyze the extracted text
      setProcessingStage("analysis");
      const analysisResults = await analyzeHealthReport(ocrResult.text);
      
      if (!analysisResults) {
        setIsProcessing(false);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the text from your report. Please check your API key and try again.",
          variant: "destructive",
        });
        return;
      }

      const reportId = uuidv4();
      const reportType = determineReportType(file.name, ocrResult.text);
      
      // Create a new report with the analysis results
      const newReport = {
        id: reportId,
        title: file.name.replace(/\.[^/.]+$/, "") || "Health Report",
        date: new Date().toISOString(),
        type: reportType,
        status: "Analyzed",
        metrics: analysisResults.metrics,
        recommendations: analysisResults.recommendations,
        rawText: ocrResult.text,
        summary: analysisResults.summary
      };

      // Clear existing reports to start fresh (as requested)
      localStorage.setItem('scannedReports', JSON.stringify([newReport]));

      setIsProcessing(false);
      onOpenChange(false);
      
      // Count risk metrics
      const riskMetrics = analysisResults.metrics.filter(
        metric => metric.status === "warning" || metric.status === "danger"
      );
      
      toast({
        title: "Analysis Complete",
        description: riskMetrics.length > 0 
          ? `Found ${riskMetrics.length} parameters that require attention.` 
          : "All parameters are within normal ranges.",
      });

      // Navigate to the new report
      navigate(`/report/${reportId}`);
    } catch (error) {
      console.error("Error processing file:", error);
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const determineReportType = (filename: string, text: string): string => {
    const lowerName = filename.toLowerCase();
    const lowerText = text.toLowerCase();
    
    if (lowerName.includes('blood') || lowerText.includes('blood')) return 'blood';
    if (lowerName.includes('cholesterol') || lowerText.includes('cholesterol')) return 'cholesterol';
    if (lowerName.includes('cbc') || lowerText.includes('cbc') || lowerText.includes('complete blood count')) return 'cbc';
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
          {!isUploading && !isProcessing && (
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

          {isProcessing && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
              <p className="text-center">
                {processingStage === "ocr" 
                  ? "Extracting text from your report with OpenRouter..." 
                  : "Analyzing your health data with OpenRouter..."}
              </p>
              <p className="text-xs text-center text-muted-foreground">
                {processingStage === "ocr"
                  ? "Our AI is reading and extracting the text from your document"
                  : "Our AI is identifying health metrics and generating recommendations"}
              </p>
            </div>
          )}

          {!isUploading && !isProcessing && (
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
            disabled={isUploading || isProcessing}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
