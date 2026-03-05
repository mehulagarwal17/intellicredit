import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockRiskScore } from "@/data/mockData";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Search, Globe, Loader2, ExternalLink, Shield, Scale, Newspaper, Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [companyName, setCompanyName] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [notes, setNotes] = useState("");
  const [adjustments, setAdjustments] = useState<{ keyword: string; impact: number }[]>([]);
  const [baseScore] = useState(mockRiskScore.overall);

  const handleSearch = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    setSearching(true);
    setResults([]);
    setSearchMeta(null);

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
  const newsAdjustment = searchMeta ? Math.round((searchMeta.computed_news_risk_score - 30) * 0.2) : 0;
  const adjustedScore = Math.min(100, baseScore + totalAdjustment + newsAdjustment);

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

      {/* Search Bar */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
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
          {searching && (
            <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-dashed">
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
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Base Risk Score</span>
                <span className="font-mono font-semibold">{baseScore}</span>
              </div>

              {/* Web research adjustment */}
              {searchMeta && newsAdjustment !== 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm">Web Research Signal</span>
                  </div>
                  <span className={`font-mono text-sm font-medium ${newsAdjustment > 0 ? "text-destructive" : "text-success"}`}>
                    {newsAdjustment > 0 ? "+" : ""}{newsAdjustment}
                  </span>
                </div>
              )}

              {adjustments.length > 0 ? (
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
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No qualitative adjustments yet. Analyze your notes above.
                </p>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-medium">Adjusted Risk Score</span>
                <span className={`font-mono text-lg font-bold ${
                  adjustedScore <= 40 ? "text-success" : adjustedScore <= 70 ? "text-warning" : "text-destructive"
                }`}>
                  {adjustedScore}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
