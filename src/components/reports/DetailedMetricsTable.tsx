
import { HealthMetric } from "@/services/openAIService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DetailedMetricsTableProps {
  metrics: HealthMetric[];
}

export function DetailedMetricsTable({ metrics }: DetailedMetricsTableProps) {
  // Sort metrics by status (danger first, then warning, then normal)
  const sortedMetrics = [...metrics].sort((a, b) => {
    const statusOrder = { danger: 0, warning: 1, normal: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const getStatusBadge = (status: "normal" | "warning" | "danger") => {
    switch (status) {
      case "danger":
        return <Badge variant="destructive">High Risk</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Medium Risk</Badge>;
      case "normal":
        return <Badge variant="outline" className="border-green-500 text-green-500">Normal</Badge>;
      default:
        return null;
    }
  };

  // Helper function to ensure values are strings
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Parameter</TableHead>
            <TableHead className="font-semibold">Value</TableHead>
            <TableHead className="font-semibold">Unit</TableHead>
            <TableHead className="font-semibold">Reference Range</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMetrics.map((metric) => (
            <TableRow key={metric.name} className={
              metric.status === "danger" ? "bg-red-900/10" :
              metric.status === "warning" ? "bg-amber-900/10" : ""
            }>
              <TableCell className="font-medium">{metric.name}</TableCell>
              <TableCell>{formatValue(metric.value)}</TableCell>
              <TableCell>{metric.unit}</TableCell>
              <TableCell>{metric.range}</TableCell>
              <TableCell>{getStatusBadge(metric.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
