import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { mockFinancialData, mockRiskScore, mockLoanRecommendation, mockEvaluations } from "@/data/mockData";
import { FinancialAnalysis } from "@/components/FinancialAnalysis";
import { RiskScorePanel } from "@/components/RiskScorePanel";
import { LoanRecommendationPanel } from "@/components/LoanRecommendationPanel";
import { CAMPreview } from "@/components/CAMPreview";
import { EvaluationComments } from "@/components/EvaluationComments";
import { WorkflowPanel } from "@/components/WorkflowPanel";

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

type EvalStatus = "draft" | "in_progress" | "under_review" | "approved" | "rejected" | "completed" | "archived";

export default function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const camRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [evalData, setEvalData] = useState<any>(null);
  const [evalStatus, setEvalStatus] = useState<EvalStatus>("draft");
  const [financials, setFinancials] = useState<any>(null);
  const [riskScore, setRiskScore] = useState<any>(null);
  const [loanRec, setLoanRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const mockEval = mockEvaluations.find((e) => e.id === id);
      if (mockEval) {
        setIsMock(true);
        setEvalData({
          companyName: mockEval.companyName,
          industry: mockEval.industry,
          riskScore: mockEval.riskScore,
          loanAmountRequested: mockEval.loanAmountRequested,
        });
        setEvalStatus(mockEval.status === "completed" ? "completed" : "in_progress");
        setFinancials(mockFinancialData);
        setRiskScore(mockRiskScore);
        setLoanRec(mockLoanRecommendation);
        setLoading(false);
        return;
      }

      const { data: evaluation } = await supabase
        .from("evaluations")
        .select("*, companies!inner(name, industry)")
        .eq("id", id)
        .single();

      if (evaluation) {
        setEvalData({
          companyName: (evaluation as any).companies.name,
          industry: (evaluation as any).companies.industry,
          riskScore: evaluation.risk_score ? Number(evaluation.risk_score) : 0,
          loanAmountRequested: Number(evaluation.loan_amount_requested),
        });
        setEvalStatus(evaluation.status as EvalStatus);

        const { data: fin } = await supabase
          .from("extracted_financials")
          .select("*")
          .eq("evaluation_id", id)
          .single();
        if (fin) {
          setFinancials({
            revenue: fin.revenue || [],
            ebitda: Number(fin.ebitda) || 0,
            netProfit: Number(fin.net_profit) || 0,
            totalDebt: Number(fin.total_debt) || 0,
            currentAssets: Number(fin.current_assets) || 0,
            currentLiabilities: Number(fin.current_liabilities) || 0,
            totalEquity: Number(fin.total_equity) || 0,
            debtToEquity: Number(fin.debt_to_equity) || 0,
            dscr: Number(fin.dscr) || 0,
            ebitdaMargin: Number(fin.ebitda_margin) || 0,
            currentRatio: Number(fin.current_ratio) || 0,
            revenueGrowth: (fin.revenue_growth as number[]) || [],
          });
        } else {
          setFinancials(mockFinancialData);
        }

        const { data: risk } = await supabase
          .from("risk_scores")
          .select("*")
          .eq("evaluation_id", id)
          .single();
        if (risk) {
          setRiskScore({
            overall: Number(risk.overall_score),
            components: {
              financialStrength: { score: Number(risk.financial_strength_score), weight: 40, weighted: Number(risk.financial_strength_score) * 0.4 },
              complianceHealth: { score: Number(risk.compliance_health_score), weight: 25, weighted: Number(risk.compliance_health_score) * 0.25 },
              litigationNews: { score: Number(risk.litigation_news_score), weight: 20, weighted: Number(risk.litigation_news_score) * 0.2 },
              qualitativeAssessment: { score: Number(risk.qualitative_score), weight: 15, weighted: Number(risk.qualitative_score) * 0.15 },
            },
            topDrivers: (risk.top_drivers as string[]) || [],
          });
        } else {
          setRiskScore(mockRiskScore);
        }

        const { data: loan } = await supabase
          .from("loan_recommendations")
          .select("*")
          .eq("evaluation_id", id)
          .single();
        if (loan) {
          setLoanRec({
            riskCategory: loan.risk_category,
            recommendedAmount: Number(loan.recommended_amount),
            requestedAmount: Number(loan.requested_amount),
            approvalPercentage: Number(loan.approval_percentage),
            suggestedInterestRate: Number(loan.suggested_interest_rate),
            baseRate: Number(loan.base_rate),
            riskPremium: Number(loan.risk_premium),
            rationale: loan.rationale || "",
          });
        } else {
          setLoanRec(mockLoanRecommendation);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading evaluation...</div>;
  }

  if (!evalData) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Evaluation not found</div>;
  }

  const risk = getRiskCategory(evalData.riskScore);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{evalData.companyName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{evalData.industry}</Badge>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.colorClass}`}>
                Score: {evalData.riskScore} – {risk.label}
              </span>
              <span className="text-xs text-muted-foreground">
                Requested: {formatCurrency(evalData.loanAmountRequested)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="gap-2" disabled={exporting} onClick={async () => {
          setExporting(true);
          try {
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");
            const el = camRef.current;
            if (!el) return;
            const canvas = await html2canvas(el, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/jpeg", 0.98);
            const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;
            pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - 20);
            while (heightLeft > 0) {
              position = -(pageHeight - 20) + 10;
              pdf.addPage();
              pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
              heightLeft -= (pageHeight - 20);
            }
            pdf.save(`CAM_${evalData.companyName.replace(/\s+/g, "_")}.pdf`);
          } finally {
            setExporting(false);
          }
        }}>
          <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CAM"}
        </Button>
      </div>

      {/* Workflow Panel */}
      {!isMock && id && (
        <WorkflowPanel
          evaluationId={id}
          currentStatus={evalStatus}
          onStatusChange={(newStatus) => setEvalStatus(newStatus)}
        />
      )}

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="financial">Financial Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk Scoring</TabsTrigger>
          <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
          <TabsTrigger value="cam">CAM Report</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          {financials && <FinancialAnalysis data={financials} />}
        </TabsContent>

        <TabsContent value="risk">
          {riskScore && <RiskScorePanel score={riskScore} />}
        </TabsContent>

        <TabsContent value="recommendation">
          {loanRec && <LoanRecommendationPanel recommendation={loanRec} />}
        </TabsContent>

        <TabsContent value="cam">
          {financials && riskScore && loanRec && (
            <div ref={camRef}>
              <CAMPreview
                company={evalData.companyName}
                industry={evalData.industry}
                financials={financials}
                riskScore={riskScore}
                recommendation={loanRec}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Comments Section */}
      <EvaluationComments evaluationId={id!} />
    </div>
  );
}
