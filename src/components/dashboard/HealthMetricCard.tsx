
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

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
      case "normal": return "text-gray-700";
      case "warning": return "text-gray-600";
      case "danger": return "text-black";
      default: return "text-gray-700";
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case "normal": return "bg-gray-50";
      case "warning": return "bg-gray-100";
      case "danger": return "bg-gray-200";
      default: return "bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "normal": return <Activity className="h-4 w-4 text-gray-700" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      case "danger": return <AlertCircle className="h-4 w-4 text-black" />;
      default: return <Activity className="h-4 w-4 text-gray-700" />;
    }
  };

  const getChangeIndicator = () => {
    if (!change) return null;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-sm">
          <TrendingUp className="h-4 w-4 mr-1 text-gray-600" />
          <span className="text-gray-600">{Math.abs(change)}% increase</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-sm">
          <TrendingDown className="h-4 w-4 mr-1 text-gray-700" />
          <span className="text-gray-700">{Math.abs(change)}% decrease</span>
        </div>
      );
    }
  };

  const getBorderStyle = (status: string) => {
    switch(status) {
      case "normal": return "border-gray-300";
      case "warning": return "border-gray-400";
      case "danger": return "border-black";
      default: return "border-gray-300";
    }
  };

  return (
    <Card className={`overflow-hidden border-t-4 transition-all hover:shadow-md ${getBorderStyle(status)}`}>
      <CardHeader className={`pb-2 ${getStatusBg(status)}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-black">{title}</CardTitle>
          {getStatusIcon(status)}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-baseline">
            <span className={`text-3xl font-bold ${getStatusColor(status)}`}>{value}</span>
            <span className="ml-1 text-sm text-gray-500">{unit}</span>
          </div>
        </div>
        <div className="mt-2 text-gray-500">
          {getChangeIndicator()}
        </div>
      </CardContent>
    </Card>
  );
}
