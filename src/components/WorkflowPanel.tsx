import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileEdit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  GitCommit,
  Archive,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Status = "draft" | "in_progress" | "under_review" | "approved" | "rejected" | "completed" | "archived";

interface HistoryEntry {
  id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  comment: string | null;
  created_at: string;
  profile_name: string;
}

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", icon: <FileEdit className="h-3.5 w-3.5" />, variant: "secondary" },
  in_progress: { label: "In Progress", icon: <Clock className="h-3.5 w-3.5" />, variant: "outline" },
  under_review: { label: "Under Review", icon: <Send className="h-3.5 w-3.5" />, variant: "default" },
  approved: { label: "Approved", icon: <CheckCircle className="h-3.5 w-3.5" />, variant: "default" },
  rejected: { label: "Rejected", icon: <XCircle className="h-3.5 w-3.5" />, variant: "destructive" },
  completed: { label: "Completed", icon: <CheckCircle className="h-3.5 w-3.5" />, variant: "default" },
  archived: { label: "Archived", icon: <Archive className="h-3.5 w-3.5" />, variant: "secondary" },
};

// Workflow transition rules: which roles can transition from which status to which
const TRANSITIONS: Record<string, { to: Status; label: string; roles: string[]; requireComment?: boolean }[]> = {
  draft: [
    { to: "in_progress", label: "Start Analysis", roles: ["admin", "credit_officer", "analyst"] },
  ],
  in_progress: [
    { to: "under_review", label: "Submit for Review", roles: ["admin", "credit_officer", "analyst"], requireComment: true },
    { to: "draft", label: "Back to Draft", roles: ["admin", "credit_officer", "analyst"] },
  ],
  under_review: [
    { to: "approved", label: "Approve", roles: ["admin", "credit_officer"], requireComment: true },
    { to: "rejected", label: "Reject", roles: ["admin", "credit_officer"], requireComment: true },
    { to: "in_progress", label: "Return for Revision", roles: ["admin", "credit_officer"], requireComment: true },
  ],
  approved: [
    { to: "completed", label: "Mark Completed", roles: ["admin", "credit_officer"] },
    { to: "archived", label: "Archive", roles: ["admin"] },
  ],
  rejected: [
    { to: "in_progress", label: "Reopen for Revision", roles: ["admin", "credit_officer"] },
    { to: "archived", label: "Archive", roles: ["admin"] },
  ],
  completed: [
    { to: "archived", label: "Archive", roles: ["admin"] },
  ],
  archived: [],
};

const STEPS: Status[] = ["draft", "in_progress", "under_review", "approved"];

function getStepIndex(status: Status): number {
  if (status === "rejected") return 2; // stays at review level
  if (status === "completed") return 4;
  if (status === "archived") return 4;
  return STEPS.indexOf(status);
}

interface Props {
  evaluationId: string;
  currentStatus: Status;
  onStatusChange: (newStatus: Status) => void;
}

