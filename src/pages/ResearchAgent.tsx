import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockNewsItems, mockRiskScore } from "@/data/mockData";
import { AlertTriangle, TrendingDown, TrendingUp, Plus, Search } from "lucide-react";

const qualitativeKeywords: Record<string, number> = {
  "low capacity": 5,
  "promoter dispute": 7,
  "regulatory compliance delay": 5,
  "management turnover": 4,
  "audit qualification": 6,
  "debt restructuring": 8,
  "fraud allegation": 10,
};

export default function ResearchAgent() {
  const [notes, setNotes] = useState("");
  const [adjustments, setAdjustments] = useState<{ keyword: string; impact: number }[]>([]);
  const [baseScore] = useState(mockRiskScore.overall);

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
  const adjustedScore = Math.min(100, baseScore + totalAdjustment);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Research Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Market intelligence, litigation monitoring, and qualitative risk analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* News Feed */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Latest Market Intelligence</CardTitle>
            <CardDescription>Simulated news feed and sector alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockNewsItems.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-lg border bg-muted/20">
                <div className="shrink-0 mt-0.5">
                  {item.sentiment === "negative" ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-success" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{item.headline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{item.source}</span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground">{item.date}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        item.sentiment === "negative" ? "text-destructive" : "text-success"
                      }`}
                    >
                      {item.sentiment}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Due Diligence Notes */}
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
                  adjustedScore <= 40 ? "text-risk-low" : adjustedScore <= 70 ? "text-risk-medium" : "text-risk-high"
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
