import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RiskScore } from "@/types/evaluation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  score: RiskScore;
}

function getRiskCategory(score: number) {
  if (score <= 40) return { label: "Low Risk", colorClass: "text-risk-low", bgClass: "bg-risk-low-bg" };
  if (score <= 70) return { label: "Medium Risk", colorClass: "text-risk-medium", bgClass: "bg-risk-medium-bg" };
  return { label: "High Risk", colorClass: "text-risk-high", bgClass: "bg-risk-high-bg" };
}

export function RiskScorePanel({ score }: Props) {
  const category = getRiskCategory(score.overall);

  const chartData = [
    { name: "Financial", weighted: score.components.financialStrength.weighted, raw: score.components.financialStrength.score },
    { name: "Compliance", weighted: score.components.complianceHealth.weighted, raw: score.components.complianceHealth.score },
    { name: "Litigation", weighted: score.components.litigationNews.weighted, raw: score.components.litigationNews.score },
    { name: "Qualitative", weighted: score.components.qualitativeAssessment.weighted, raw: score.components.qualitativeAssessment.score },
  ];

  const barColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Score */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className={`flex items-center justify-center h-24 w-24 rounded-full ${category.bgClass}`}>
              <span className={`text-3xl font-bold font-mono ${category.colorClass}`}>{score.overall}</span>
            </div>
            <div>
              <p className={`text-lg font-semibold ${category.colorClass}`}>{category.label}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Composite risk score computed from 4 weighted factors
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                0–40: Low Risk | 41–70: Medium Risk | 71–100: High Risk
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contribution Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Score Contribution Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [value.toFixed(1), name === "weighted" ? "Weighted Score" : "Raw Score"]}
                  />
                  <Bar dataKey="weighted" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={barColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Factor Details */}
            <div className="mt-4 space-y-2">
              {Object.entries(score.components).map(([key, comp]) => (
                <div key={key} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/30">
                  <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="font-mono">
                    {comp.score}/100 × {comp.weight}% = <span className="font-semibold">{comp.weighted.toFixed(1)}</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Risk Drivers */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Top 5 Risk Drivers</CardTitle>
            <CardDescription>Key factors contributing to the risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {score.topDrivers.map((driver, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg border bg-muted/20">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{driver}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Trail */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Calculation Trail (Explainability)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/30 font-mono text-xs space-y-1 leading-relaxed">
            <p>Total Risk Score = Σ (Component Score × Weight)</p>
            <p>= ({score.components.financialStrength.score} × 0.40) + ({score.components.complianceHealth.score} × 0.25) + ({score.components.litigationNews.score} × 0.20) + ({score.components.qualitativeAssessment.score} × 0.15)</p>
            <p>= {score.components.financialStrength.weighted.toFixed(1)} + {score.components.complianceHealth.weighted.toFixed(1)} + {score.components.litigationNews.weighted.toFixed(1)} + {score.components.qualitativeAssessment.weighted.toFixed(1)}</p>
            <p className="font-bold pt-1">= {score.overall.toFixed(1)} → {getRiskCategory(score.overall).label}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
