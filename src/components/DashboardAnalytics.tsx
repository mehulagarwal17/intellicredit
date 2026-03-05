import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface EvalRow {
  id: string;
  company_name: string;
  industry: string;
  loan_amount_requested: number;
  risk_score: number | null;
  status: string;
  updated_at: string;
}

export function DashboardAnalytics({ evaluations }: { evaluations: EvalRow[] }) {
  // Risk distribution
  const riskDist = [
    { name: "Low (0-40)", value: evaluations.filter((e) => e.risk_score !== null && e.risk_score <= 40).length, color: "hsl(var(--risk-low))" },
    { name: "Medium (41-70)", value: evaluations.filter((e) => e.risk_score !== null && e.risk_score > 40 && e.risk_score <= 70).length, color: "hsl(var(--risk-medium))" },
    { name: "High (71-100)", value: evaluations.filter((e) => e.risk_score !== null && e.risk_score > 70).length, color: "hsl(var(--risk-high))" },
    { name: "Pending", value: evaluations.filter((e) => e.risk_score === null).length, color: "hsl(var(--muted-foreground))" },
  ].filter((d) => d.value > 0);

  // Industry breakdown
  const industryMap = new Map<string, { count: number; totalAmount: number }>();
  evaluations.forEach((e) => {
    const existing = industryMap.get(e.industry) || { count: 0, totalAmount: 0 };
    industryMap.set(e.industry, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + e.loan_amount_requested,
    });
  });
  const industryData = Array.from(industryMap.entries())
    .map(([name, d]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, count: d.count, amount: Math.round(d.totalAmount / 10000000) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Portfolio total
  const totalPortfolio = evaluations.reduce((s, e) => s + e.loan_amount_requested, 0);
  const avgRisk = evaluations.filter((e) => e.risk_score !== null).length > 0
    ? Math.round(evaluations.filter((e) => e.risk_score !== null).reduce((s, e) => s + (e.risk_score || 0), 0) / evaluations.filter((e) => e.risk_score !== null).length)
    : 0;

  if (evaluations.length === 0) return null;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Risk Distribution Pie */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDist} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                  {riskDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {riskDist.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[10px] text-muted-foreground">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Breakdown Bar */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">By Industry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} name="Evaluations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/30 border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Exposure</p>
            <p className="text-2xl font-bold font-mono">₹{(totalPortfolio / 10000000).toFixed(1)} Cr</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Risk Score</p>
            <p className={`text-2xl font-bold font-mono ${avgRisk <= 40 ? "text-success" : avgRisk <= 70 ? "text-warning" : "text-destructive"}`}>
              {avgRisk}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl font-bold font-mono">
              {evaluations.length > 0 ? Math.round((evaluations.filter((e) => e.status === "completed").length / evaluations.length) * 100) : 0}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
