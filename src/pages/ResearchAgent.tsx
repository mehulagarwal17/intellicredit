import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Search, Globe, Loader2, ExternalLink, Shield, Scale, Newspaper, Building2, Users, Link2, RefreshCw, CheckCircle, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SentimentAnalyticsPanel } from "@/components/SentimentAnalyticsPanel";
import { useAuth } from "@/hooks/useAuth";

type ResearchResult = {
  headline: string;
  source: string;
  date: string;
  sentiment: "positive" | "negative" | "neutral";
  category: "news" | "litigation" | "regulatory" | "financial" | "management";
  risk_signal: boolean;
  summary: string;
  url?: string;
};

type SearchMeta = {
  total_results: number;
  risk_signals: number;
  negative_count: number;
  litigation_count: number;
  computed_news_risk_score: number;
};

type EvalOption = {
  id: string;
  company_name: string;
  risk_score: number | null;
};

const qualitativeKeywords: Record<string, number> = {
  "low capacity": 5,
  "promoter dispute": 7,
  "regulatory compliance delay": 5,
  "management turnover": 4,
  "audit qualification": 6,
  "debt restructuring": 8,
  "fraud allegation": 10,
};

const categoryIcons: Record<string, React.ReactNode> = {
  news: <Newspaper className="h-4 w-4" />,
  litigation: <Scale className="h-4 w-4" />,
  regulatory: <Shield className="h-4 w-4" />,
  financial: <TrendingUp className="h-4 w-4" />,
  management: <Users className="h-4 w-4" />,
};

