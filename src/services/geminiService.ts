
import { toast } from "@/hooks/use-toast";

// Type definitions for Gemini API responses
export interface GeminiAnalysisResult {
  metrics: Array<{
    name: string;
    value: number | string;
    unit: string;
    status: "normal" | "warning" | "danger";
    range: string;
    history: Array<{
      date: string;
      value: number;
    }>;
  }>;
  recommendations: string[];
  summary?: string;
}

export async function analyzeHealthReport(file: File): Promise<GeminiAnalysisResult | null> {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Convert the file to base64 for API consumption
    const base64File = await fileToBase64(file);
    
    // For demo purposes, we'll use a timeout to simulate API call
    // In production, replace this with actual Gemini API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate analysis based on the file name to simulate AI analysis
        // This would be replaced with actual Gemini API response
        const analysis = generateAnalysisFromFileName(file.name);
        resolve(analysis);
      }, 3000);
    });
  } catch (error) {
    console.error("Error analyzing health report:", error);
    toast({
      title: "Analysis Failed",
      description: "Failed to analyze your health report. Please try again.",
      variant: "destructive",
    });
    return null;
  }
}

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

// Temporary function to generate analysis from file name
// This will be replaced with actual Gemini API response
function generateAnalysisFromFileName(filename: string): GeminiAnalysisResult {
  const lowerName = filename.toLowerCase();
  const metrics = [
    {
      name: "Cholesterol",
      value: Math.floor(Math.random() * (220 - 150) + 150),
      unit: "mg/dL",
      status: "normal" as const,
      range: "125-200",
      history: [] as Array<{ date: string; value: number }>
    },
    {
      name: "Glucose",
      value: Math.floor(Math.random() * (110 - 80) + 80),
      unit: "mg/dL",
      status: "normal" as const,
      range: "70-100",
      history: [] as Array<{ date: string; value: number }>
    },
    {
      name: "Hemoglobin",
      value: parseFloat((Math.random() * (16 - 12) + 12).toFixed(1)),
      unit: "g/dL",
      status: "normal" as const,
      range: "14-18",
      history: [] as Array<{ date: string; value: number }>
    }
  ];

  // Set status based on value
  metrics[0].status = metrics[0].value > 200 ? "danger" : metrics[0].value > 190 ? "warning" : "normal";
  metrics[1].status = metrics[1].value > 100 ? "warning" : "normal";
  metrics[2].status = typeof metrics[2].value === 'number' && metrics[2].value < 14 ? "warning" : "normal";

  // Generate history
  const today = new Date();
  metrics.forEach(metric => {
    const baseValue = metric.value;
    metric.history = Array(4).fill(null).map((_, i) => {
      const date = new Date();
      date.setMonth(today.getMonth() - (3 - i));
      const historyValue = typeof baseValue === 'string' 
        ? parseFloat(baseValue) + (Math.random() * 2 - 1)
        : baseValue + Math.floor(Math.random() * 10 - 5);
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: typeof historyValue === 'string' ? parseFloat(historyValue) : historyValue
      };
    });
  });

  // Add specific values based on file name to simulate intelligent analysis
  if (lowerName.includes('cholesterol')) {
    metrics[0].value = 210;
    metrics[0].status = "warning";
  } else if (lowerName.includes('diabetes') || lowerName.includes('glucose')) {
    metrics[1].value = 115;
    metrics[1].status = "warning";
  } else if (lowerName.includes('anemia') || lowerName.includes('blood')) {
    metrics[2].value = 12.5;
    metrics[2].status = "warning";
  }

  return {
    metrics,
    recommendations: [
      "Maintain a balanced diet rich in vegetables and lean proteins.",
      "Engage in regular physical activity, aiming for at least 150 minutes per week.",
      "Stay hydrated by drinking at least 8 glasses of water daily."
    ],
    summary: `Analysis of your health report shows ${
      metrics.filter(m => m.status !== "normal").length
    } metrics that may need attention. Follow the recommendations for improved health.`
  };
}
