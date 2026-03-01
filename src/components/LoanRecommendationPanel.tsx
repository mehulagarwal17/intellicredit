import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanRecommendation } from "@/types/evaluation";
import { CheckCircle, AlertTriangle, XCircle, IndianRupee, Percent, FileText } from "lucide-react";

interface Props {
  recommendation: LoanRecommendation;
}

function formatCr(amount: number) {
  return `₹${(amount / 10000000).toFixed(1)} Cr`;
}

export function LoanRecommendationPanel({ recommendation: rec }: Props) {
  const icon = rec.riskCategory === "low"
    ? <CheckCircle className="h-6 w-6 text-success" />
    : rec.riskCategory === "medium"
    ? <AlertTriangle className="h-6 w-6 text-warning" />
    : <XCircle className="h-6 w-6 text-destructive" />;

  const decision = rec.riskCategory === "low"
    ? "Approve"
    : rec.riskCategory === "medium"
    ? "Conditional Approve"
    : "Reject / Minimal Secured";

  const decisionColor = rec.riskCategory === "low"
    ? "text-success"
    : rec.riskCategory === "medium"
    ? "text-warning"
    : "text-destructive";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Decision Banner */}
      <Card className={`shadow-elevated border-2 ${
        rec.riskCategory === "low" ? "border-success/30" : rec.riskCategory === "medium" ? "border-warning/30" : "border-destructive/30"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {icon}
            <div>
              <p className={`text-xl font-bold ${decisionColor}`}>{decision}</p>
              <p className="text-sm text-muted-foreground">Based on composite risk score analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Figures */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <IndianRupee className="h-4 w-4" />
              <span className="text-xs">Recommended Amount</span>
            </div>
            <p className="text-2xl font-bold font-mono">{formatCr(rec.recommendedAmount)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {rec.approvalPercentage}% of {formatCr(rec.requestedAmount)} requested
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Percent className="h-4 w-4" />
              <span className="text-xs">Suggested Interest Rate</span>
            </div>
            <p className="text-2xl font-bold font-mono">{rec.suggestedInterestRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Base: {rec.baseRate}% + Premium: {rec.riskPremium}%
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Risk Premium</span>
            </div>
            <p className="text-2xl font-bold font-mono">{rec.riskPremium}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">{(rec.riskPremium * 100).toFixed(0)} bps over base rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <span className="text-xs">Approval %</span>
            </div>
            <p className="text-2xl font-bold font-mono">{rec.approvalPercentage}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">Of requested loan amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Rationale */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Recommendation Rationale</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{rec.rationale}</p>
        </CardContent>
      </Card>
    </div>
  );
}
