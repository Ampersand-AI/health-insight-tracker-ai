
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface HealthMetricCardProps {
  title: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "danger";
  change?: number;
  description: string;
  range?: string;
}

export function HealthMetricCard({ 
  title, 
  value, 
  unit, 
  status, 
  change, 
  description,
  range 
}: HealthMetricCardProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case "normal": return "text-primary/80";
      case "warning": return "text-primary/60";
      case "danger": return "text-primary";
      default: return "text-primary/80";
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case "normal": return "bg-secondary/50";
      case "warning": return "bg-secondary";
      case "danger": return "bg-background";
      default: return "bg-secondary/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "normal": return <Activity className="h-4 w-4 text-primary/80" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-primary/60" />;
      case "danger": return <AlertCircle className="h-4 w-4 text-primary" />;
      default: return <Activity className="h-4 w-4 text-primary/80" />;
    }
  };

  const getChangeIndicator = () => {
    if (!change) return null;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-sm">
          <TrendingUp className="h-4 w-4 mr-1 text-primary/60" />
          <span className="text-primary/60">{Math.abs(change)}% increase</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-sm">
          <TrendingDown className="h-4 w-4 mr-1 text-primary/80" />
          <span className="text-primary/80">{Math.abs(change)}% decrease</span>
        </div>
      );
    }
  };

  const getBorderStyle = (status: string) => {
    switch(status) {
      case "normal": return "border-primary/20";
      case "warning": return "border-primary/40";
      case "danger": return "border-primary";
      default: return "border-primary/20";
    }
  };

  const getRiskAlert = (status: string) => {
    if (status === "normal") return null;
    
    return (
      <Alert variant={status === "danger" ? "destructive" : "default"} className="mt-3">
        <AlertTitle className="flex items-center">
          {status === "danger" ? 
            <AlertCircle className="h-4 w-4 mr-1" /> : 
            <AlertTriangle className="h-4 w-4 mr-1" />
          }
          {status === "danger" ? "High Risk" : "Medium Risk"}
        </AlertTitle>
        <AlertDescription>
          {status === "danger" 
            ? "This value requires immediate attention." 
            : "This value is outside the normal range."}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className={`overflow-hidden border-t-4 transition-all hover:shadow-md ${getBorderStyle(status)}`}>
      <CardHeader className={`pb-2 ${getStatusBg(status)}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">{title}</CardTitle>
          {getStatusIcon(status)}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-baseline">
            <span className={`text-3xl font-bold ${getStatusColor(status)}`}>{value}</span>
            <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
        {range && (
          <div className="mt-2 text-xs text-muted-foreground">
            Normal range: {range}
          </div>
        )}
        <div className="mt-2 text-muted-foreground">
          {getChangeIndicator()}
        </div>
        {getRiskAlert(status)}
      </CardContent>
    </Card>
  );
}
