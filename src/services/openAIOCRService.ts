
import { toast } from "@/hooks/use-toast";

export interface OCRResult {
  text: string;
  confidence?: number;
  modelUsed?: string;
}

async function performOCRWithModel(file: File, model: string, apiKey: string): Promise<OCRResult | null> {
  try {
    console.log(`Attempting OCR with model: ${model}`);
    
    // Convert the file to base64
    const base64File = await fileToBase64(file);
    
    // Prepare the prompt
    const prompt = `Please analyze this image and extract all the text content from it. This is a health report or medical lab result document that needs to be processed. Extract ALL text accurately, preserving numbers, units, reference ranges, and any important information.`;

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
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`OpenRouter API error with model ${model}:`, errorData);
      return null;
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error(`Invalid response format from model ${model}`);
      return null;
    }
    
    const ocrText = data.choices[0].message.content;
    console.log(`OCR completed successfully with model: ${model}`);
    
    return { 
      text: ocrText,
      modelUsed: model
    };
  } catch (error) {
    console.error(`Error performing OCR with model ${model}:`, error);
    return null;
  }
}

export async function performOCR(file: File): Promise<OCRResult | null> {
  try {
    const apiKey = localStorage.getItem("openrouter_api_key");
    const primaryModel = localStorage.getItem("openrouter_model") || "anthropic/claude-3-opus:beta";
    const useMultipleModels = localStorage.getItem("openrouter_use_multiple_models") === "true";
    const fallbackModelsStr = localStorage.getItem("openrouter_fallback_models") || "[]";
    const fallbackModels = JSON.parse(fallbackModelsStr);
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenRouter API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }

    console.log(`Performing OCR on file: ${file.name} using model: ${primaryModel}`);
    
    // Try primary model first
    let result = await performOCRWithModel(file, primaryModel, apiKey);
    
    // If primary model failed and fallback is enabled, try fallback models
    if (!result && useMultipleModels && fallbackModels.length > 0) {
      console.log("Primary model OCR failed, trying fallback models");
      
      toast({
        title: "Trying Alternative Models",
        description: "Primary model OCR failed. Trying fallback models...",
      });
      
      for (const fallbackModel of fallbackModels) {
        result = await performOCRWithModel(file, fallbackModel, apiKey);
        if (result) {
          console.log(`Successfully performed OCR with fallback model: ${fallbackModel}`);
          break;
        }
      }
    }
    
    if (result) {
      const modelName = result.modelUsed?.split('/').pop() || primaryModel.split('/').pop();
      toast({
        title: "OCR Completed",
        description: `Document processed using ${modelName}`,
      });
      return result;
    } else {
      throw new Error("All models failed to process the document");
    }
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}
