import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockAuditLogs } from "@/data/mockData";
import { Clock, User, Activity } from "lucide-react";

export default function AuditLogs() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete decision trail and system activity log
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {mockAuditLogs.map((log) => (
                <div key={log.id} className="relative flex gap-4 pl-10">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-card" />
                  <div className="flex-1 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{log.action}</span>
                      <Badge variant="secondary" className="text-[10px]">{log.entity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {log.user}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
