
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

interface ApiKeyTesterProps {
  apiKey: string;
  apiType: "ocrspace" | "openrouter";
}

export const ApiKeyTester = ({ apiKey, apiType }: ApiKeyTesterProps) => {
  const [testing, setTesting] = useState(false);

  const testApi = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key before testing the connection.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);

    try {
      if (apiType === "ocrspace") {
        // Test OCR Space API
        const formData = new FormData();
        formData.append("apikey", apiKey);
        formData.append("language", "eng");
        formData.append("isOverlayRequired", "false");

        const response = await fetch(
          "https://api.ocr.space/parse/image",
          {
            method: "POST",
            headers: {
              apikey: apiKey,
            },
            body: formData,
          }
        );

        const data = await response.json();
        
        if (data.OCRExitCode === 1 || data.IsErroredOnProcessing === false) {
          toast({
            title: "OCR Space Connection Successful",
            description: "Your OCR Space API key is valid and working correctly.",
          });
        } else {
          throw new Error(data.ErrorMessage || "Invalid API key or connection failed");
        }
      } else {
        // Test OpenRouter API
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.ok) {
          toast({
            title: "OpenRouter Connection Successful",
            description: "Your OpenRouter API key is valid and working correctly.",
          });
        } else {
          throw new Error("Invalid API key or connection failed");
        }
      }
    } catch (error) {
      console.error(`${apiType} API test error:`, error);
      toast({
        title: `${apiType === "ocrspace" ? "OCR Space" : "OpenRouter"} Connection Failed`,
        description: error instanceof Error ? error.message : "Failed to connect. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Button 
      onClick={testApi} 
      disabled={testing || !apiKey}
      variant="outline"
      size="sm"
      className="ml-2"
    >
      {testing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
      Test Connection
    </Button>
  );
};
