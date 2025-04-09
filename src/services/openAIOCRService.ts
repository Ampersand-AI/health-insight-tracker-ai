
import { toast } from "@/hooks/use-toast";

// Type definitions for OpenAI OCR API responses
export interface OpenAIOCRResult {
  text: string;
}

export async function performOCR(file: File): Promise<OpenAIOCRResult | null> {
  try {
    // Convert the file to base64 for API consumption
    const base64File = await fileToBase64(file);
    const apiKey = localStorage.getItem("openai_api_key");
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }
    
    console.log("Starting OCR with file type:", file.type);
    
    // Make the API call to OpenAI for vision/OCR
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: "You are an OCR assistant. Extract all text from the provided image, maintaining the original structure as much as possible."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this medical report image, preserving formatting and focusing on medical values."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64File}`
                }
              }
            ]
          }
        ],
        temperature: 0
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log("OCR result obtained");
    
    return { 
      text: data.choices[0].message.content 
    };
  } catch (error) {
    console.error("Error performing OCR:", error);
    toast({
      title: "OCR Failed",
      description: "Failed to extract text from your document. Please check your API key and try again.",
      variant: "destructive",
    });
    return null;
  }
}

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}
