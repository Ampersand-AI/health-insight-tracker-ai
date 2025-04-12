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
  categories?: string[];
  patientInfo?: PatientInfo;
}

// Function to get patient info from localStorage
function getStoredPatientInfo(): PatientInfo {
  const patientInfo: PatientInfo = {};
  
  // Get patient name, age, and gender from localStorage (set during OCR)
  const patientName = localStorage.getItem('patientName');
  const patientAge = localStorage.getItem('patientAge');
  const patientGender = localStorage.getItem('patientGender');
  
  if (patientName) patientInfo.name = patientName;
  if (patientAge) patientInfo.age = patientAge;
  if (patientGender) patientInfo.gender = patientGender;
  
  return patientInfo;
}

async function analyzeWithGroq(ocrText: string, apiKey: string): Promise<AnalysisResult | null> {
  console.log(`Attempting analysis with Groq`);
  
  try {
    // Make the API call to Groq with a detailed prompt for better parameter extraction
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system", 
            content: `You are a medical assistant specializing in analyzing health reports and lab results. Extract ALL relevant information in extreme detail:

1. Patient Information: Extract any patient details (name, ID, gender, date of birth, age, collection date).
2. Health Metrics: For EVERY SINGLE parameter mentioned in the report, no matter how minor:
   - Extract the exact parameter name EXACTLY AS SHOWN in the report (maintain original terminology)
   - Extract the exact value and unit as shown
   - Extract the exact reference range as shown
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
            content: `Analyze this health report/lab result. Extract ALL metrics mentioned, ALL patient details, and ALL reference ranges: ${ocrText}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
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
        detailedAnalysis: "There was an error processing the report content. The OCR text has been preserved for reference."
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
      patientInfo: analysisContent.patientInfo || {}
    };
  } catch (error) {
    console.error(`Error analyzing with Groq:`, error);
    return null;
  }
}

export async function analyzeHealthReport(ocrText: string): Promise<AnalysisResult | null> {
  try {
    const apiKey = localStorage.getItem("groq_api_key");
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your Groq API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }

    console.log(`Starting health report analysis with Groq`);
    
    toast({
      title: "Analyzing Report",
      description: "Processing your report with Groq...",
    });
    
    // Analyze with Groq
    const result = await analyzeWithGroq(ocrText, apiKey);
    
    if (!result) {
      throw new Error("Failed to analyze the report with Groq");
    }
    
    // Update with stored patient info
    const storedPatientInfo = getStoredPatientInfo();
    const mergedPatientInfo = {
      ...(result.patientInfo || {}),
      name: storedPatientInfo.name || result.patientInfo?.name,
      age: storedPatientInfo.age || result.patientInfo?.age,
      gender: storedPatientInfo.gender || result.patientInfo?.gender
    };
    
    const finalResult = {
      ...result,
      patientInfo: mergedPatientInfo
    };
    
    toast({
      title: "Analysis Complete",
      description: `Health report analyzed successfully (${finalResult.metrics.length} parameters found)`,
    });
    
    // Remove all historical data by storing only the current report
    localStorage.removeItem('scannedReports');
    
    return finalResult;
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
  localStorage.removeItem('patientName');
  localStorage.removeItem('patientAge');
  localStorage.removeItem('patientGender');
  toast({
    title: "Data Cleared",
    description: "All health data has been removed from your device.",
  });
}
