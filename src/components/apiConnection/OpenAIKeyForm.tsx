
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Info, Check, Key, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const apiKeySchema = z.object({
  apiKey: z.string().min(1, { message: "Please enter your OpenRouter API key" }),
  model: z.string().default("anthropic/claude-3-opus:beta"),
});

export const OpenAIKeyForm = () => {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelLocked, setModelLocked] = useState(false);

  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
      model: "anthropic/claude-3-opus:beta",
    },
  });

  useEffect(() => {
    const savedKey = localStorage.getItem("openrouter_api_key");
    const savedModel = localStorage.getItem("openrouter_model") || "anthropic/claude-3-opus:beta";
    
    if (savedKey) {
      form.setValue("apiKey", savedKey);
      form.setValue("model", savedModel);
      setIsSaved(true);
      fetchAvailableModels(savedKey);
      
      // Check if model has been previously saved
      if (localStorage.getItem("openrouter_model_locked") === "true") {
        setModelLocked(true);
      }
    }
  }, [form]);

  const fetchAvailableModels = async (apiKey: string) => {
    if (!apiKey) return;
    
    setIsLoadingModels(true);
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Format the models data
        const models = data.data.map((model: any) => ({
          id: model.id,
          name: model.name || model.id
        }));
        
        setAvailableModels(models);
      } else {
        console.error("Failed to fetch models");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const onSubmit = (data: z.infer<typeof apiKeySchema>) => {
    localStorage.setItem("openrouter_api_key", data.apiKey);
    localStorage.setItem("openrouter_model", data.model);
    localStorage.setItem("openrouter_model_locked", "true");
    setIsSaved(true);
    setModelLocked(true);
    
    // Display confirmation toast for the selected model
    const selectedModelName = availableModels.find(m => m.id === data.model)?.name || data.model;
    
    toast({
      title: "Settings Saved",
      description: `Model "${selectedModelName}" has been set as your default model`,
    });
    
    // Fetch available models when API key is saved if not already loaded
    if (availableModels.length === 0) {
      fetchAvailableModels(data.apiKey);
    }
  };

  const testConnection = async () => {
    const apiKey = form.getValues("apiKey");
    const model = form.getValues("model");
    
    if (!apiKey) {
      toast({
        title: "No API Key",
        description: "Please enter an API key first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      // Test the connection by making a simple completion request
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "user", content: "Hello! This is a test message." }
          ],
          max_tokens: 1
        })
      });

      setIsTesting(false);

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Your OpenRouter API key is valid and working",
          variant: "default",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Connection Failed",
          description: error.error?.message || "Your OpenRouter API key appears to be invalid",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsTesting(false);
      console.error("API test error:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to OpenRouter. Please check your internet connection and try again.",
        variant: "destructive",
      });
    }
  };
  
  const resetApiKey = () => {
    setIsResetting(true);
    
    setTimeout(() => {
      localStorage.removeItem("openrouter_api_key");
      localStorage.removeItem("openrouter_model");
      localStorage.removeItem("openrouter_model_locked");
      
      form.reset({
        apiKey: "",
        model: "anthropic/claude-3-opus:beta"
      });
      
      setIsSaved(false);
      setModelLocked(false);
      setAvailableModels([]);
      
      toast({
        title: "API Key Reset",
        description: "Your OpenRouter API key and model settings have been reset",
      });
      
      setIsResetting(false);
    }, 500);
  };

  return (
    <Card className="border-neutral-800">
      <CardHeader className="bg-neutral-900">
        <CardTitle className="flex items-center gap-2 text-white">
          <Key className="h-5 w-5" />
          OpenRouter API Key
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Connect your OpenRouter API key to enable health report scanning and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 bg-neutral-950">
        {isSaved && (
          <div className="flex items-start p-4 mb-4 border border-neutral-800 bg-neutral-900 rounded-md">
            <Check className="h-5 w-5 text-neutral-300 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-neutral-300 font-medium">API Key Connected</p>
              <p className="text-xs text-neutral-400">
                Your OpenRouter API key is saved and ready to use
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-300">OpenRouter API Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="sk-or-..."
                      type="password"
                      autoComplete="off"
                      className="border-neutral-800 bg-neutral-900 focus:border-neutral-700 focus:ring-neutral-700 text-white"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // If API key changes and is not empty, fetch models
                        if (e.target.value && e.target.value.length > 10) {
                          fetchAvailableModels(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-neutral-500">
                    Your API key is stored locally in your browser and never sent to our servers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-300">Model</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={modelLocked}
                  >
                    <FormControl>
                      <SelectTrigger className="border-neutral-800 bg-neutral-900 focus:border-neutral-700 focus:ring-neutral-700 text-white">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      {isLoadingModels ? (
                        <div className="p-2 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-neutral-400" />
                          <p className="text-xs mt-1 text-neutral-400">Loading models...</p>
                        </div>
                      ) : availableModels.length > 0 ? (
                        availableModels.map(model => (
                          <SelectItem key={model.id} value={model.id} className="text-white">
                            {model.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="anthropic/claude-3-opus:beta" className="text-white">Claude 3 Opus</SelectItem>
                          <SelectItem value="anthropic/claude-3-sonnet:beta" className="text-white">Claude 3 Sonnet</SelectItem>
                          <SelectItem value="anthropic/claude-3-haiku:beta" className="text-white">Claude 3 Haiku</SelectItem>
                          <SelectItem value="openai/gpt-4o" className="text-white">GPT-4o</SelectItem>
                          <SelectItem value="openai/gpt-4o-mini" className="text-white">GPT-4o Mini</SelectItem>
                          <SelectItem value="google/gemini-1.5-pro" className="text-white">Gemini 1.5 Pro</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-neutral-500">
                    {modelLocked 
                      ? "Your default model is locked. Reset API key to change." 
                      : "Choose a model for processing your health reports"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start p-4 border border-neutral-800 bg-neutral-900 rounded-md">
              <Info className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
              <div className="text-sm text-neutral-400">
                <p>To get an OpenRouter API key:</p>
                <ol className="list-decimal list-inside mt-1 text-xs space-y-1 ml-1">
                  <li>Go to <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline text-neutral-300">openrouter.ai/keys</a></li>
                  <li>Create an account or log in</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it here</li>
                </ol>
                <p className="mt-2 text-xs">This app uses OpenRouter for OCR and analysis. You will be charged based on OpenRouter's pricing.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="submit" 
                className="bg-neutral-800 hover:bg-neutral-700 text-white"
                disabled={isResetting}
              >
                Save API Key
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={testConnection}
                disabled={isTesting || isResetting}
                className="border-neutral-800 hover:bg-neutral-900 text-neutral-300"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>Test Connection</>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetApiKey}
                disabled={isResetting || isTesting}
                className="border-neutral-800 hover:bg-neutral-900 text-neutral-300"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset API Key
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
