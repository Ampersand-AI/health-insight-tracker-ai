
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for recent reports
const recentReports = [
  { id: 1, title: "Blood Report - July 2024", date: "2024-07-15" },
  { id: 2, title: "Cholesterol Panel - May 2024", date: "2024-05-03" },
  { id: 3, title: "CBC Results - January 2024", date: "2024-01-22" },
];

export function RecentReports() {
  if (recentReports.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No reports yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentReports.map((report) => (
        <div key={report.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
          <div>
            <h4 className="font-medium">{report.title}</h4>
            <p className="text-sm text-muted-foreground">
              {new Date(report.date).toLocaleDateString()}
            </p>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/report/${report.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
