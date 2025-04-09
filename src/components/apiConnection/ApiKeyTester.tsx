
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

interface ApiKeyTesterProps {
  apiKey: string;
  apiType: "nanonets" | "openrouter";
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
      if (apiType === "nanonets") {
        // Test Nanonets API with a models request
        // According to Nanonets docs, X-API-Key header should be used instead of Basic Auth
        const response = await fetch("https://app.nanonets.com/api/v2/OCR/Model/", {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          toast({
            title: "Nanonets Connection Successful",
            description: "Your Nanonets API key is valid and working correctly.",
          });
        } else {
          throw new Error("Invalid API key or connection failed");
        }
      } else {
        // Test OpenRouter API and fetch models
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Store models in localStorage for later use
          localStorage.setItem("openrouter_models", JSON.stringify(data.data));
          
          toast({
            title: "OpenRouter Connection Successful",
            description: "Your OpenRouter API key is valid and working correctly. AI models have been loaded.",
          });
        } else {
          throw new Error("Invalid API key or connection failed");
        }
      }
    } catch (error) {
      console.error(`${apiType} API test error:`, error);
      toast({
        title: `${apiType === "nanonets" ? "Nanonets" : "OpenRouter"} Connection Failed`,
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
