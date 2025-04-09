
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadReportDialog } from "@/components/upload/UploadReportDialog";
import { HealthMetricCard } from "@/components/dashboard/HealthMetricCard";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";

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
            <h1 className="text-3xl font-bold">Health Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor your health metrics and reports</p>
          </div>
          <Button 
            size="lg" 
            className="mt-4 md:mt-0"
            onClick={handleUpload}
          >
            Upload Report
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Health Trends</CardTitle>
              <CardDescription>Your health metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border border-dashed rounded-md">
                <p className="text-muted-foreground">Chart will appear when you have more data</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
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
