
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "./FileUploader";
import { Progress } from "@/components/ui/progress";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

// Sample metric generation for demo purposes
const generateSampleMetrics = () => {
  const metrics = [
    {
      name: "Cholesterol",
      value: Math.floor(Math.random() * (220 - 150) + 150),
      unit: "mg/dL",
      status: "normal",
      range: "125-200",
      history: []
    },
    {
      name: "Glucose",
      value: Math.floor(Math.random() * (110 - 80) + 80),
      unit: "mg/dL",
      status: "normal",
      range: "70-100",
      history: []
    },
    {
      name: "Hemoglobin",
      value: (Math.random() * (16 - 12) + 12).toFixed(1),
      unit: "g/dL",
      status: "normal",
      range: "14-18",
      history: []
    }
  ];

  // Set status based on value - fixing TypeScript errors with proper type checking
  metrics[0].status = typeof metrics[0].value === 'number' && metrics[0].value > 200 
    ? "danger" 
    : typeof metrics[0].value === 'number' && metrics[0].value > 190 
      ? "warning" 
      : "normal";
  
  metrics[1].status = typeof metrics[1].value === 'number' && metrics[1].value > 100 
    ? "warning" 
    : "normal";
  
  metrics[2].status = typeof metrics[2].value === 'string' 
    ? parseFloat(metrics[2].value) < 14 ? "warning" : "normal"
    : typeof metrics[2].value === 'number' && metrics[2].value < 14 
      ? "warning" 
      : "normal";

  // Generate history
  const today = new Date();
  metrics.forEach(metric => {
    const baseValue = metric.value;
    metric.history = Array(4).fill(null).map((_, i) => {
      const date = new Date();
      date.setMonth(today.getMonth() - (3 - i));
      const historyValue = typeof baseValue === 'string' 
        ? (parseFloat(baseValue) + (Math.random() * 2 - 1)).toFixed(1)
        : baseValue + Math.floor(Math.random() * 10 - 5);
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: typeof historyValue === 'string' ? parseFloat(historyValue) : historyValue
      };
    });
  });

  return metrics;
};

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
          simulateAnalysis(files[0]);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const simulateAnalysis = (file: File) => {
    // Simulate analysis process
    setTimeout(() => {
      const reportId = uuidv4();
      const reportType = determineReportType(file.name);
      
      // Create a new report with sample data
      const newReport = {
        id: reportId,
        title: file.name.replace(/\.[^/.]+$/, "") || "Health Report",
        date: new Date().toISOString(),
        type: reportType,
        status: "Analyzed",
        metrics: generateSampleMetrics(),
        recommendations: [
          "Maintain a balanced diet rich in vegetables and lean proteins.",
          "Engage in regular physical activity, aiming for at least 150 minutes per week.",
          "Stay hydrated by drinking at least 8 glasses of water daily."
        ]
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
        description: "Your report has been successfully analyzed and added to your dashboard.",
      });

      // Navigate to the new report
      navigate(`/report/${reportId}`);
    }, 3000);
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
