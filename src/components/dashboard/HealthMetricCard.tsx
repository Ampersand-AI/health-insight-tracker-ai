
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, TrendingUp, TrendingDown } from "lucide-react";

interface HealthMetricCardProps {
  title: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "danger";
  change?: number;
  description: string;
}

export function HealthMetricCard({ 
  title, 
  value, 
  unit, 
  status, 
  change, 
  description 
}: HealthMetricCardProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case "normal": return "text-health-normal";
      case "warning": return "text-health-warning";
      case "danger": return "text-health-danger";
      default: return "text-health-normal";
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case "normal": return "bg-green-50 dark:bg-green-900/20";
      case "warning": return "bg-amber-50 dark:bg-amber-900/20";
      case "danger": return "bg-red-50 dark:bg-red-900/20";
      default: return "bg-green-50 dark:bg-green-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "normal": return <Activity className="h-4 w-4 text-health-normal" />;
      case "warning": return <TrendingUp className="h-4 w-4 text-health-warning" />;
      case "danger": return <Heart className="h-4 w-4 text-health-danger" />;
      default: return <Activity className="h-4 w-4 text-health-normal" />;
    }
  };

  const getChangeIndicator = () => {
    if (!change) return null;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-sm">
          <TrendingUp className="h-4 w-4 mr-1 text-health-warning" />
          <span className="text-health-warning">{Math.abs(change)}% increase</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-sm">
          <TrendingDown className="h-4 w-4 mr-1 text-health-normal" />
          <span className="text-health-normal">{Math.abs(change)}% decrease</span>
        </div>
      );
    }
  };

  return (
    <Card className="overflow-hidden border-t-4 transition-all hover:shadow-md" style={{ borderTopColor: status === 'normal' ? 'var(--health-normal)' : status === 'warning' ? 'var(--health-warning)' : 'var(--health-danger)' }}>
      <CardHeader className={`pb-2 ${getStatusBg(status)}`}>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
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
        <div className="mt-2 text-muted-foreground">
          {getChangeIndicator()}
        </div>
      </CardContent>
    </Card>
  );
}
