
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenAIKeyForm } from "@/components/apiConnection/OpenAIKeyForm";

const Profile = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-white">Settings</h1>
        
        <Tabs defaultValue="api" className="space-y-4">
          <TabsList className="bg-neutral-900 border-neutral-800">
            <TabsTrigger value="api" className="data-[state=active]:bg-neutral-800 text-neutral-300 data-[state=active]:text-white">API Connection</TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-neutral-800 text-neutral-300 data-[state=active]:text-white">Account</TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-neutral-800 text-neutral-300 data-[state=active]:text-white">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="space-y-4">
            <OpenAIKeyForm />
          </TabsContent>
          
          <TabsContent value="account">
            <Card className="border-neutral-800">
              <CardHeader className="bg-neutral-900">
                <CardTitle className="text-white">Account Settings</CardTitle>
                <CardDescription className="text-neutral-400">Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="bg-neutral-950">
                <p className="text-neutral-500">Account management features coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card className="border-neutral-800">
              <CardHeader className="bg-neutral-900">
                <CardTitle className="text-white">User Preferences</CardTitle>
                <CardDescription className="text-neutral-400">Customize your application experience</CardDescription>
              </CardHeader>
              <CardContent className="bg-neutral-950">
                <p className="text-neutral-500">Preference options coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
