import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockEvaluations } from "@/data/mockData";

function getRiskColor(score: number) {
  if (score <= 40) return "risk-low";
  if (score <= 70) return "risk-medium";
  return "risk-high";
}

function getRiskBg(score: number) {
  if (score <= 40) return "bg-risk-low-bg";
  if (score <= 70) return "bg-risk-medium-bg";
  return "bg-risk-high-bg";
}

function getRiskLabel(score: number) {
  if (score <= 40) return "Low Risk";
  if (score <= 70) return "Medium Risk";
  return "High Risk";
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filtered = mockEvaluations.filter(
    (e) =>
      e.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockEvaluations.length,
    completed: mockEvaluations.filter((e) => e.status === "completed").length,
    inProgress: mockEvaluations.filter((e) => e.status === "in-progress").length,
    highRisk: mockEvaluations.filter((e) => e.riskScore > 70).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Credit Evaluations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage corporate loan assessments
          </p>
        </div>
        <Button onClick={() => navigate("/new-evaluation")} className="gap-2">
          <Plus className="h-4 w-4" />
          Start New Evaluation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Evaluations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.highRisk}</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search company or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Evaluations Table */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Evaluations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Industry</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Loan Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Risk Score</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Updated</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((evaluation) => (
                  <tr
                    key={evaluation.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/evaluation/${evaluation.id}`)}
                  >
                    <td className="py-3 px-4 font-medium">{evaluation.companyName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{evaluation.industry}</td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {formatCurrency(evaluation.loanAmountRequested)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRiskBg(evaluation.riskScore)} ${getRiskColor(evaluation.riskScore)}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full bg-current`}
                        />
                        {evaluation.riskScore} – {getRiskLabel(evaluation.riskScore)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={evaluation.status === "completed" ? "default" : "secondary"}
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {evaluation.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {evaluation.lastUpdated}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
