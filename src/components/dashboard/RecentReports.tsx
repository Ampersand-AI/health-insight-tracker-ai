
import { Button } from "@/components/ui/button";
import { Eye, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Mock data for recent reports
const recentReports = [
  { id: 1, title: "Blood Report - July 2024", date: "2024-07-15", type: "blood" },
  { id: 2, title: "Cholesterol Panel - May 2024", date: "2024-05-03", type: "cholesterol" },
  { id: 3, title: "CBC Results - January 2024", date: "2024-01-22", type: "cbc" },
];

export function RecentReports() {
  if (recentReports.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No reports yet</p>
      </div>
    );
  }

  const getReportBadge = (type: string) => {
    switch(type) {
      case "blood":
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300">Blood</Badge>;
      case "cholesterol":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300">Cholesterol</Badge>;
      case "cbc":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300">CBC</Badge>;
      default:
        return <Badge variant="outline">Report</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {recentReports.map((report) => (
        <div key={report.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 p-2 rounded-md transition-colors">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">{report.title}</h4>
              <div className="flex items-center mt-1 space-x-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(report.date).toLocaleDateString()}
                </div>
                <div>{getReportBadge(report.type)}</div>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0" asChild>
            <Link to={`/report/${report.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Link>
          </Button>
        </div>
      ))}
      <div className="pt-2">
        <Button variant="outline" className="w-full" asChild>
          <Link to="/reports">View All Reports</Link>
        </Button>
      </div>
    </div>
  );
}
