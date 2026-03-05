import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingDown, TrendingUp, Minus, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

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

interface Props {
  results: ResearchResult[];
  companyName: string;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "hsl(var(--success, 142 76% 36%))",
  negative: "hsl(var(--destructive))",
  neutral: "hsl(var(--muted-foreground))",
};

const CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  litigation: "Litigation",
  regulatory: "Regulatory",
  financial: "Financial",
  management: "Management",
};

export function SentimentAnalyticsPanel({ results, companyName }: Props) {
  if (results.length === 0) return null;

  // Sentiment distribution
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  results.forEach((r) => sentimentCounts[r.sentiment]++);
  const sentimentData = Object.entries(sentimentCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, fill: SENTIMENT_COLORS[name] }));

  // Category breakdown with sentiment per category
  const categoryMap: Record<string, { positive: number; negative: number; neutral: number }> = {};
  results.forEach((r) => {
    if (!categoryMap[r.category]) categoryMap[r.category] = { positive: 0, negative: 0, neutral: 0 };
    categoryMap[r.category][r.sentiment]++;
  });
  const categoryData = Object.entries(categoryMap).map(([cat, counts]) => ({
    category: CATEGORY_LABELS[cat] || cat,
    Positive: counts.positive,
    Negative: counts.negative,
    Neutral: counts.neutral,
  }));

  // Risk signals
  const riskSignals = results.filter((r) => r.risk_signal);
  const negPct = results.length > 0 ? Math.round((sentimentCounts.negative / results.length) * 100) : 0;
  const posPct = results.length > 0 ? Math.round((sentimentCounts.positive / results.length) * 100) : 0;

  // Determine overall sentiment verdict
  const verdict = negPct >= 50 ? "negative" : posPct >= 50 ? "positive" : "mixed";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sentiment Overview */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {verdict === "negative" ? <ShieldAlert className="h-4 w-4 text-destructive" /> :
             verdict === "positive" ? <ShieldCheck className="h-4 w-4 text-success" /> :
             <AlertTriangle className="h-4 w-4 text-warning" />}
            Sentiment Analysis — {companyName}
          </CardTitle>
          <CardDescription>
            AI-powered sentiment classification across {results.length} articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Sentiment Distribution</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-2">
                {sentimentData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                    <span className="capitalize text-muted-foreground">{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Score Cards */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sentiment Breakdown</p>

              <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-success">{sentimentCounts.positive}</span>
                  <Badge variant="secondary" className="text-[10px]">{posPct}%</Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{sentimentCounts.neutral}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {results.length > 0 ? Math.round((sentimentCounts.neutral / results.length) * 100) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Negative</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-destructive">{sentimentCounts.negative}</span>
                  <Badge variant="secondary" className="text-[10px]">{negPct}%</Badge>
                </div>
              </div>

              {/* Verdict */}
              <div className={`p-3 rounded-lg border-2 text-center ${
                verdict === "negative" ? "border-destructive/30 bg-destructive/5" :
                verdict === "positive" ? "border-success/30 bg-success/5" :
                "border-warning/30 bg-warning/5"
              }`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Overall Sentiment</p>
                <p className={`text-lg font-bold capitalize mt-0.5 ${
                  verdict === "negative" ? "text-destructive" :
                  verdict === "positive" ? "text-success" :
                  "text-warning"
                }`}>
                  {verdict === "mixed" ? "Mixed / Cautious" : verdict}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown Chart */}
      {categoryData.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Category-wise Sentiment</CardTitle>
            <CardDescription>Sentiment distribution across news categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="Positive" stackId="a" fill="hsl(142, 76%, 36%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Neutral" stackId="a" fill="hsl(220, 9%, 56%)" />
                  <Bar dataKey="Negative" stackId="a" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Risk Signals */}
      {riskSignals.length > 0 && (
        <Card className="shadow-card border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Key Risk Signals ({riskSignals.length})
            </CardTitle>
            <CardDescription>Articles flagged as material risk indicators for credit assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskSignals.map((signal, i) => (
                <div key={i} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <p className="text-sm font-medium">{signal.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{signal.summary}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">{signal.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{signal.source} • {signal.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
