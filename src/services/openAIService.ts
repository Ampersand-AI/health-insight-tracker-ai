
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
    const model = localStorage.getItem("openrouter_model") || "anthropic/claude-3-opus:beta";
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenRouter API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }

    console.log(`Analyzing health report text using model: ${model}`);
    
    // Make the API call to OpenRouter with a more detailed prompt
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system", 
            content: "You are a medical assistant specializing in analyzing blood test results. Extract ALL relevant health metrics in detail. For each metric, determine its status: 'normal' if within range, 'warning' if slightly outside range, or 'danger' if significantly outside range. Format your response as valid JSON with the structure: {\"metrics\": [{\"name\": string, \"value\": number, \"unit\": string, \"status\": \"normal\"|\"warning\"|\"danger\", \"range\": string, \"description\": string}], \"recommendations\": [string], \"summary\": string}"
          },
          {
            role: "user", 
            content: `Analyze this blood test result. Extract ALL metrics mentioned in the report, including reference ranges. Format as JSON: ${ocrText}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let analysisContent;
    
    try {
      // Check if we need to parse the content
      if (typeof data.choices[0].message.content === 'string') {
        analysisContent = JSON.parse(data.choices[0].message.content);
      } else {
        analysisContent = data.choices[0].message.content;
      }
      
      console.log("Analysis result:", analysisContent);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      throw new Error("Invalid response format from OpenRouter");
    }
    
    console.log("Analysis result obtained");
    
    // Add empty history arrays to each metric
    const metricsWithHistory = analysisContent.metrics.map((metric: any) => ({
      ...metric,
      history: []
    }));
    
    return {
      metrics: metricsWithHistory,
      recommendations: analysisContent.recommendations,
      summary: analysisContent.summary
    };
  } catch (error) {
    console.error("Error analyzing health report:", error);
    toast({
      title: "Analysis Failed",
      description: "Failed to analyze your health report. Please check your API key and try again.",
      variant: "destructive",
    });
    return null;
  }
}

// Clear all stored health data
export function clearAllHealthData(): void {
  localStorage.removeItem('scannedReports');
  toast({
    title: "Data Cleared",
    description: "All health data has been removed from your device.",
  });
}
