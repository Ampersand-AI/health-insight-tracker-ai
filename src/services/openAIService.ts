import { toast } from "@/hooks/use-toast";

// Type definitions for health report analysis
export interface HealthMetric {
  name: string;
  value: number | string;
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

export interface PatientInfo {
  name?: string;
  age?: string;
  gender?: string;
  dateOfBirth?: string;
  patientId?: string;
  collectionDate?: string;
  reportDate?: string;
  doctorName?: string;
  hospitalName?: string;
}

export interface AnalysisResult {
  metrics: HealthMetric[];
  recommendations: string[];
  summary?: string;
  detailedAnalysis?: string;
  modelUsed?: string;
  categories?: string[];
  patientInfo?: PatientInfo;
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
            content: `You are a medical assistant specializing in analyzing health reports and lab results. Extract ALL relevant information in detail:

1. Patient Information: Extract any patient details (name, ID, gender, date of birth, collection date).
2. Health Metrics: For EVERY single parameter mentioned in the report:
   - Extract the exact parameter name AS SHOWN in the report (maintain original terminology)
   - Extract the value and unit exactly as shown
   - Extract the reference range exactly as shown
   - Determine status: 'normal' if within range, 'warning' if slightly outside, 'danger' if significantly outside
   - Provide a detailed description of what each parameter measures
   - Categorize each parameter (e.g., "Electrolytes", "Lipids", "Liver Function", etc.)

Format your response as valid JSON with the structure:
{
  "patientInfo": {
    "name": string,
    "age": string,
    "gender": string,
    "dateOfBirth": string,
    "patientId": string,
    "collectionDate": string,
    "reportDate": string,
    "doctorName": string,
    "hospitalName": string
  },
  "metrics": [
    {
      "name": string,
      "value": number or string,
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

The detailedAnalysis should provide a comprehensive assessment of overall health based on the test results. Extract EVERY parameter mentioned, even rare ones, using EXACTLY the same terminology used in the report. DO NOT skip any parameters.`
          },
          {
            role: "user", 
            content: `Analyze this health report/lab result. Extract ALL metrics mentioned, patient details, and reference ranges: ${ocrText}`
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
    
    // Extract the content from the response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid API response structure:", data);
      return null;
    }
    
    const contentText = data.choices[0].message.content;
    console.log("Raw content response:", contentText);
    
    // Try to parse the JSON response, handling different response formats
    let analysisContent;
    try {
      // If the content is already an object, use it directly
      if (typeof contentText === 'object') {
        analysisContent = contentText;
      } else if (typeof contentText === 'string') {
        // Try to extract JSON if it's wrapped in markdown code blocks or text
        const jsonMatch = contentText.match(/```(?:json)?([\s\S]*?)```/) || 
                          contentText.match(/({[\s\S]*})/) ||
                          [null, contentText];
        
        const jsonText = jsonMatch[1]?.trim() || contentText;
        analysisContent = JSON.parse(jsonText);
      }
      
      if (!analysisContent || !analysisContent.metrics) {
        // If we couldn't parse proper JSON or the metrics are missing, create a basic structure
        analysisContent = {
          metrics: [],
          patientInfo: {},
          recommendations: ["Unable to extract specific metrics from this report format. Please consult your healthcare provider for interpretation."],
          summary: "The analysis could not extract structured metrics from this report format.",
          detailedAnalysis: "The report format could not be properly parsed into structured metrics. The OCR text has been preserved for reference."
        };
      }
      
      console.log("Parsed analysis result:", analysisContent);
    } catch (error) {
      console.error("Error parsing model response:", error);
      console.log("Failed content:", contentText);
      // Return a basic structure if parsing fails
      return {
        metrics: [],
        patientInfo: {},
        recommendations: ["Unable to analyze the report format. Please consult your healthcare provider for interpretation."],
        summary: "The analysis encountered an error when processing this report.",
        detailedAnalysis: "There was an error processing the report content. The OCR text has been preserved for reference.",
        modelUsed: model
      };
    }
    
    // Add empty history arrays to each metric and ensure values are properly formatted
    const metricsWithHistory = (analysisContent.metrics || []).map((metric: any) => {
      // Ensure the value is a number when possible, or keep as string if not
      let value = metric.value;
      if (typeof value === 'string' && !isNaN(parseFloat(value)) && !value.includes('/')) {
        value = parseFloat(value);
      }
      
      return {
        name: String(metric.name || "Unnamed Parameter"),
        value: value,
        unit: String(metric.unit || ""),
        status: metric.status || "normal",
        range: String(metric.range || "Not specified"),
        history: [],
        description: String(metric.description || ""),
        category: String(metric.category || "Other")
      };
    });
    
    return {
      metrics: metricsWithHistory,
      recommendations: analysisContent.recommendations || [],
      summary: analysisContent.summary || "",
      detailedAnalysis: analysisContent.detailedAnalysis || "",
      categories: analysisContent.categories || [],
      patientInfo: analysisContent.patientInfo || {},
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
    if ((!result || result.metrics.length === 0) && useMultipleModels && fallbackModels.length > 0) {
      console.log("Primary model failed, trying fallback models");
      
      toast({
        title: "Trying Alternative Models",
        description: "Primary model analysis failed. Trying fallback models...",
      });
      
      for (const fallbackModel of fallbackModels) {
        const fallbackResult = await analyzeWithModel(ocrText, fallbackModel, apiKey);
        
        // Only use the fallback if it extracted metrics and is better than current result
        if (fallbackResult && (!result || fallbackResult.metrics.length > result.metrics.length)) {
          result = fallbackResult;
          console.log(`Successfully analyzed with fallback model: ${fallbackModel} (found ${fallbackResult.metrics.length} metrics)`);
          
          // If we have a good number of metrics, stop trying more models
          if (fallbackResult.metrics.length > 5) {
            break;
          }
        }
      }
    }
    
    if (result) {
      const modelName = result.modelUsed?.split('/').pop() || primaryModel.split('/').pop();
      toast({
        title: "Analysis Complete",
        description: `Health report analyzed successfully using ${modelName} (${result.metrics.length} parameters found)`,
      });
      
      // Remove all historical data by storing only the current report
      // This effectively clears history per the user's request
      localStorage.removeItem('scannedReports');
      
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
