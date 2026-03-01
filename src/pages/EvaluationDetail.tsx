import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle, CheckCircle, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockFinancialData, mockRiskScore, mockLoanRecommendation, mockEvaluations } from "@/data/mockData";
import { FinancialAnalysis } from "@/components/FinancialAnalysis";
import { RiskScorePanel } from "@/components/RiskScorePanel";
import { LoanRecommendationPanel } from "@/components/LoanRecommendationPanel";
import { CAMPreview } from "@/components/CAMPreview";

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function getRiskCategory(score: number) {
  if (score <= 40) return { label: "Low Risk", colorClass: "text-risk-low bg-risk-low-bg" };
  if (score <= 70) return { label: "Medium Risk", colorClass: "text-risk-medium bg-risk-medium-bg" };
  return { label: "High Risk", colorClass: "text-risk-high bg-risk-high-bg" };
}

export default function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const evaluation = mockEvaluations.find((e) => e.id === id) || mockEvaluations[0];
  const risk = getRiskCategory(evaluation.riskScore);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{evaluation.companyName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{evaluation.industry}</Badge>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.colorClass}`}>
                Score: {evaluation.riskScore} – {risk.label}
              </span>
              <span className="text-xs text-muted-foreground">
                Requested: {formatCurrency(evaluation.loanAmountRequested)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CAM
        </Button>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="financial">Financial Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk Scoring</TabsTrigger>
          <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
          <TabsTrigger value="cam">CAM Report</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <FinancialAnalysis data={mockFinancialData} />
        </TabsContent>

        <TabsContent value="risk">
          <RiskScorePanel score={mockRiskScore} />
        </TabsContent>

        <TabsContent value="recommendation">
          <LoanRecommendationPanel recommendation={mockLoanRecommendation} />
        </TabsContent>

        <TabsContent value="cam">
          <CAMPreview
            company={evaluation.companyName}
            industry={evaluation.industry}
            financials={mockFinancialData}
            riskScore={mockRiskScore}
            recommendation={mockLoanRecommendation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
