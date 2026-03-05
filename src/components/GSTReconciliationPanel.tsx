import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import {
  Upload, PlayCircle, Loader2, AlertTriangle, CheckCircle, ShieldAlert, ArrowUpDown, FileText,
} from "lucide-react";

interface Props {
  evaluationId: string;
}

type MonthlyDiff = {
  month: string;
  gstr2a_taxable: number;
  gstr3b_taxable: number;
  value_diff: number;
  value_diff_pct: number;
  gstr2a_tax: number;
  gstr3b_tax: number;
  tax_diff: number;
  tax_diff_pct: number;
  itc_claimed: number;
  itc_available: number;
  itc_excess: number;
  flagged: boolean;
};

type ReconciliationResult = {
  gstr2a: any;
  gstr3b: any;
  reconciliation: {
    monthly: MonthlyDiff[];
    summary: {
      total_2a_taxable: number;
      total_3b_taxable: number;
      total_2a_tax: number;
      total_3b_tax: number;
      overall_value_mismatch_pct: number;
      total_mismatch_tax: number;
      total_mismatch_value: number;
      flagged_months: number;
      total_months: number;
      total_itc_excess: number;
    };
    risk_assessment: {
      risk_level: "low" | "medium" | "high";
      risk_score_impact: number;
      observations: string[];
    };
  };
};

function formatLakh(n: number) {
  return `₹${(n / 100000).toFixed(2)}L`;
}

