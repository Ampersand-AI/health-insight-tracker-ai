
import { toast } from "@/hooks/use-toast";

export interface OCRResult {
  text: string;
  confidence?: number;
  modelUsed?: string;
}

// Function to get available models from OpenRouter that support vision tasks
async function getAvailableModels(apiKey: string): Promise<string[]> {
  try {
    console.log("Fetching available models from OpenRouter");
    
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error when fetching models:", errorData);
      return [];
    }
    
    const data = await response.json();
    console.log("OpenRouter models response:", data);
    
    // Safely filter models that support vision tasks
    const supportedModels = data.data
      .filter((model: any) => {
        // Check if capabilities exists and includes vision
        const hasVisionCapability = model.capabilities && 
                                   Array.isArray(model.capabilities) && 
                                   model.capabilities.includes("vision");
        
        // Check context length - we need at least 4000 for document analysis
        const hasEnoughContext = model.context_length && model.context_length >= 4000;
        
        // Check if it's free or reasonably priced
        const isReasonablyPriced = !model.pricing || 
                                  (model.pricing.prompt && model.pricing.prompt < 0.01);
        
        return hasVisionCapability && hasEnoughContext;
      })
      .map((model: any) => model.id);
    
    console.log("Available OCR-capable models:", supportedModels);
    
    // If no models found or error in filtering, return default set
    if (supportedModels.length === 0) {
      console.log("No OCR-capable models found, using default models");
      return getDefaultModels();
    }
    
    return supportedModels;
  } catch (error) {
    console.error("Error fetching available models:", error);
    console.log("Falling back to default models due to error");
    return getDefaultModels();
  }
}

// Function to get default models known to work well with OCR
function getDefaultModels(): string[] {
  return [
    "anthropic/claude-3-opus:beta",
    "openai/gpt-4o",
    "anthropic/claude-3-sonnet:beta",
    "google/gemini-pro-vision",
    "anthropic/claude-3-haiku:beta"
  ];
}

async function performOCRWithModel(file: File, model: string, apiKey: string): Promise<OCRResult | null> {
  try {
    console.log(`Attempting OCR with model: ${model} for file: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    // Convert the file to base64 - improved conversion handling
    let base64File;
    try {
      base64File = await fileToBase64(file);
      console.log(`Successfully converted file to base64, length: ${base64File.length}`);
    } catch (error) {
      console.error("Error converting file to base64:", error);
      throw new Error("Failed to convert file to base64");
    }
    
    // Prepare the prompt with more specific instructions
    const prompt = `Please analyze this image or PDF and extract ALL the text content from it. This is a health report or medical lab result document.
    
1. Extract ALL text exactly as it appears, preserving the exact layout and formatting where possible
2. Include ALL parameter names, values, units, and reference ranges
3. Preserve ALL numeric values and units precisely
4. Include section headers, titles, and labels
5. Capture ALL footnotes and additional information
6. Don't summarize or interpret - extract the complete text exactly as it appears

The text extraction needs to be exhaustive and complete, as it will be used for medical analysis.`;

    // Log more information for debugging
    console.log(`Sending request to OpenRouter API for model: ${model}`);
    console.log(`File type: ${file.type}, File size: ${file.size} bytes`);
    console.log(`Base64 string length: ${base64File.length} characters`);
    
    // Make the API call to OpenRouter with improved error handling
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
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: base64File } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    console.log(`Received response from OpenRouter API for model ${model}, status:`, response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`OpenRouter API error with model ${model}:`, errorData);
      console.error(`Error details:`, JSON.stringify(errorData, null, 2));
      return null;
    }

    const data = await response.json();
    console.log(`Successfully parsed response JSON from model: ${model}`);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error(`Invalid response format from model ${model}:`, data);
      return null;
    }
    
    const ocrText = data.choices[0].message.content;
    console.log(`OCR completed successfully with model: ${model}, extracted ${ocrText.length} characters`);
    console.log(`First 200 chars of extracted text: ${ocrText.substring(0, 200)}...`);
    
    // Notify success for this specific model
    toast({
      title: `OCR Success: ${model.split('/').pop()}`,
      description: `Successfully extracted ${ocrText.length} characters of text`,
    });
    
    return { 
      text: ocrText,
      modelUsed: model
    };
  } catch (error) {
    console.error(`Error performing OCR with model ${model}:`, error);
    
    // Notify failure for this specific model
    toast({
      title: `OCR Failed: ${model.split('/').pop()}`,
      description: "Could not process document with this model",
      variant: "destructive",
    });
    
    return null;
  }
}

export async function performOCR(file: File): Promise<OCRResult | null> {
  try {
    // First clear any existing data
    clearAllData();
    
    const apiKey = localStorage.getItem("openrouter_api_key");
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenRouter API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }

    console.log(`Performing OCR on file: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    // Check if file type is supported
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF, JPG, or PNG file.",
        variant: "destructive",
      });
      return null;
    }
    
    // Check if file size is within limits (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Selecting Models",
      description: "Automatically selecting best models for document analysis...",
    });

    // Get available models from OpenRouter that support vision tasks
    const availableModels = await getAvailableModels(apiKey);
    const modelsToUse = availableModels.slice(0, 5); // Use top 5 models
    
    if (modelsToUse.length === 0) {
      toast({
        title: "No Available Models",
        description: "Could not find any OpenRouter models that support document analysis. Please try again later.",
        variant: "destructive",
      });
      return null;
    }

    console.log("Selected models for OCR:", modelsToUse);
    
    toast({
      title: "Models Selected",
      description: `Using ${modelsToUse.length} models for comprehensive document analysis`,
    });

    // Extract patient name from filename
    const patientName = extractPatientNameFromFilename(file.name);
    if (patientName) {
      localStorage.setItem('patientName', patientName);
      toast({
        title: "Patient Identified",
        description: `Detected patient name: ${patientName}`,
      });
    }
    
    // Process with all models in parallel for better results
    toast({
      title: "Processing Document",
      description: `Analyzing your document with ${modelsToUse.length} AI models for better results...`,
    });
    
    // Create promises for all models
    const allPromises = modelsToUse.map(model => 
      performOCRWithModel(file, model, apiKey)
    );
    
    // Execute requests in parallel
    const allResults = await Promise.all(allPromises);
    
    // Filter out failed results
    const successfulResults = allResults.filter(result => result !== null) as OCRResult[];
    
    if (successfulResults.length === 0) {
      throw new Error("All models failed to process the document");
    }
    
    // Find the result with the most text
    const bestResult = successfulResults.reduce((best, current) => {
      return (current.text.length > best.text.length) ? current : best;
    }, successfulResults[0]);
    
    const successRatio = `${successfulResults.length}/${modelsToUse.length}`;
    const modelNames = successfulResults.map(r => r.modelUsed?.split('/').pop()).join(", ");
    
    toast({
      title: "OCR Complete",
      description: `Document processed successfully (${successRatio} models). Best result from: ${bestResult.modelUsed?.split('/').pop()}`,
    });
    
    return bestResult;
  } catch (error) {
    console.error("Error performing OCR:", error);
    toast({
      title: "OCR Failed",
      description: "Failed to process your document with all configured models. Please check your API key and try again.",
      variant: "destructive",
    });
    return null;
  }
}

