
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

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

  const getChangeIndicator = () => {
    if (!change) return null;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-sm">
          <ArrowUp className="h-4 w-4 mr-1" />
          <span>{Math.abs(change)}% increase</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-sm">
          <ArrowDown className="h-4 w-4 mr-1" />
          <span>{Math.abs(change)}% decrease</span>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
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
