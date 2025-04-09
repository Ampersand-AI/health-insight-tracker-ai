
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Info, Check, Key, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const apiKeySchema = z.object({
  apiKey: z.string().min(1, { message: "Please enter your OpenAI API key" }),
  model: z.string().default("gpt-4o"),
});

export const OpenAIKeyForm = () => {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
      model: "gpt-4o",
    },
  });

  useEffect(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    const savedModel = localStorage.getItem("openai_model") || "gpt-4o";
    
    if (savedKey) {
      form.setValue("apiKey", savedKey);
      form.setValue("model", savedModel);
      setIsSaved(true);
    }
  }, [form]);

  const onSubmit = (data: z.infer<typeof apiKeySchema>) => {
    localStorage.setItem("openai_api_key", data.apiKey);
    localStorage.setItem("openai_model", data.model);
    setIsSaved(true);
    toast({
      title: "API Key Saved",
      description: `Your OpenAI API key and model (${data.model}) have been saved`,
    });
  };

  const testConnection = async () => {
    const apiKey = form.getValues("apiKey");
    
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
      // Simple request to test the API key validity
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      });

      setIsTesting(false);

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Your OpenAI API key is valid and working",
          variant: "default",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Connection Failed",
          description: error.error?.message || "Your OpenAI API key appears to be invalid",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsTesting(false);
      console.error("API test error:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to OpenAI. Please check your internet connection and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="bg-gray-50">
        <CardTitle className="flex items-center gap-2 text-black">
          <Key className="h-5 w-5" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          Connect your OpenAI API key to enable health report scanning and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isSaved && (
          <div className="flex items-start p-4 mb-4 border border-gray-200 bg-gray-50 rounded-md">
            <Check className="h-5 w-5 text-gray-700 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-gray-800 font-medium">API Key Connected</p>
              <p className="text-xs text-gray-700">
                Your OpenAI API key is saved and ready to use
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
                  <FormLabel>OpenAI API Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="sk-..."
                      type="password"
                      autoComplete="off"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
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
                  <FormLabel>OpenAI Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster, less expensive)</SelectItem>
                      <SelectItem value="gpt-4.5-preview">GPT-4.5 Preview (Most powerful)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    GPT-4o is recommended for best results in health report analysis
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start p-4 border border-gray-200 bg-gray-50 rounded-md">
              <Info className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
              <div className="text-sm text-gray-800">
                <p>To get an OpenAI API key:</p>
                <ol className="list-decimal list-inside mt-1 text-xs space-y-1 ml-1">
                  <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                  <li>Create an account or log in</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it here</li>
                </ol>
                <p className="mt-2 text-xs">This app uses OpenAI for OCR and analysis. You will be charged based on OpenAI's pricing.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" className="bg-black hover:bg-gray-800 text-white">Save API Key</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={testConnection}
                disabled={isTesting}
                className="border-gray-300 hover:bg-gray-100"
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
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
