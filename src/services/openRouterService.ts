
import { toast } from "@/hooks/use-toast";

// Type definitions for health report analysis
export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: "normal" | "warning" | "danger";
  range: string;
  history: Array<{
    date: string;
    value: number;
  }>;
}

export interface AnalysisResult {
  metrics: HealthMetric[];
  recommendations: string[];
  summary?: string;
}

export async function analyzeHealthReport(ocrText: string): Promise<AnalysisResult | null> {
  try {
    const apiKey = localStorage.getItem("openrouter_api_key");
    const selectedModel = localStorage.getItem("selected_model") || "anthropic/claude-3-haiku";
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenRouter API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }

    console.log("Analyzing health report with text:", ocrText);
    
    // In a production environment, we would make an actual API call to OpenRouter
    // For now, simulate the analysis with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Extract metrics from OCR text - this is a simple simulation
        // In production, this would use AI to extract structured data
        const metrics: HealthMetric[] = extractMetricsFromText(ocrText);
        
        const result: AnalysisResult = {
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
        
        resolve(result);
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

function extractMetricsFromText(text: string): HealthMetric[] {
  const metrics: HealthMetric[] = [];
  const today = new Date();
  
  // Simple regex pattern matching to extract values
  // This is a simplified version - in production, use AI for better extraction
  const cholesterolMatch = text.match(/cholesterol:?\s*(\d+)/i);
  if (cholesterolMatch) {
    const value = parseInt(cholesterolMatch[1]);
    metrics.push({
      name: "Cholesterol",
      value,
      unit: "mg/dL",
      status: value > 200 ? "danger" : value > 190 ? "warning" : "normal",
      range: "125-200",
      history: generateHistory(value)
    });
  }
  
  const glucoseMatch = text.match(/glucose:?\s*(\d+)/i);
  if (glucoseMatch) {
    const value = parseInt(glucoseMatch[1]);
    metrics.push({
      name: "Glucose",
      value,
      unit: "mg/dL",
      status: value > 100 ? "warning" : "normal",
      range: "70-100",
      history: generateHistory(value)
    });
  }
  
  const hemoglobinMatch = text.match(/hemoglobin:?\s*(\d+\.?\d*)/i);
  if (hemoglobinMatch) {
    const value = parseFloat(hemoglobinMatch[1]);
    metrics.push({
      name: "Hemoglobin",
      value,
      unit: "g/dL",
      status: value < 14 ? "warning" : "normal",
      range: "14-18",
      history: generateHistory(value)
    });
  }
  
  // If no metrics were extracted, add some placeholders
  if (metrics.length === 0) {
    metrics.push({
      name: "Blood Pressure",
      value: 120,
      unit: "mmHg",
      status: "normal",
      range: "90-140",
      history: generateHistory(120)
    });
  }
  
  return metrics;
}

function generateHistory(baseValue: number): Array<{ date: string; value: number }> {
  const today = new Date();
  return Array(4).fill(null).map((_, i) => {
    const date = new Date();
    date.setMonth(today.getMonth() - (3 - i));
    const historyValue = typeof baseValue === 'number' 
      ? baseValue + (Math.random() * 10 - 5)
      : 0;
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: Math.round(historyValue * 10) / 10
    };
  });
}
