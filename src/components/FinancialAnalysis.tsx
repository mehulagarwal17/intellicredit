import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { FinancialData } from "@/types/evaluation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: FinancialData;
}

function RatioCard({ label, value, unit, threshold, thresholdLabel, flagCondition }: {
  label: string; value: number; unit?: string; threshold: number; thresholdLabel: string; flagCondition: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border ${flagCondition ? "border-warning/40 bg-warning/5" : "bg-muted/20"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {flagCondition ? (
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
        ) : (
          <CheckCircle className="h-3.5 w-3.5 text-success" />
        )}
      </div>
      <p className="text-xl font-bold font-mono">{value.toFixed(2)}{unit}</p>
      <p className="text-[10px] text-muted-foreground mt-1">Threshold: {thresholdLabel}</p>
    </div>
  );
}

export function FinancialAnalysis({ data }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Revenue Trend */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend (3-Year)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`₹${value} Cr`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(var(--primary))", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ratio Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RatioCard
          label="Debt-to-Equity"
          value={data.debtToEquity}
          threshold={2}
          thresholdLabel="D/E < 2.0"
          flagCondition={data.debtToEquity > 2}
        />
        <RatioCard
          label="DSCR"
          value={data.dscr}
          threshold={1.2}
          thresholdLabel="DSCR > 1.2"
          flagCondition={data.dscr < 1.2}
        />
        <RatioCard
          label="EBITDA Margin"
          value={data.ebitdaMargin}
          unit="%"
          threshold={15}
          thresholdLabel="> 15%"
          flagCondition={data.ebitdaMargin < 15}
        />
        <RatioCard
          label="Current Ratio"
          value={data.currentRatio}
          threshold={1.0}
          thresholdLabel="> 1.0"
          flagCondition={data.currentRatio < 1}
        />
      </div>

      {/* Revenue Growth */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Revenue Growth YoY</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {data.revenueGrowth.map((growth, i) => (
              <div key={i} className="flex-1 p-4 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">Year {i + 1}</p>
                <p className={`text-xl font-bold font-mono ${growth >= 0 ? "text-success" : "text-destructive"}`}>
                  {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
          {data.revenueGrowth.filter((g) => g < 0).length >= 2 && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">Revenue decline for 2+ consecutive years detected</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
