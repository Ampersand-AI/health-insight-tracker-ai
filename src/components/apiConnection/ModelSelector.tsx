
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Info, RefreshCw } from "lucide-react";

interface Model {
  id: string;
  name: string;
  description?: string;
}

const modelSchema = z.object({
  selectedModel: z.string().min(1, { message: "Please select a model" }),
});

export const ModelSelector = () => {
  const { toast } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof modelSchema>>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      selectedModel: localStorage.getItem("selected_model") || "",
    },
  });

  const loadModels = () => {
    const apiKey = localStorage.getItem("openrouter_api_key");
    if (apiKey) {
      setIsApiConnected(true);
      
      // Try to load models from localStorage first
      const savedModels = localStorage.getItem("openrouter_models");
      if (savedModels) {
        try {
          const parsedModels = JSON.parse(savedModels);
          setModels(parsedModels);
        } catch (error) {
          console.error("Failed to parse saved models:", error);
          fetchModels(apiKey);
        }
      } else {
        fetchModels(apiKey);
      }
    } else {
      setIsApiConnected(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const fetchModels = async (apiKey: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModels(data.data);
        localStorage.setItem("openrouter_models", JSON.stringify(data.data));
        toast({
          title: "Models Loaded",
          description: `Successfully loaded ${data.data.length} AI models from OpenRouter.`,
        });
      } else {
        throw new Error("Failed to fetch models");
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      toast({
        title: "Error Loading Models",
        description: "Failed to load models from OpenRouter. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshModels = () => {
    const apiKey = localStorage.getItem("openrouter_api_key");
    if (apiKey) {
      fetchModels(apiKey);
    }
  };

  const onSubmit = (data: z.infer<typeof modelSchema>) => {
    localStorage.setItem("selected_model", data.selectedModel);
    
    const selectedModel = models.find(m => m.id === data.selectedModel);
    toast({
      title: "Model Preference Updated",
      description: `You've selected ${selectedModel?.name || data.selectedModel} for analysis`,
    });
  };

  if (!isApiConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Model Selection</CardTitle>
          <CardDescription>
            Choose which AI model to use for analyzing your reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start p-4 border border-amber-200 bg-amber-50 rounded-md">
            <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <p className="text-sm text-amber-800">
              Please connect your OpenRouter API key first to load available models.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model Selection</CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span>Choose which AI model to use for analyzing your reports</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshModels} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Models
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="selectedModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an AI model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading models...
                        </SelectItem>
                      ) : models.length > 0 ? (
                        models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>
                          No models available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Different models provide varying levels of analysis accuracy
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save Model Preference</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
