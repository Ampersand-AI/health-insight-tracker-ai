
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
  description?: string;
  category?: string;
}

export interface AnalysisResult {
  metrics: HealthMetric[];
  recommendations: string[];
  summary?: string;
  detailedAnalysis?: string;
  modelUsed?: string;
  categories?: string[];
}

async function analyzeWithModel(ocrText: string, model: string, apiKey: string): Promise<AnalysisResult | null> {
  console.log(`Attempting analysis with model: ${model}`);
  
  try {
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
            content: `You are a medical assistant specializing in analyzing blood test results. Extract ALL relevant health metrics in detail. For each metric:
1. Determine its status: 'normal' if within range, 'warning' if slightly outside range, or 'danger' if significantly outside range
2. Provide a detailed description of what the parameter measures and its significance
3. Include reference ranges for each parameter
4. Categorize each parameter (e.g., "Electrolytes", "Lipids", "Liver Function", "Kidney Function", "Blood Cell Counts", etc.)

Format your response as valid JSON with the structure:
{
  "metrics": [
    {
      "name": string,
      "value": number,
      "unit": string,
      "status": "normal"|"warning"|"danger",
      "range": string,
      "description": string,
      "category": string
    }
  ],
  "recommendations": [string],
  "summary": string,
  "detailedAnalysis": string,
  "categories": [string]
}

The detailedAnalysis should provide a comprehensive assessment of overall health based on the test results, highlighting any potential areas of concern, probable causes of abnormal results, and their clinical significance. Make sure to identify ANY and ALL parameters in the report, even those that aren't commonly tested.`
          },
          {
            role: "user", 
            content: `Analyze this blood test result. Extract ALL metrics mentioned in the report, including reference ranges. Format as JSON: ${ocrText}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 4000
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
      history: [],
      // Make sure value is a number when possible
      value: typeof metric.value === 'string' && !isNaN(parseFloat(metric.value)) 
        ? parseFloat(metric.value) 
        : metric.value,
      // Ensure category exists
      category: metric.category || "Other"
    }));
    
    return {
      metrics: metricsWithHistory,
      recommendations: analysisContent.recommendations,
      summary: analysisContent.summary,
      detailedAnalysis: analysisContent.detailedAnalysis,
      categories: analysisContent.categories || [],
      modelUsed: model
    };
  } catch (error) {
    console.error(`Error analyzing with model ${model}:`, error);
    return null;
  }
}

export async function analyzeHealthReport(ocrText: string): Promise<AnalysisResult | null> {
  try {
    const apiKey = localStorage.getItem("openrouter_api_key");
    const primaryModel = localStorage.getItem("openrouter_model") || "anthropic/claude-3-opus:beta";
    const useMultipleModels = localStorage.getItem("openrouter_use_multiple_models") === "true";
    const fallbackModelsStr = localStorage.getItem("openrouter_fallback_models") || "[]";
    let fallbackModels = JSON.parse(fallbackModelsStr);
    
    // Limit to maximum 8 fallback models
    if (fallbackModels.length > 8) {
      fallbackModels = fallbackModels.slice(0, 8);
    }
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenRouter API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }

    console.log(`Starting health report analysis with primary model: ${primaryModel}`);
    console.log(`Fallback enabled: ${useMultipleModels}, Fallback models: ${fallbackModels.length}`);
    
    // Try the primary model first
    let result = await analyzeWithModel(ocrText, primaryModel, apiKey);
    
    // If primary model failed and fallback is enabled, try fallback models
    if (!result && useMultipleModels && fallbackModels.length > 0) {
      console.log("Primary model failed, trying fallback models");
      
      toast({
        title: "Trying Alternative Models",
        description: "Primary model analysis failed. Trying fallback models...",
      });
      
      for (const fallbackModel of fallbackModels) {
        result = await analyzeWithModel(ocrText, fallbackModel, apiKey);
        if (result) {
          console.log(`Successfully analyzed with fallback model: ${fallbackModel}`);
          toast({
            title: "Analysis Complete",
            description: `Analysis completed using fallback model: ${fallbackModel.split('/').pop()}`,
          });
          break;
        }
      }
    }
    
    if (result) {
      const modelName = result.modelUsed?.split('/').pop() || primaryModel.split('/').pop();
      toast({
        title: "Analysis Complete",
        description: `Health report analyzed successfully using ${modelName}`,
      });
      return result;
    } else {
      throw new Error("All models failed to analyze the report");
    }
  } catch (error) {
    console.error("Error analyzing health report:", error);
    toast({
      title: "Analysis Failed",
      description: "Failed to analyze your health report with all configured models. Please check your API key and try again.",
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
