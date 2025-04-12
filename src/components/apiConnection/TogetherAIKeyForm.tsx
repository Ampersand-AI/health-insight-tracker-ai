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
import { testConnection } from "@/services/togetherAIClient";

const apiKeySchema = z.object({
  apiKey: z.string().min(1, { message: "Please enter your Together.ai API key" }),
});

export const TogetherAIKeyForm = () => {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  useEffect(() => {
    const savedKey = localStorage.getItem("together_api_key");
    
    if (savedKey) {
      form.setValue("apiKey", savedKey);
      setIsSaved(true);
    }
  }, [form]);

  const onSubmit = (data: z.infer<typeof apiKeySchema>) => {
    localStorage.setItem("together_api_key", data.apiKey);
    setIsSaved(true);
    
    // Display confirmation toast
    toast({
      title: "API Key Saved",
      description: "Your Together.ai API key has been saved successfully",
    });
  };

  const testAPIConnection = async () => {
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
    localStorage.setItem("together_api_key", apiKey);

    try {
      // Use our new client to test the connection
      const isSuccessful = await testConnection();

      setIsTesting(false);

      if (isSuccessful) {
        toast({
          title: "Connection Successful",
          description: "Your Together.ai API key is valid and working",
          variant: "default",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Your Together.ai API key appears to be invalid",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsTesting(false);
      console.error("API test error:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Together.ai. Please check your internet connection and try again.",
        variant: "destructive",
      });
    }
  };
  
  const resetApiKey = () => {
    setIsResetting(true);
    
    setTimeout(() => {
      localStorage.removeItem("together_api_key");
      
      form.reset({
        apiKey: "",
      });
      
      setIsSaved(false);
      
      toast({
        title: "API Key Reset",
        description: "Your Together.ai API key has been reset",
      });
      
      setIsResetting(false);
    }, 500);
  };

  return (
    <Card className="border-neutral-800">
      <CardHeader className="bg-neutral-900">
        <CardTitle className="flex items-center gap-2 text-white">
          <Key className="h-5 w-5" />
          Together.ai API Key
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Connect your Together.ai API key to enable health report scanning and analysis with Llama 4 Maverik
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 bg-neutral-950">
        {isSaved && (
          <div className="flex items-start p-4 mb-4 border border-neutral-800 bg-neutral-900 rounded-md">
            <Check className="h-5 w-5 text-neutral-300 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-neutral-300 font-medium">API Key Connected</p>
              <p className="text-xs text-neutral-400">
                Your Together.ai API key is saved and ready to use
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
                  <FormLabel className="text-neutral-300">Together.ai API Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="togt-..."
                      type="password"
                      autoComplete="off"
                      className="border-neutral-800 bg-neutral-900 focus:border-neutral-700 focus:ring-neutral-700 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-neutral-500">
                    Your API key is stored locally in your browser and never sent to our servers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start p-4 border border-neutral-800 bg-neutral-900 rounded-md">
              <Info className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
              <div className="text-sm text-neutral-400">
                <p>To get a Together.ai API key:</p>
                <ol className="list-decimal list-inside mt-1 text-xs space-y-1 ml-1">
                  <li>Go to <a href="https://api.together.xyz/settings/api-keys" target="_blank" rel="noreferrer" className="underline text-neutral-300">api.together.xyz/settings/api-keys</a></li>
                  <li>Create an account or log in</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it here</li>
                </ol>
                <p className="mt-2 text-xs">This app uses Together.ai's Llama 4 Maverik API for OCR and analysis. You will be charged based on Together.ai's pricing.</p>
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
                onClick={testAPIConnection}
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