export function GSTReconciliationPanel({ evaluationId }: Props) {
  const [gstr2aText, setGstr2aText] = useState("");
  const [gstr3bText, setGstr3bText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);

  const handleReconcile = async (mode: "parse" | "simulate") => {
    setLoading(true);
    try {
      const body: any = { evaluation_id: evaluationId, mode };
      if (mode === "parse") {
        if (!gstr2aText.trim() && !gstr3bText.trim()) {
          toast.error("Paste GSTR-2A and/or GSTR-3B data");
          setLoading(false);
          return;
        }
        body.gstr2a_text = gstr2aText;
        body.gstr3b_text = gstr3bText;
      }

      const { data, error } = await supabase.functions.invoke("reconcile-gst", { body });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Reconciliation failed");

      setResult(data);
      toast.success("GST reconciliation complete");
    } catch (err: any) {
      console.error("GST reconcile error:", err);
      toast.error(err.message || "Failed to reconcile");
    } finally {
      setLoading(false);
    }
  };

  const recon = result?.reconciliation;
  const summary = recon?.summary;
  const risk = recon?.risk_assessment;

  const chartData = recon?.monthly.map((m) => ({
    month: m.month.replace("-2024", "").replace("-2025", "'25"),
    "2A Taxable": Math.round(m.gstr2a_taxable / 100000),
    "3B Taxable": Math.round(m.gstr3b_taxable / 100000),
    "Mismatch %": m.value_diff_pct,
  })) || [];

  const itcChartData = recon?.monthly.map((m) => ({
    month: m.month.replace("-2024", "").replace("-2025", "'25"),
    "ITC Available (2A)": Math.round(m.itc_available / 1000),
    "ITC Claimed (3B)": Math.round(m.itc_claimed / 1000),
    "Excess": Math.round(m.itc_excess / 1000),
  })) || [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Input Section */}
      {!result && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              GSTR-2A vs 3B Reconciliation
            </CardTitle>
            <CardDescription>
              Paste GSTR-2A and GSTR-3B data to identify ITC mismatches, or simulate demo data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  GSTR-2A Data (Auto-populated Inward Supplies)
                </label>
                <Textarea
                  value={gstr2aText}
                  onChange={(e) => setGstr2aText(e.target.value)}
                  placeholder="Paste GSTR-2A data here (CSV, table, or raw text from GST portal)..."
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  GSTR-3B Data (Self-declared Summary)
                </label>
                <Textarea
                  value={gstr3bText}
                  onChange={(e) => setGstr3bText(e.target.value)}
                  placeholder="Paste GSTR-3B data here (CSV, table, or raw text from GST portal)..."
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleReconcile("parse")} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Reconcile GST Data
              </Button>
              <Button variant="outline" onClick={() => handleReconcile("simulate")} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Simulate Demo Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && recon && summary && risk && (
        <>
          {/* Risk Assessment Banner */}
          <Card className={`shadow-card border-2 ${
            risk.risk_level === "high" ? "border-destructive/30 bg-destructive/5" :
            risk.risk_level === "medium" ? "border-warning/30 bg-warning/5" :
            "border-success/30 bg-success/5"
          }`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {risk.risk_level === "high" ? <ShieldAlert className="h-6 w-6 text-destructive" /> :
                   risk.risk_level === "medium" ? <AlertTriangle className="h-6 w-6 text-warning" /> :
                   <CheckCircle className="h-6 w-6 text-success" />}
                  <div>
                    <p className="font-semibold">GST Reconciliation: {risk.risk_level.toUpperCase()} RISK</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Overall mismatch: {summary.overall_value_mismatch_pct}% • {summary.flagged_months}/{summary.total_months} months flagged • Risk impact: +{risk.risk_score_impact} pts
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> New Reconciliation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="shadow-card">
              <CardContent className="pt-4 pb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">2A Taxable Value</p>
                <p className="text-lg font-bold font-mono mt-1">{formatLakh(summary.total_2a_taxable)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-4 pb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">3B Taxable Value</p>
                <p className="text-lg font-bold font-mono mt-1">{formatLakh(summary.total_3b_taxable)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-4 pb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Value Mismatch</p>
                <p className={`text-lg font-bold font-mono mt-1 ${
                  summary.overall_value_mismatch_pct > 10 ? "text-destructive" : "text-success"
                }`}>{summary.overall_value_mismatch_pct}%</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-4 pb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Excess ITC Claimed</p>
                <p className={`text-lg font-bold font-mono mt-1 ${
                  summary.total_itc_excess > 0 ? "text-destructive" : "text-success"
                }`}>{summary.total_itc_excess > 0 ? formatLakh(summary.total_itc_excess) : "None"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Observations */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">AI Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {risk.observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 mt-0.5">
                      {obs.includes("Significant") || obs.includes("Excess") ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      ) : obs.includes("Moderate") || obs.includes("flagged") ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                      )}
                    </span>
                    <span className="text-muted-foreground">{obs}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Charts */}
          <Tabs defaultValue="comparison" className="space-y-3">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="comparison" className="text-xs">Taxable Value Comparison</TabsTrigger>
              <TabsTrigger value="itc" className="text-xs">ITC Analysis</TabsTrigger>
              <TabsTrigger value="table" className="text-xs">Detailed Table</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison">
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monthly Taxable Value — 2A vs 3B (₹ Lakhs)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="2A Taxable" fill="hsl(220, 70%, 55%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="3B Taxable" fill="hsl(280, 60%, 55%)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="itc">
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">ITC Available vs Claimed (₹ Thousands)</CardTitle>
                  <CardDescription>Red bars indicate excess ITC claimed beyond 2A availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={itcChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                        <Bar dataKey="ITC Available (2A)" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="ITC Claimed (3B)" fill="hsl(220, 70%, 55%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Excess" fill="hsl(0, 84%, 60%)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="table">
              <Card className="shadow-card">
                <CardContent className="pt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Month</TableHead>
                        <TableHead className="text-[10px] text-right">2A Taxable</TableHead>
                        <TableHead className="text-[10px] text-right">3B Taxable</TableHead>
                        <TableHead className="text-[10px] text-right">Diff %</TableHead>
                        <TableHead className="text-[10px] text-right">ITC Avail</TableHead>
                        <TableHead className="text-[10px] text-right">ITC Claimed</TableHead>
                        <TableHead className="text-[10px] text-right">Excess ITC</TableHead>
                        <TableHead className="text-[10px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recon.monthly.map((row) => (
                        <TableRow key={row.month} className={row.flagged ? "bg-destructive/5" : ""}>
                          <TableCell className="text-xs font-medium">{row.month}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{formatLakh(row.gstr2a_taxable)}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{formatLakh(row.gstr3b_taxable)}</TableCell>
                          <TableCell className={`text-xs text-right font-mono ${
                            row.value_diff_pct > 10 ? "text-destructive font-bold" : ""
                          }`}>{row.value_diff_pct}%</TableCell>
                          <TableCell className="text-xs text-right font-mono">{formatLakh(row.itc_available)}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{formatLakh(row.itc_claimed)}</TableCell>
                          <TableCell className={`text-xs text-right font-mono ${
                            row.itc_excess > 0 ? "text-destructive font-bold" : ""
                          }`}>{row.itc_excess > 0 ? formatLakh(row.itc_excess) : "—"}</TableCell>
                          <TableCell>
                            {row.flagged ? (
                              <Badge variant="destructive" className="text-[9px]">Flagged</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[9px]">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
