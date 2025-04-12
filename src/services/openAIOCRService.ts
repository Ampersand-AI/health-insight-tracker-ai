
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
    
    // Filter models that support vision tasks more accurately
    const supportedModels = data.data
      .filter((model: any) => {
        try {
          // Check for vision capabilities more thoroughly
          const hasVisionCapability = 
            // Check if model explicitly lists image capabilities
            (model.capabilities && 
             Array.isArray(model.capabilities) && 
             model.capabilities.includes('vision')) ||
            // Check architecture.modality as backup
            (model.architecture && 
             model.architecture.modality && 
             (model.architecture.modality.includes('image') || 
             (model.architecture.input_modalities && 
              Array.isArray(model.architecture.input_modalities) && 
              model.architecture.input_modalities.includes('image'))));
          
          // Check context length - need at least 4000 for document analysis
          const hasEnoughContext = model.context_length && model.context_length >= 4000;
          
          return hasVisionCapability && hasEnoughContext;
        } catch (err) {
          console.error("Error filtering model:", model.id, err);
          return false;
        }
      })
      .map((model: any) => model.id);
    
    console.log("Available OCR-capable models:", supportedModels);
    
    // Limit to top 5 models
    const topModels = supportedModels.slice(0, 5);
    
    // If no models found or error in filtering, return default set
    if (topModels.length === 0) {
      console.log("No OCR-capable models found, using default models");
      return getDefaultModels();
    }
    
    return topModels;
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

async function performOCRWithModel(file: File, model: string, apiKey: string, customToast?: Function): Promise<OCRResult | null> {
  try {
    console.log(`Attempting OCR with model: ${model} for file: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    // Convert the file to base64
    let base64File;
    try {
      base64File = await fileToBase64(file);
      console.log(`Successfully converted file to base64, length: ${base64File.length}`);
    } catch (error) {
      console.error("Error converting file to base64:", error);
      throw new Error("Failed to convert file to base64");
    }
    
    // Improved prompt for more accurate text extraction
    const prompt = `This is a medical lab report or health document that needs complete text extraction. Please extract ALL text content exactly as it appears, including:

1. ALL parameter names, values, units, and reference ranges - extract EVERY parameter mentioned
2. ALL patient information (name, age, gender, date of birth, patient ID)
3. ALL dates, doctor names, and facility information
4. ALL section headers, titles, and labels
5. ALL footnotes and additional information
6. Do NOT summarize or interpret - extract the COMPLETE text exactly as it appears

Your extraction needs to be extremely thorough and complete, capturing EVERY detail from the document.`;

    console.log(`Sending request to OpenRouter API for model: ${model}`);
    console.log(`File type: ${file.type}, File size: ${file.size} bytes`);
    
    // Make the API call to OpenRouter
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
    
    // Try to extract patient information from the OCR text
    extractPatientInfoFromText(ocrText);
    
    // Notify success for this specific model
    const toastFn = customToast || toast;
    toastFn({
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
    const toastFn = customToast || toast;
    toastFn({
      title: `OCR Failed: ${model.split('/').pop()}`,
      description: "Could not process document with this model",
      variant: "destructive",
    });
    
    return null;
  }
}

// Helper function to extract patient info from OCR text and store it
function extractPatientInfoFromText(text: string): void {
  try {
    // Look for patient name in OCR text using various patterns
    const namePatterns = [
      /Patient\s*Name\s*[:=\-]\s*([\w\s\.]+?)(?:\r|\n|,|;|\d)/i,
      /Name\s*[:=\-]\s*([\w\s\.]+?)(?:\r|\n|,|;|\d)/i,
      /Patient\s*[:=\-]\s*([\w\s\.]+?)(?:\r|\n|,|;|\d)/i
    ];
    
    // Look for age in OCR text
    const agePatterns = [
      /\b(?:Age|DOB)\s*[:=\-]\s*(\d+)(?:\s*(?:years|yrs))?\b/i,
      /\b(?:Age|DOB)\s*[:=\-]\s*(\d{1,3})\b/i,
      /\b(\d{1,2})\s*(?:years|yrs)(?:\s*old)?\b/i
    ];
    
    // Look for gender in OCR text
    const genderPatterns = [
      /\b(?:Gender|Sex)\s*[:=\-]\s*(Male|Female|M|F)\b/i,
      /\b(Male|Female|M|F)\b/i
    ];
    
    // Extract name
    let patientName = null;
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        patientName = match[1].trim();
        // Clean up potential title prefixes
        patientName = patientName.replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/i, '');
        break;
      }
    }
    
    // Extract age
    let patientAge = null;
    for (const pattern of agePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        patientAge = match[1].trim();
        break;
      }
    }
    
    // Extract gender
    let patientGender = null;
    for (const pattern of genderPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const genderValue = match[1].trim().toUpperCase();
        patientGender = genderValue === 'M' ? 'Male' : (genderValue === 'F' ? 'Female' : genderValue);
        break;
      }
    }
    
    console.log("Extracted patient info from OCR text:", { name: patientName, age: patientAge, gender: patientGender });
    
    // Store the extracted information for later use
    if (patientName) localStorage.setItem('patientName', patientName);
    if (patientAge) localStorage.setItem('patientAge', patientAge);
    if (patientGender) localStorage.setItem('patientGender', patientGender);
  } catch (error) {
    console.error("Error extracting patient info from OCR text:", error);
  }
}

export async function performOCR(file: File, customToast?: Function): Promise<OCRResult | null> {
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

    const toastFn = customToast || toast;
    toastFn({
      title: "Selecting Models",
      description: "Automatically selecting best models for document analysis...",
    });

    // Extract patient name from filename first
    const patientName = extractPatientNameFromFilename(file.name);
    if (patientName) {
      localStorage.setItem('patientName', patientName);
      toastFn({
        title: "Patient Identified",
        description: `Detected patient name: ${patientName}`,
      });
    }

    // Get available models from OpenRouter that support vision tasks
    const modelsToUse = await getAvailableModels(apiKey);
    
    if (modelsToUse.length === 0) {
      toast({
        title: "No Available Models",
        description: "Could not find any OpenRouter models that support document analysis. Please try again later.",
        variant: "destructive",
      });
      return null;
    }

    console.log("Selected models for OCR:", modelsToUse);
    
    toastFn({
      title: "Models Selected",
      description: `Using ${modelsToUse.length} models for comprehensive document analysis`,
    });
    
    // Process with selected models in parallel
    toastFn({
      title: "Processing Document",
      description: `Analyzing your document with ${modelsToUse.length} AI models for better results...`,
    });
    
    // Create promises for all models
    const allPromises = modelsToUse.map(model => 
      performOCRWithModel(file, model, apiKey, customToast)
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
    
    toastFn({
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
  localStorage.removeItem('patientAge');
  localStorage.removeItem('patientGender');
}