export default function ResearchAgent() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [companyName, setCompanyName] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [notes, setNotes] = useState("");
  const [adjustments, setAdjustments] = useState<{ keyword: string; impact: number }[]>([]);

  // Evaluation linking
  const [evaluations, setEvaluations] = useState<EvalOption[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<string>("");
  const [pushingScore, setPushingScore] = useState(false);
  const [scorePushed, setScorePushed] = useState(false);

  // Load evaluations for linking
  useEffect(() => {
    const loadEvals = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("evaluations")
        .select("id, risk_score, companies!inner(name)")
        .eq("created_by", user.id)
        .in("status", ["draft", "in_progress", "under_review"])
        .order("updated_at", { ascending: false });

      if (data) {
        setEvaluations(
          data.map((e: any) => ({
            id: e.id,
            company_name: e.companies.name,
            risk_score: e.risk_score,
          }))
        );
      }
    };
    loadEvals();
  }, [user]);

  // Pre-select evaluation from URL params
  useEffect(() => {
    const evalId = searchParams.get("evaluation_id");
    const company = searchParams.get("company");
    if (evalId) setSelectedEvalId(evalId);
    if (company) setCompanyName(company);
  }, [searchParams]);

  const handleSearch = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    setSearching(true);
    setResults([]);
    setSearchMeta(null);
    setScorePushed(false);

    try {
      const { data, error } = await supabase.functions.invoke("research-search", {
        body: { company_name: companyName.trim() },
      });

      if (error) throw error;

      if (data?.success) {
        setResults(data.results || []);
        setSearchMeta(data.meta || null);
        setHasSearched(true);
        toast.success(`Found ${data.results?.length || 0} results`);
      } else {
        throw new Error(data?.error || "Search failed");
      }
    } catch (err: any) {
      console.error("Research search error:", err);
      toast.error(err.message || "Failed to search. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handlePushScore = async () => {
    if (!selectedEvalId || !searchMeta) {
      toast.error("Select an evaluation and run a search first");
      return;
    }

    setPushingScore(true);
    try {
      // Recompute risk score with the live news_risk_score
      const { data, error } = await supabase.functions.invoke("compute-risk-score", {
        body: {
          evaluation_id: selectedEvalId,
          qualitative_notes: notes,
          news_risk_score: searchMeta.computed_news_risk_score,
        },
      });

      if (error) throw error;

      // Audit log
      await supabase.from("audit_logs").insert({
        evaluation_id: selectedEvalId,
        user_id: user!.id,
        action: "Research intelligence applied",
        entity: companyName,
        details: `Web research score: ${searchMeta.computed_news_risk_score}/100. ${searchMeta.risk_signals} risk signals, ${searchMeta.negative_count} negative articles, ${searchMeta.litigation_count} litigation articles. Qualitative notes: ${notes ? "Yes" : "None"}. New overall risk score: ${data?.risk_score?.overall_score || "N/A"}.`,
      });

      setScorePushed(true);

      // Refresh evaluations list
      const updatedEvals = evaluations.map((e) =>
        e.id === selectedEvalId ? { ...e, risk_score: data?.risk_score?.overall_score || e.risk_score } : e
      );
      setEvaluations(updatedEvals);

      toast.success(`Risk score updated to ${data?.risk_score?.overall_score}/100 with live research data`);
    } catch (err: any) {
      console.error("Push score error:", err);
      toast.error(err.message || "Failed to update risk score");
    } finally {
      setPushingScore(false);
    }
  };

  const analyzeNotes = () => {
    const found: { keyword: string; impact: number }[] = [];
    const lower = notes.toLowerCase();
    Object.entries(qualitativeKeywords).forEach(([keyword, impact]) => {
      if (lower.includes(keyword)) {
        found.push({ keyword, impact });
      }
    });
    setAdjustments(found);
  };

  const totalAdjustment = adjustments.reduce((sum, a) => sum + a.impact, 0);
  const newsScore = searchMeta?.computed_news_risk_score ?? 0;

  const sentimentIcon = (sentiment: string) => {
    if (sentiment === "negative") return <TrendingDown className="h-4 w-4 text-destructive" />;
    if (sentiment === "positive") return <TrendingUp className="h-4 w-4 text-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const sentimentColor = (sentiment: string) => {
    if (sentiment === "negative") return "text-destructive";
    if (sentiment === "positive") return "text-success";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Research Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live web intelligence, litigation monitoring, and qualitative risk analysis
        </p>
      </div>

      {/* Search Bar + Evaluation Link */}
      <Card className="shadow-card">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter company name (e.g. Reliance Infra Ventures Ltd)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} className="gap-2 min-w-[160px]">
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Researching...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" /> Search Web
                </>
              )}
            </Button>
          </div>

          {/* Link to Evaluation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/30 border border-dashed">
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Link2 className="h-4 w-4" />
              <span>Link to evaluation:</span>
            </div>
            <Select value={selectedEvalId} onValueChange={setSelectedEvalId}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Select an active evaluation" />
              </SelectTrigger>
              <SelectContent>
                {evaluations.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.company_name} {ev.risk_score !== null ? `(Score: ${ev.risk_score})` : "(No score yet)"}
                  </SelectItem>
                ))}
                {evaluations.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No active evaluations found</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {searching && (
            <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
              <p className="text-sm text-muted-foreground text-center animate-pulse">
                🔍 Crawling news, litigation records, regulatory filings, and sector intelligence...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Meta Summary */}
      {searchMeta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Results</p>
              <p className="text-2xl font-bold font-mono mt-1">{searchMeta.total_results}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Signals</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${searchMeta.risk_signals > 0 ? "text-destructive" : "text-success"}`}>
                {searchMeta.risk_signals}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Negative News</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${searchMeta.negative_count > 2 ? "text-destructive" : "text-warning"}`}>
                {searchMeta.negative_count}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">News Risk Score</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${
                searchMeta.computed_news_risk_score <= 40 ? "text-success" :
                searchMeta.computed_news_risk_score <= 70 ? "text-warning" : "text-destructive"
              }`}>
                {searchMeta.computed_news_risk_score}/100
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sentiment Analytics */}
      {hasSearched && results.length > 0 && (
        <SentimentAnalyticsPanel results={results} companyName={companyName} />
      )}

      {/* Push to Evaluation Button */}
      {searchMeta && selectedEvalId && (
        <Card className={`shadow-card border-2 ${scorePushed ? "border-success/30" : "border-primary/30"}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {scorePushed ? "✅ Research data applied to evaluation" : "Apply research intelligence to evaluation"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This will recompute the overall risk score using the live news/litigation score of {searchMeta.computed_news_risk_score}/100
                  {notes ? " and your qualitative notes" : ""}
                </p>
              </div>
              <Button
                onClick={handlePushScore}
                disabled={pushingScore || scorePushed}
                variant={scorePushed ? "outline" : "default"}
                className="gap-2 shrink-0"
              >
                {pushingScore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                  </>
                ) : scorePushed ? (
                  <>
                    <CheckCircle className="h-4 w-4" /> Score Updated
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" /> Recompute Risk Score
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Research Results */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">
              {hasSearched ? `Research Results for "${companyName}"` : "Market Intelligence"}
            </CardTitle>
            <CardDescription>
              {hasSearched
                ? `${results.length} articles analyzed with AI sentiment detection`
                : "Enter a company name above to search live news, litigation, and regulatory filings"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasSearched && !searching && (
              <div className="text-center py-10 text-muted-foreground">
                <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No research data yet</p>
                <p className="text-xs mt-1">Search for a company to start live web intelligence</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {results.map((item, idx) => (
                  <div key={idx} className={`flex gap-3 p-3 rounded-lg border ${
                    item.risk_signal ? "border-destructive/30 bg-destructive/5" : "bg-muted/20"
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {sentimentIcon(item.sentiment)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{item.headline}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.summary}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">{item.source}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{item.date}</span>
                        <Badge variant="secondary" className={`text-[10px] ${sentimentColor(item.sentiment)}`}>
                          {item.sentiment}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          {categoryIcons[item.category] || null}
                          {item.category}
                        </Badge>
                        {item.risk_signal && (
                          <Badge variant="destructive" className="text-[10px]">
                            ⚠ Risk Signal
                          </Badge>
                        )}
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1.5"
                        >
                          <ExternalLink className="h-3 w-3" /> View Source
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasSearched && results.length === 0 && !searching && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No relevant results found. Try a different company name.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Due Diligence Notes + Risk Adjustments */}
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Due Diligence Notes</CardTitle>
              <CardDescription>
                Enter qualitative observations. Keywords like "promoter dispute", "low capacity",
                "regulatory compliance delay" will auto-adjust the risk score.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Enter your due diligence notes here... e.g. 'Promoter dispute observed in board minutes. Low capacity utilization reported at 45%.'"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <Button onClick={analyzeNotes} className="gap-2">
                <Search className="h-4 w-4" /> Analyze Notes
              </Button>
            </CardContent>
          </Card>

          {/* Risk Adjustments */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Risk Score Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Web research score */}
              {searchMeta && (
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  newsScore > 60 ? "border-destructive/30 bg-destructive/5" :
                  newsScore > 40 ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"
                }`}>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm">Litigation & News Score</span>
                  </div>
                  <span className={`font-mono text-sm font-bold ${
                    newsScore <= 40 ? "text-success" : newsScore <= 70 ? "text-warning" : "text-destructive"
                  }`}>
                    {newsScore}/100
                  </span>
                </div>
              )}

              {!searchMeta && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Litigation & News Score</span>
                  <span className="font-mono text-sm text-muted-foreground">Not computed — run web search</span>
                </div>
              )}

              {adjustments.length > 0 && (
                <div className="space-y-2">
                  {adjustments.map((adj, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-warning/30 bg-warning/5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        <span className="text-sm capitalize">{adj.keyword}</span>
                      </div>
                      <span className="font-mono text-sm text-destructive font-medium">+{adj.impact}</span>
                    </div>
                  ))}
                </div>
              )}

              {adjustments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No qualitative adjustments yet. Analyze your notes above.
                </p>
              )}

              <div className="p-4 rounded-lg bg-muted/30 font-mono text-xs space-y-1 leading-relaxed border">
                <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-wider mb-2">How it feeds into risk score</p>
                <p>Litigation/News Score = <span className="font-bold">{searchMeta ? newsScore : "?"}</span>/100 (20% weight)</p>
                <p>Qualitative Adjustments = <span className="font-bold">+{totalAdjustment}</span> points</p>
                <p className="text-muted-foreground">→ These values are sent to the risk engine when you click "Recompute Risk Score"</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
