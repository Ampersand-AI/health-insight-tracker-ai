
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { OcrSpaceApiForm } from "@/components/apiConnection/OcrSpaceApiForm";
import { ApiKeyTester } from "@/components/apiConnection/ApiKeyTester";
import { ModelSelector } from "@/components/apiConnection/ModelSelector";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const notificationsSchema = z.object({
  emailNotifications: z.boolean().default(true),
});

const openRouterApiSchema = z.object({
  apiKey: z.string().min(10, { message: "API key must be at least 10 characters" }),
});

const Profile = () => {
  const { toast } = useToast();

  const openRouterApiForm = useForm<z.infer<typeof openRouterApiSchema>>({
    resolver: zodResolver(openRouterApiSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "John Doe",
      email: "john.doe@example.com",
    },
  });

  const notificationsForm = useForm<z.infer<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
    },
  });

  // Load saved API key if available
  useEffect(() => {
    const savedApiKey = localStorage.getItem("openrouter_api_key");
    if (savedApiKey) {
      openRouterApiForm.setValue("apiKey", savedApiKey);
    }
  }, [openRouterApiForm]);

  const onSubmitOpenRouterApi = (data: z.infer<typeof openRouterApiSchema>) => {
    // Save API key to localStorage
    localStorage.setItem("openrouter_api_key", data.apiKey);
    
    toast({
      title: "OpenRouter API Key Updated",
      description: "Your OpenRouter API key has been saved",
    });
  };

  const onSubmitProfile = (data: z.infer<typeof profileSchema>) => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved",
    });
  };

  const onSubmitNotifications = (data: z.infer<typeof notificationsSchema>) => {
    toast({
      title: "Notification Preferences Updated",
      description: "Your notification settings have been saved",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center mb-8 gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder.svg" alt="Profile" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="api">API Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Your full name that will appear on your profile
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormDescription>
                            Your email address for notifications and account recovery
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Save Changes</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api">
            <div className="grid grid-cols-1 gap-6">
              <OcrSpaceApiForm />
              
              <Card>
                <CardHeader>
                  <CardTitle>OpenRouter API Key</CardTitle>
                  <CardDescription>
                    Set your OpenRouter API key for AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...openRouterApiForm}>
                    <form onSubmit={openRouterApiForm.handleSubmit(onSubmitOpenRouterApi)} className="space-y-6">
                      <FormField
                        control={openRouterApiForm.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key</FormLabel>
                            <div className="flex">
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <ApiKeyTester apiKey={field.value} apiType="openrouter" />
                            </div>
                            <FormDescription>
                              Your API key is stored securely in your browser. Get it from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary underline">openrouter.ai</a>
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
              
              <ModelSelector />
            </div>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationsForm}>
                  <form onSubmit={notificationsForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="emailNotifications" 
                          className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                          checked={notificationsForm.watch("emailNotifications")}
                          onChange={(e) => notificationsForm.setValue("emailNotifications", e.target.checked)}
                        />
                        <label htmlFor="emailNotifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Email Notifications
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for new report analyses and health alerts
                      </p>
                    </div>
                    <Button type="submit">Save Notification Preferences</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
