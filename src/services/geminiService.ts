
import { toast } from "@/hooks/use-toast";

// Type definitions for Gemini OCR API responses
export interface GeminiOCRResult {
  text: string;
  confidence: number;
}

export async function performOCR(file: File): Promise<GeminiOCRResult | null> {
  try {
    // Convert the file to base64 for API consumption
    const base64File = await fileToBase64(file);
    
    // For now, we'll simulate OCR processing with a timeout
    // In production, this would be replaced with an actual Gemini API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // This simulates OCR processing
        const result: GeminiOCRResult = {
          text: `Blood Test Results\nPatient: John Doe\nDate: ${new Date().toLocaleDateString()}\nCholesterol: ${Math.floor(Math.random() * (220 - 150) + 150)} mg/dL\nGlucose: ${Math.floor(Math.random() * (110 - 80) + 80)} mg/dL\nHemoglobin: ${parseFloat((Math.random() * (16 - 12) + 12).toFixed(1))} g/dL`,
          confidence: 0.92
        };
        
        console.log("OCR result:", result);
        resolve(result);
      }, 2000);
    });
  } catch (error) {
    console.error("Error performing OCR:", error);
    toast({
      title: "OCR Failed",
      description: "Failed to extract text from your document. Please try again.",
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