export function WorkflowPanel({ evaluationId, currentStatus, onStatusChange }: Props) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<{ to: Status; label: string } | null>(null);
  const [comment, setComment] = useState("");

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("workflow_history")
      .select("id, from_status, to_status, changed_by, comment, created_at")
      .eq("evaluation_id", evaluationId)
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((h) => h.changed_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);

      setHistory(
        data.map((h) => ({
          ...h,
          profile_name: nameMap.get(h.changed_by) || "Unknown",
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [evaluationId]);

  const availableTransitions = (TRANSITIONS[currentStatus] || []).filter(
    (t) => role && t.roles.includes(role)
  );

  const handleTransition = (transition: { to: Status; label: string; requireComment?: boolean }) => {
    if (transition.requireComment) {
      setSelectedTransition(transition);
      setComment("");
      setDialogOpen(true);
    } else {
      executeTransition(transition.to, transition.label, "");
    }
  };

  const executeTransition = async (toStatus: Status, label: string, transitionComment: string) => {
    if (!user) return;
    setTransitioning(true);

    // Update evaluation status
    const { error: updateError } = await supabase
      .from("evaluations")
      .update({ status: toStatus })
      .eq("id", evaluationId);

    if (updateError) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
      setTransitioning(false);
      return;
    }

    // Insert workflow history
    await supabase.from("workflow_history").insert({
      evaluation_id: evaluationId,
      from_status: currentStatus,
      to_status: toStatus,
      changed_by: user.id,
      comment: transitionComment || null,
    });

    // Insert audit log
    await supabase.from("audit_logs").insert({
      action: `status_change`,
      entity: "evaluation",
      evaluation_id: evaluationId,
      user_id: user.id,
      details: `${label}: ${currentStatus} → ${toStatus}`,
      metadata: { from: currentStatus, to: toStatus, comment: transitionComment || null },
    });

    // Create notification for evaluation owner (if different from current user)
    const { data: evalData } = await supabase
      .from("evaluations")
      .select("created_by")
      .eq("id", evaluationId)
      .single();

    if (evalData && evalData.created_by !== user.id) {
      await supabase.from("notifications").insert({
        user_id: evalData.created_by,
        title: `Evaluation ${label}`,
        message: `Status changed to "${STATUS_CONFIG[toStatus].label}"${transitionComment ? `: ${transitionComment}` : ""}`,
        type: toStatus === "approved" ? "success" : toStatus === "rejected" ? "error" : "info",
        evaluation_id: evaluationId,
      });
    }

    onStatusChange(toStatus);
    setDialogOpen(false);
    await fetchHistory();
    toast({ title: "Status updated", description: `Evaluation moved to "${STATUS_CONFIG[toStatus].label}"` });
    setTransitioning(false);
  };

  const stepIndex = getStepIndex(currentStatus);
  const config = STATUS_CONFIG[currentStatus];

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Approval Workflow
          </CardTitle>
          <Badge variant={config.variant} className="gap-1.5">
            {config.icon} {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress Steps */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const isActive = i <= stepIndex && currentStatus !== "rejected";
            const isCurrent = step === currentStatus || (currentStatus === "rejected" && step === "under_review");
            const stepConf = STATUS_CONFIG[step];
            return (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium w-full justify-center transition-colors ${
                  isCurrent
                    ? currentStatus === "rejected"
                      ? "bg-destructive/10 text-destructive border border-destructive/30"
                      : "bg-primary/10 text-primary border border-primary/30"
                    : isActive
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {stepConf.icon}
                  <span className="hidden sm:inline">{stepConf.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className={`h-3 w-3 shrink-0 mx-1 ${isActive && i < stepIndex ? "text-success" : "text-muted-foreground/30"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        {availableTransitions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((t) => {
              const isApprove = t.to === "approved" || t.to === "completed";
              const isReject = t.to === "rejected";
              return (
                <Button
                  key={t.to}
                  size="sm"
                  variant={isReject ? "destructive" : isApprove ? "default" : "outline"}
                  className="gap-1.5 text-xs"
                  disabled={transitioning}
                  onClick={() => handleTransition(t)}
                >
                  {STATUS_CONFIG[t.to].icon}
                  {t.label}
                </Button>
              );
            })}
          </div>
        )}

        {availableTransitions.length === 0 && currentStatus !== "archived" && (
          <p className="text-xs text-muted-foreground">
            No actions available for your role at this stage.
          </p>
        )}

        {/* History Timeline */}
        {!loading && history.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Workflow History</p>
            <div className="space-y-3">
              {history.slice(0, 5).map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <GitCommit className="h-4 w-4 text-primary shrink-0" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="pb-3 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium">{h.profile_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {STATUS_CONFIG[h.from_status as Status]?.label || h.from_status} → {STATUS_CONFIG[h.to_status as Status]?.label || h.to_status}
                      </span>
                    </div>
                    {h.comment && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">"{h.comment}"</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {new Date(h.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{" "}
                      {new Date(h.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Transition Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTransition?.label}</DialogTitle>
            <DialogDescription>
              This will change the status from "{STATUS_CONFIG[currentStatus].label}" to "{selectedTransition ? STATUS_CONFIG[selectedTransition.to].label : ""}".
              Please add a comment explaining this decision.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add your comment (required)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px]"
            maxLength={1000}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!comment.trim() || transitioning}
              variant={selectedTransition?.to === "rejected" ? "destructive" : "default"}
              onClick={() => {
                if (selectedTransition) {
                  executeTransition(selectedTransition.to, selectedTransition.label, comment.trim());
                }
              }}
            >
              {transitioning ? "Processing..." : selectedTransition?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
