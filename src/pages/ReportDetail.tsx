
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";
import { ChartContainer } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Mock data
const reportData = {
  id: 1,
  title: "Blood Report - July 2024",
  date: "2024-07-15",
  metrics: [
    { 
      name: "Cholesterol", 
      value: 185, 
      unit: "mg/dL", 
      status: "normal",
      range: "125-200",
      history: [
        { date: "Jan 2024", value: 195 },
        { date: "Mar 2024", value: 190 },
        { date: "May 2024", value: 188 },
        { date: "Jul 2024", value: 185 },
      ]
    },
    { 
      name: "Glucose", 
      value: 98, 
      unit: "mg/dL", 
      status: "normal",
      range: "70-100",
      history: [
        { date: "Jan 2024", value: 95 },
        { date: "Mar 2024", value: 92 },
        { date: "May 2024", value: 96 },
        { date: "Jul 2024", value: 98 },
      ]
    },
    { 
      name: "Hemoglobin", 
      value: 13.5, 
      unit: "g/dL", 
      status: "warning",
      range: "14-18",
      history: [
        { date: "Jan 2024", value: 14.5 },
        { date: "Mar 2024", value: 14.2 },
        { date: "May 2024", value: 13.8 },
        { date: "Jul 2024", value: 13.5 },
      ]
    },
    { 
      name: "Red Blood Cells", 
      value: 5.1, 
      unit: "million/μL", 
      status: "normal",
      range: "4.5-5.9",
      history: [
        { date: "Jan 2024", value: 5.2 },
        { date: "Mar 2024", value: 5.0 },
        { date: "May 2024", value: 5.1 },
        { date: "Jul 2024", value: 5.1 },
      ]
    },
  ],
  recommendations: [
    "Consider increasing iron-rich foods in your diet to improve hemoglobin levels.",
    "Maintain regular exercise to keep cholesterol and glucose levels in check.",
    "Schedule a follow-up appointment in 3 months to monitor hemoglobin levels."
  ]
};

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
          <h1 className="text-3xl font-bold">{reportData.title}</h1>
          <p className="text-muted-foreground mt-1">
            Report Date: {new Date(reportData.date).toLocaleDateString()}
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
              {reportData.metrics.map((metric) => (
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
              {reportData.metrics.map((metric) => (
                <Card key={metric.name}>
                  <CardHeader>
                    <CardTitle>{metric.name} Trend</CardTitle>
                    <CardDescription>Historical values over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ChartContainer config={chartConfig}>
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
                <ul className="space-y-4">
                  {reportData.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <p>{recommendation}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportDetail;
