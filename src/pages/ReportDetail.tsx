
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";
import { ChartContainer } from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Metric {
  name: string;
  value: number;
  unit: string;
  status: string;
  range: string;
  history: { date: string; value: number }[];
}

interface Report {
  id: string;
  title: string;
  date: string;
  metrics: Metric[];
  recommendations: string[];
  type: string;
}

const chartConfig = {
  normal: {
    color: "hsl(var(--health-normal))"
  },
  warning: {
    color: "hsl(var(--health-warning))"
  },
  danger: {
    color: "hsl(var(--health-danger))"
  }
};

const ReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!id) return;
    
    // Get the scanned reports from localStorage
    const storedReports = localStorage.getItem('scannedReports');
    if (storedReports) {
      try {
        const parsedReports = JSON.parse(storedReports);
        const foundReport = parsedReports.find((report: Report) => report.id === id);
        
        if (foundReport) {
          setReport(foundReport);
        } else {
          // Report not found
          navigate('/reports');
        }
      } catch (error) {
        console.error("Error loading report:", error);
      }
    }
    setLoading(false);
  }, [id, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Report Not Found</h1>
          <p className="mt-4">The report you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-6" onClick={() => navigate('/reports')}>
            Back to Reports
          </Button>
        </div>
      </Layout>
    );
  }

  const getStatusClass = (status: string) => {
    switch(status) {
      case "normal": return "text-health-normal";
      case "warning": return "text-health-warning";
      case "danger": return "text-health-danger";
      default: return "text-health-normal";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{report.title}</h1>
          <p className="text-muted-foreground mt-1">
            Report Date: {new Date(report.date).toLocaleDateString()}
          </p>
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {report.metrics.map((metric) => (
                <Card key={metric.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{metric.name}</CardTitle>
                    <CardDescription>Normal Range: {metric.range} {metric.unit}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className={`text-3xl font-bold ${getStatusClass(metric.status)}`}>
                        {metric.value}
                      </span>
                      <span className="text-muted-foreground">{metric.unit}</span>
                    </div>
                    <p className={`text-sm mt-2 ${getStatusClass(metric.status)}`}>
                      {metric.status === "normal" && "Within normal range"}
                      {metric.status === "warning" && "Slightly below normal range"}
                      {metric.status === "danger" && "Outside normal range"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="trends">
            <div className="grid grid-cols-1 gap-6">
              {report.metrics.map((metric) => (
                <Card key={metric.name}>
                  <CardHeader>
                    <CardTitle>{metric.name} Trend</CardTitle>
                    <CardDescription>Historical values over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ChartContainer config={chartConfig}>
                        {metric.history && metric.history.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metric.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`color-${metric.name}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={`hsl(var(--health-${metric.status}))`} stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor={`hsl(var(--health-${metric.status}))`} stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="date" />
                              <YAxis domain={['auto', 'auto']} />
                              <Tooltip />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={`hsl(var(--health-${metric.status}))`} 
                                fillOpacity={1} 
                                fill={`url(#color-${metric.name})`} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <p className="text-muted-foreground">No historical data available</p>
                          </div>
                        )}
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Recommendations</CardTitle>
                <CardDescription>
                  Based on your blood report analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.recommendations && report.recommendations.length > 0 ? (
                  <ul className="space-y-4">
                    {report.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <p>{recommendation}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No recommendations available for this report.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportDetail;
