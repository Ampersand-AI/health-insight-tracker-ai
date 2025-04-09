
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ApiKeyTester } from "./ApiKeyTester";

const apiKeySchema = z.object({
  apiKey: z.string().min(10, { message: "API key must be at least 10 characters" }),
});

export const OcrSpaceApiForm = () => {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  const onSubmit = (data: z.infer<typeof apiKeySchema>) => {
    // Save API key to localStorage
    localStorage.setItem("ocrspace_api_key", data.apiKey);
    
    toast({
      title: "OCR Space API Key Saved",
      description: "Your OCR Space API key has been saved",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OCR Space API Key</CardTitle>
        <CardDescription>
          Set your OCR Space API key for text extraction from reports
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
                    <ApiKeyTester apiKey={field.value} apiType="ocrspace" />
                  </div>
                  <FormDescription>
                    Your OCR Space API key is stored securely in your browser
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
