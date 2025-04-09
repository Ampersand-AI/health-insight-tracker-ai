
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

interface Model {
  id: string;
  name: string;
}

const modelSchema = z.object({
  selectedModel: z.string().min(1, { message: "Please select a model" }),
});

export const ModelSelector = () => {
  const { toast } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [isApiConnected, setIsApiConnected] = useState(false);

  const form = useForm<z.infer<typeof modelSchema>>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      selectedModel: localStorage.getItem("selected_model") || "",
    },
  });

  useEffect(() => {
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
    }
  }, []);

  const fetchModels = async (apiKey: string) => {
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
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  };

  const onSubmit = (data: z.infer<typeof modelSchema>) => {
    localStorage.setItem("selected_model", data.selectedModel);
    
    toast({
      title: "Model Preference Updated",
      description: `You've selected ${models.find(m => m.id === data.selectedModel)?.name || data.selectedModel} for analysis`,
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
        <CardDescription>
          Choose which AI model to use for analyzing your reports
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
                      {models.length > 0 ? (
                        models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Loading models...
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
