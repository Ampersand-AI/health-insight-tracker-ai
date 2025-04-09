
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadReportDialog } from "@/components/upload/UploadReportDialog";
import { HealthMetricCard } from "@/components/dashboard/HealthMetricCard";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Activity, Calendar, FileText, Upload, TrendingUp, BarChart3 } from "lucide-react";

const Dashboard = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  
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
              Last updated: April 9, 2025
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
          <HealthMetricCard 
            title="Cholesterol" 
            value="185" 
            unit="mg/dL" 
            status="normal" 
            change={-5}
            description="Total cholesterol levels" 
          />
          <HealthMetricCard 
            title="Glucose" 
            value="98" 
            unit="mg/dL" 
            status="normal" 
            change={2}
            description="Fasting blood glucose" 
          />
          <HealthMetricCard 
            title="Hemoglobin" 
            value="13.5" 
            unit="g/dL" 
            status="warning" 
            change={-0.8}
            description="Oxygen-carrying protein" 
          />
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
