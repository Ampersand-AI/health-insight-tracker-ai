
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ApiKeyTester } from "./ApiKeyTester";
import { useEffect } from "react";

const apiKeySchema = z.object({
  apiKey: z.string().min(10, { message: "API key must be at least 10 characters" }),
});

export const NanonetsApiForm = () => {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  // Load saved API key if available
  useEffect(() => {
    const savedApiKey = localStorage.getItem("nanonets_api_key");
    if (savedApiKey) {
      form.setValue("apiKey", savedApiKey);
    }
  }, [form]);

  const onSubmit = (data: z.infer<typeof apiKeySchema>) => {
    // Save API key to localStorage
    localStorage.setItem("nanonets_api_key", data.apiKey);
    
    toast({
      title: "Nanonets API Key Saved",
      description: "Your Nanonets API key has been saved",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nanonets API Key</CardTitle>
        <CardDescription>
          Set your Nanonets API key for OCR text extraction from reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <ApiKeyTester apiKey={field.value} apiType="nanonets" />
                  </div>
                  <FormDescription>
                    Your Nanonets API key is stored securely in your browser. Get a key at <a href="https://nanonets.com" target="_blank" rel="noreferrer" className="text-primary underline">nanonets.com</a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save API Key</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
