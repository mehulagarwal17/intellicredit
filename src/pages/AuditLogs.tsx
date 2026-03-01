import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { mockAuditLogs } from "@/data/mockData";
import { Clock, User } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  entity: string | null;
  details: string | null;
  user_name: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, action, entity, details, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        // Fetch profiles for user names
        const userIds = [...new Set(data.map((l) => l.user_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

        setLogs(
          data.map((l) => ({
            id: l.id,
            action: l.action,
            entity: l.entity,
            details: l.details,
            user_name: l.user_id ? profileMap.get(l.user_id) || "System" : "System",
            created_at: new Date(l.created_at).toLocaleString("en-IN"),
          }))
        );
      } else {
        setLogs(
          mockAuditLogs.map((l) => ({
            id: l.id,
            action: l.action,
            entity: l.entity,
            details: l.details,
            user_name: l.user,
            created_at: l.timestamp,
          }))
        );
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

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
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="relative flex gap-4 pl-10">
                    <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-card" />
                    <div className="flex-1 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{log.action}</span>
                        {log.entity && <Badge variant="secondary" className="text-[10px]">{log.entity}</Badge>}
                      </div>
                      {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {log.user_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {log.created_at}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
