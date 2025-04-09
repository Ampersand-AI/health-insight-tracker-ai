
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadReportDialog } from "@/components/upload/UploadReportDialog";
import { HealthMetricCard } from "@/components/dashboard/HealthMetricCard";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Activity, AlertTriangle, Calendar, FileText, Upload, TrendingUp, BarChart3, Trash2 } from "lucide-react";
import { HealthMetric, clearAllHealthData } from "@/services/openAIService";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Report {
  id: string;
  metrics: HealthMetric[];
}

const Dashboard = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [riskMetrics, setRiskMetrics] = useState<HealthMetric[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasReports, setHasReports] = useState(false);
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
        setHasReports(parsedReports.length > 0);
        
        if (parsedReports.length > 0 && parsedReports[0].metrics) {
          // Filter only risk metrics (warning or danger)
          const atRiskMetrics = parsedReports[0].metrics.filter(
            metric => metric.status === "warning" || metric.status === "danger"
          );
          setRiskMetrics(atRiskMetrics);
        }
      } catch (error) {
        console.error("Error parsing reports:", error);
      }
    } else {
      setHasReports(false);
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

  const handleClearData = () => {
    clearAllHealthData();
    setRiskMetrics([]);
    setHasReports(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Health Dashboard</h1>
            <p className="text-muted-foreground mt-1 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            {hasReports && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearData}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="lg" 
              onClick={handleUpload}
              className="bg-accent hover:bg-accent/80"
            >
              <Upload className="h-4 w-4 mr-2" /> Upload Report
            </Button>
          </div>
        </div>

        {!hasApiKey && (
          <Card className="mb-8 border-border">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-muted-foreground mb-3">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">API Key Required</h3>
                <p className="mt-2 text-muted-foreground">Please add your OpenRouter API key in settings to enable health report scanning and analysis.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate("/profile")}
                >
                  Go to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasReports && riskMetrics.length > 0 && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle>Risk Factors Detected</AlertTitle>
            <AlertDescription>
              Your latest health report shows {riskMetrics.length} parameters that require attention.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {riskMetrics.length > 0 ? (
            riskMetrics.map((metric) => (
              <HealthMetricCard 
                key={metric.name}
                title={metric.name} 
                value={metric.value.toString()} 
                unit={metric.unit} 
                status={metric.status} 
                description={`Outside normal range: ${metric.range} ${metric.unit}`} 
              />
            ))
          ) : (
            hasReports ? (
              <Card className="md:col-span-2 lg:col-span-3 p-6 text-center">
                <div className="flex flex-col items-center justify-center p-6">
                  <Activity className="h-12 w-12 text-accent mb-4" />
                  <h3 className="text-xl font-semibold mb-2">All Parameters Normal</h3>
                  <p className="text-muted-foreground mb-4">No risk factors were identified in your latest health report</p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/reports")}
                  >
                    <FileText className="h-4 w-4 mr-2" /> View Full Report
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="md:col-span-2 lg:col-span-3 p-6 text-center">
                <div className="flex flex-col items-center justify-center p-6">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Health Data Yet</h3>
                  <p className="text-muted-foreground mb-4">Upload your first health report to see metrics and insights</p>
                  <Button 
                    onClick={handleUpload}
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload Health Report
                  </Button>
                </div>
              </Card>
            )
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader>
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                <CardTitle>Health Trends</CardTitle>
              </div>
              <CardDescription>Your health metrics over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-md">
                <Activity className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">Chart will appear when you have more data</p>
                <Button variant="outline" className="mt-4">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Detailed Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                <CardTitle>Recent Reports</CardTitle>
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
