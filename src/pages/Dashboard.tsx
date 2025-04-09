
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

interface Report {
  id: string;
  metrics: HealthMetric[];
}

const Dashboard = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [recentMetrics, setRecentMetrics] = useState<HealthMetric[]>([]);
  
  useEffect(() => {
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
  }, []);

  const handleUpload = () => {
    setIsUploadDialogOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Health Dashboard</h1>
            <p className="text-muted-foreground mt-1 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
          <Button 
            size="lg" 
            className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
            onClick={handleUpload}
          >
            <Upload className="h-4 w-4 mr-2" /> Upload Report
          </Button>
        </div>

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
              />
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3 p-6 text-center">
              <div className="flex flex-col items-center justify-center p-6">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Health Data Yet</h3>
                <p className="text-muted-foreground mb-4">Upload your first health report to see metrics and insights</p>
                <Button onClick={handleUpload}>
                  <Upload className="h-4 w-4 mr-2" /> Upload Health Report
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                <CardTitle>Health Trends</CardTitle>
              </div>
              <CardDescription>Your health metrics over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-md bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                <Activity className="h-12 w-12 text-blue-300 mb-3" />
                <p className="text-muted-foreground text-center">Chart will appear when you have more data</p>
                <Button variant="outline" className="mt-4">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Detailed Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-morphism">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
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
