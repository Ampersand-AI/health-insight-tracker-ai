import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "./FileUploader";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { performOCR, clearAllData } from "@/services/openAIOCRService";
import { analyzeHealthReport } from "@/services/openAIService";
import { Bell, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadReportDialog({ open, onOpenChange }: UploadReportDialogProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<"selecting" | "ocr" | "analysis">("selecting");
  const [processingDetail, setProcessingDetail] = useState<string>("");
  const [modelsSuccess, setModelsSuccess] = useState<number>(0);
  const [modelsTotal, setModelsTotal] = useState<number>(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Create a safe toast wrapper that can be passed to async functions
  const safeToast = useCallback((props: any) => {
    try {
      toast(props);
      
      // Track model selection
      if (props.title === "Using Selected Models" || props.title === "Models Selected") {
        const match = props.description.match(/Processing with (\d+)|Using (\d+) models/);
        if (match && (match[1] || match[2])) {
          const totalModels = parseInt(match[1] || match[2]);
          setModelsTotal(totalModels);
        }
      }
      
      // Count successful models with functional updates
      if (props.title && props.title.includes("OCR Success:")) {
        setModelsSuccess(prev => {
          const newCount = prev + 1;
          setProcessingDetail(`Successfully processed with ${newCount}/${modelsTotal} models...`);
          return newCount;
        });
      }
    } catch (err) {
      console.error("Error in toast wrapper:", err);
    }
  }, [toast]);

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
    setModelsSuccess(0);
    setModelsTotal(0);

    // Clear any existing data
    clearAllData();

    // Simulate file upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsProcessing(true);
          setProcessingStage("selecting");
          setProcessingDetail("Preparing to process with your selected models...");
          processFile(files[0]);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const processFile = async (file: File) => {
    try {
      // First set selecting models stage
      setProcessingStage("selecting");
      setProcessingDetail("Using models configured in your settings...");
      
      // Step 1: Perform OCR on the uploaded file with user-selected models
      setProcessingStage("ocr");
      setProcessingDetail("Processing document with your selected models...");

      // Perform OCR with safe toast callback
      const ocrResult = await performOCR(file, safeToast);
      
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
      setProcessingDetail("Analyzing parameters and reference ranges...");
      
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
      
      // Get patient info from localStorage (set during OCR)
      const patientName = localStorage.getItem('patientName');
      const patientAge = localStorage.getItem('patientAge');
      const patientGender = localStorage.getItem('patientGender');
      
      // Update patient info if available from localStorage
      if (!analysisResults.patientInfo) {
        analysisResults.patientInfo = {};
      }
      
      if (patientName) analysisResults.patientInfo.name = patientName;
      if (patientAge) analysisResults.patientInfo.age = patientAge;
      if (patientGender) analysisResults.patientInfo.gender = patientGender;
      
      // Create a report title based on patient name if available
      let reportTitle = file.name.replace(/\.[^/.]+$/, "");
      if (analysisResults.patientInfo?.name) {
        reportTitle = `${analysisResults.patientInfo.name}'s Health Report`;
      }
      
      // Create a new report with the analysis results
      const newReport = {
        id: reportId,
        title: reportTitle || "Health Report",
        date: new Date().toISOString(),
        type: reportType,
        status: "Analyzed",
        metrics: analysisResults.metrics,
        recommendations: analysisResults.recommendations,
        rawText: ocrResult.text,
        summary: analysisResults.summary,
        detailedAnalysis: analysisResults.detailedAnalysis,
        categories: analysisResults.categories || [],
        patientInfo: analysisResults.patientInfo || {},
        modelUsed: analysisResults.modelUsed || ocrResult.modelUsed || "Unknown"
      };

      // Store only the current report (removes history as requested)
      localStorage.setItem('scannedReports', JSON.stringify([newReport]));

      setIsProcessing(false);
      onOpenChange(false);
      
      // Count risk metrics
      const highRiskMetrics = analysisResults.metrics.filter(
        metric => metric.status === "danger"
      );
      
      const mediumRiskMetrics = analysisResults.metrics.filter(
        metric => metric.status === "warning"
      );
      
      toast({
        title: "Analysis Complete",
        description: `Found ${analysisResults.metrics.length} parameters with ${highRiskMetrics.length} high risk and ${mediumRiskMetrics.length} medium risk items that require attention.`,
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
    if (lowerText.includes('metabolic') || lowerText.includes('panel')) return 'metabolic';
    if (lowerText.includes('liver') || lowerText.includes('hepatic')) return 'liver';
    if (lowerText.includes('kidney') || lowerText.includes('renal')) return 'kidney';
    if (lowerText.includes('thyroid')) return 'thyroid';
    if (lowerText.includes('lipid')) return 'lipid';
    if (lowerText.includes('glucose') || lowerText.includes('sugar')) return 'glucose';
    return 'blood'; // Default type
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Health Report</DialogTitle>
          <DialogDescription>
            Upload your health report in PDF or image format for comprehensive AI analysis
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
              
              {processingStage === "selecting" && (
                <div className="text-center">
                  <p className="font-medium">Using your selected models</p>
                  <p className="text-sm text-muted-foreground">{processingDetail}</p>
                </div>
              )}
              
              {processingStage === "ocr" && (
                <div className="text-center">
                  <p className="font-medium">Processing document with AI</p>
                  <p className="text-sm text-muted-foreground">{processingDetail}</p>
                  
                  {modelsTotal > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <span className="text-green-500 font-medium">{modelsSuccess}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{modelsTotal}</span>
                        <span className="text-muted-foreground ml-1">models successful</span>
                      </div>
                      <Progress 
                        value={(modelsSuccess / modelsTotal) * 100} 
                        className="mt-2 h-2" 
                      />
                    </div>
                  )}
                </div>
              )}
              
              {processingStage === "analysis" && (
                <div className="text-center">
                  <p className="font-medium">Analyzing health data</p>
                  <p className="text-sm text-muted-foreground">{processingDetail}</p>
                </div>
              )}
            </div>
          )}

          {!isUploading && !isProcessing && (
            <div className="text-xs text-muted-foreground">
              <p>Supported formats: PDF, JPG, PNG</p>
              <p>Maximum file size: 10MB</p>
              <p>Your data is securely processed and never shared</p>
              <p className="mt-2 text-xs italic">Analysis will be performed using only your selected models from Settings</p>
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
