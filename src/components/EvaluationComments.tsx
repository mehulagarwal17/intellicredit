import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Trash2, Edit2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile_name: string;
}

export function EvaluationComments({ evaluationId }: { evaluationId: string }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("evaluation_comments")
      .select("id, content, user_id, created_at")
      .eq("evaluation_id", evaluationId)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch profile names for comment authors
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);

      setComments(
        data.map((c) => ({
          ...c,
          profile_name: nameMap.get(c.user_id) || "Unknown",
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [evaluationId]);

  const handlePost = async () => {
    if (!newComment.trim() || !user) return;
    if (newComment.trim().length > 2000) {
      toast({ title: "Comment too long", description: "Max 2000 characters.", variant: "destructive" });
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("evaluation_comments").insert({
      evaluation_id: evaluationId,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (error) {
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    } else {
      setNewComment("");
      await fetchComments();
    }
    setPosting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("evaluation_comments").delete().eq("id", commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    const { error } = await supabase
      .from("evaluation_comments")
      .update({ content: editContent.trim() })
      .eq("id", commentId);
    if (!error) {
      setEditingId(null);
      await fetchComments();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to add a note.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">
                        {c.profile_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-xs font-medium">{c.profile_name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatTime(c.created_at)}</span>
                  </div>
                  {c.user_id === user?.id && editingId !== c.id && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingId(c.id); setEditContent(c.content); }} className="p-1 rounded hover:bg-muted transition-colors">
                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
                {editingId === c.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="text-sm min-h-[60px]" maxLength={2000} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(c.id)} className="h-7 text-xs gap-1">
                        <Check className="h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs gap-1">
                        <X className="h-3 w-3" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{c.content}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            placeholder="Add a comment or note..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="text-sm min-h-[60px]"
            maxLength={2000}
          />
          <Button onClick={handlePost} disabled={posting || !newComment.trim()} size="icon" className="shrink-0 self-end h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