// Helper function to extract patient name from filename
function extractPatientNameFromFilename(filename: string): string | null {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // Common patterns for patient names in filenames:
  // 1. Look for Mr/Mrs/Ms followed by name
  const titleMatch = nameWithoutExt.match(/(?:Mr|Mrs|Ms|Miss|Dr)[\s_\-\.]+([A-Za-z\s_\-]+)/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].replace(/[_\-\.]+/g, " ").trim();
  }
  
  // 2. Names with underscore or dash separators: Report_John_Doe.pdf or Report-John-Doe.pdf
  const underscorePattern = nameWithoutExt.replace(/^(Report|Lab|Test|Result|Health)[\s_\-]+/i, "");
  
  // Split by common separators
  const parts = underscorePattern.split(/[\s_\-\.]+/);
  
  // If we have at least 2 parts that could form a name
  if (parts.length >= 2) {
    // Check if any parts look like a name (not just numbers or single characters)
    const nameParts = parts.filter(part => part.length > 1 && !/^\d+$/.test(part));
    
    if (nameParts.length >= 2) {
      // Format nicely with spaces
      return nameParts.join(" ");
    }
  }
  
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`Starting file to base64 conversion for file: ${file.name} (${file.type}, ${file.size} bytes)`);
    const reader = new FileReader();
    
    reader.onload = () => {
      console.log("FileReader onload event triggered");
      if (typeof reader.result === 'string') {
        console.log(`Base64 conversion successful, string length: ${reader.result.length}`);
        resolve(reader.result);
      } else {
        console.error("FileReader result is not a string:", reader.result);
        reject(new Error('Failed to convert file to base64'));
      }
    };
    
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(error);
    };
    
    reader.onabort = () => {
      console.error("FileReader aborted");
      reject(new Error('File reading aborted'));
    };
    
    console.log("Calling readAsDataURL on FileReader");
    reader.readAsDataURL(file);
  });
}

// Utility function to clear all stored data
export function clearAllData(): void {
  console.log("Clearing all stored health data");
  localStorage.removeItem('scannedReports');
  localStorage.removeItem('patientName');
  // Don't show toast here as it might be confusing during the upload process
}
