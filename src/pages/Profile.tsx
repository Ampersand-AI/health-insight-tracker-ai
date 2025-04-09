
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
import { useState } from "react";

const apiKeySchema = z.object({
  apiKey: z.string().min(10, { message: "API key must be at least 10 characters" }),
});

const modelSchema = z.object({
  selectedModel: z.string().min(1, { message: "Please select a model" }),
});

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const notificationsSchema = z.object({
  emailNotifications: z.boolean().default(true),
});

const Profile = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState("gpt-4o");

  const apiKeyForm = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  const modelForm = useForm<z.infer<typeof modelSchema>>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      selectedModel: "gpt-4o",
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

  const onSubmitApiKey = (data: z.infer<typeof apiKeySchema>) => {
    toast({
      title: "API Key Updated",
      description: "Your OpenRouter API key has been saved",
    });
  };

  const onSubmitModel = (data: z.infer<typeof modelSchema>) => {
    setSelectedModel(data.selectedModel);
    toast({
      title: "Model Preference Updated",
      description: `You've selected ${data.selectedModel} for analysis`,
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
              <Card>
                <CardHeader>
                  <CardTitle>OpenRouter API Key</CardTitle>
                  <CardDescription>
                    Set your OpenRouter API key for AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...apiKeyForm}>
                    <form onSubmit={apiKeyForm.handleSubmit(onSubmitApiKey)} className="space-y-6">
                      <FormField
                        control={apiKeyForm.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormDescription>
                              Your API key is stored securely
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
              
              <Card>
                <CardHeader>
                  <CardTitle>AI Model Selection</CardTitle>
                  <CardDescription>
                    Choose which AI model to use for analyzing your reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...modelForm}>
                    <form onSubmit={modelForm.handleSubmit(onSubmitModel)} className="space-y-6">
                      <FormField
                        control={modelForm.control}
                        name="selectedModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Model</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4o-mini">GPT-4o-mini</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="claude-3-opus">Claude 3 Opus</option>
                              </select>
                            </FormControl>
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
