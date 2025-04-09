
import { toast } from "@/hooks/use-toast";

export interface OCRResult {
  text: string;
  confidence?: number;
}

export async function performOCR(file: File): Promise<OCRResult | null> {
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

    console.log(`Performing OCR on file: ${file.name} using model: ${model}`);
    
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
      console.error("OpenRouter API error:", errorData);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const ocrText = data.choices[0].message.content;
    
    console.log("OCR completed successfully");
    toast({
      title: "OCR Completed",
      description: `Document processed using ${model.split('/').pop()}`,
    });
    
    return { text: ocrText };
  } catch (error) {
    console.error("Error performing OCR:", error);
    toast({
      title: "OCR Failed",
      description: "Failed to process your document. Please check your API key and try again.",
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
