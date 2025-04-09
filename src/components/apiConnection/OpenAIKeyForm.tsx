
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Info, Check, Key } from "lucide-react";
import { useState, useEffect } from "react";

const apiKeySchema = z.object({
  apiKey: z.string().min(1, { message: "Please enter your OpenAI API key" }),
});

export const OpenAIKeyForm = () => {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  useEffect(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      form.setValue("apiKey", savedKey);
      setIsSaved(true);
    }
  }, [form]);

  const onSubmit = (data: z.infer<typeof apiKeySchema>) => {
    localStorage.setItem("openai_api_key", data.apiKey);
    setIsSaved(true);
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          Connect your OpenAI API key to enable health report scanning and analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSaved && (
          <div className="flex items-start p-4 mb-4 border border-green-200 bg-green-50 rounded-md">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 font-medium">API Key Connected</p>
              <p className="text-xs text-green-700">
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
            <div className="flex items-start p-4 border border-blue-200 bg-blue-50 rounded-md">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p>To get an OpenAI API key:</p>
                <ol className="list-decimal list-inside mt-1 text-xs space-y-1 ml-1">
                  <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                  <li>Create an account or log in</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it here</li>
                </ol>
                <p className="mt-2 text-xs">This app uses the GPT-4o model for OCR and analysis. You will be charged based on OpenAI's pricing.</p>
              </div>
            </div>
            <Button type="submit">Save API Key</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
