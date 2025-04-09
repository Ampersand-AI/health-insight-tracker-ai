import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadReportDialog } from "@/components/upload/UploadReportDialog";
import { HealthMetricCard } from "@/components/dashboard/HealthMetricCard";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Activity, Calendar, FileText, Upload, TrendingUp, BarChart3 } from "lucide-react";
import { HealthMetric } from "@/services/openAIService";
import { useNavigate } from "react-router-dom";

interface Report {
  id: string;
  metrics: HealthMetric[];
}

const Dashboard = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [recentMetrics, setRecentMetrics] = useState<HealthMetric[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if API key is available
    const apiKey = localStorage.getItem("openrouter_api_key");
    setHasApiKey(!!apiKey);
    
    if (!apiKey) {
      // Show a toast prompting the user to add their API key
      toast({
        title: "API Key Required",
        description: "Please add your OpenRouter API key in the settings to use the health analysis features.",
        variant: "destructive",
      });
    }

    // Get the most recent report metrics from localStorage
    const storedReports = localStorage.getItem('scannedReports');
    if (storedReports) {
      try {
        const parsedReports = JSON.parse(storedReports) as Report[];
        if (parsedReports.length > 0 && parsedReports[0].metrics) {
          setRecentMetrics(parsedReports[0].metrics);
        }
      } catch (error) {
        console.error("Error parsing reports:", error);
      }
    }
  }, [toast]);

  const handleUpload = () => {
    if (!hasApiKey) {
      // If no API key is set, redirect to profile page instead
      toast({
        title: "API Key Required",
        description: "Please add your OpenRouter API key in settings before uploading reports.",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }
    
    setIsUploadDialogOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground">Welcome, User</h1>
          <div className="w-24 h-1 bg-primary/40 mx-auto mt-4 mb-6"></div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Health Dashboard</h2>
            <p className="text-muted-foreground mt-1 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
          <Button 
            size="lg" 
            className="mt-4 md:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleUpload}
          >
            <Upload className="h-4 w-4 mr-2" /> Upload Report
          </Button>
        </div>

        {!hasApiKey && (
          <Card className="mb-8 border-border bg-secondary/50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-muted-foreground mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">API Key Required</h3>
                <p className="mt-2 text-foreground/80">Please add your OpenRouter API key in settings to enable health report scanning and analysis.</p>
                <Button 
                  className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground" 
                  onClick={() => navigate("/profile")}
                >
                  Go to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {recentMetrics.length > 0 ? (
            recentMetrics.map((metric) => (
              <HealthMetricCard 
                key={metric.name}
                title={metric.name} 
                value={metric.value.toString()} 
                unit={metric.unit} 
                status={metric.status} 
                description={`${metric.name} levels in your blood`} 
                range={metric.range}
              />
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3 p-6 text-center">
              <div className="flex flex-col items-center justify-center p-6">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No Health Data Yet</h3>
                <p className="text-muted-foreground mb-4">Upload your first health report to see metrics and insights</p>
                <Button 
                  onClick={handleUpload}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Health Report
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden border-border">
            <CardHeader className="bg-card">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-foreground" />
                <CardTitle className="text-foreground">Health Trends</CardTitle>
              </div>
              <CardDescription>Your health metrics over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-md border-border bg-gradient-to-b from-background to-secondary/50">
                <Activity className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">Chart will appear when you have more data</p>
                <Button variant="outline" className="mt-4 border-border text-foreground hover:bg-secondary">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Detailed Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="bg-card">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-foreground" />
                <CardTitle className="text-foreground">Recent Reports</CardTitle>
              </div>
              <CardDescription>Your latest health reports</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentReports />
            </CardContent>
          </Card>
        </div>
      </div>

      <UploadReportDialog 
        open={isUploadDialogOpen} 
        onOpenChange={setIsUploadDialogOpen} 
      />
    </Layout>
  );
};

export default Dashboard;
