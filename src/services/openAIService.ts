
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
    const apiKey = localStorage.getItem("openai_api_key");
    const model = localStorage.getItem("openai_model") || "gpt-4o";
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }

    console.log(`Analyzing health report text using model: ${model}`);
    
    // Make the API call to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system", 
            content: "You are a medical assistant specializing in analyzing blood test results. Extract relevant health metrics, provide recommendations, and a brief summary. Format your response as valid JSON with the structure: {\"metrics\": [{\"name\": string, \"value\": number, \"unit\": string, \"status\": \"normal\"|\"warning\"|\"danger\", \"range\": string}], \"recommendations\": [string], \"summary\": string}"
          },
          {
            role: "user", 
            content: `Analyze this blood test result and extract the metrics, provide health recommendations, and a brief summary: ${ocrText}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const analysisContent = JSON.parse(data.choices[0].message.content);
    
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
