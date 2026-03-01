import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialData, RiskScore, LoanRecommendation } from "@/types/evaluation";
import { Separator } from "@/components/ui/separator";

interface Props {
  company: string;
  industry: string;
  financials: FinancialData;
  riskScore: RiskScore;
  recommendation: LoanRecommendation;
}

function formatCr(amount: number) {
  return `₹${(amount / 10000000).toFixed(1)} Cr`;
}

export function CAMPreview({ company, industry, financials, riskScore, recommendation }: Props) {
  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="shadow-elevated">
        <CardContent className="pt-8 pb-8 max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 pb-6 border-b">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Confidential</p>
            <h1 className="text-2xl font-bold">Credit Appraisal Memorandum</h1>
            <p className="text-lg font-medium text-primary">{company}</p>
            <p className="text-sm text-muted-foreground">{industry} • Generated {new Date().toLocaleDateString("en-IN")}</p>
          </div>

          {/* Executive Summary */}
          <section>
            <h2 className="text-base font-bold mb-3">1. Executive Summary</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This Credit Appraisal Memo evaluates the creditworthiness of {company} operating in the {industry} sector.
              The company has requested a loan facility of {formatCr(recommendation.requestedAmount)}. Based on comprehensive
              financial analysis, compliance review, litigation assessment, and qualitative due diligence, the overall risk
              score is determined to be <span className="font-semibold text-foreground">{riskScore.overall}/100</span> (
              {riskScore.overall <= 40 ? "Low" : riskScore.overall <= 70 ? "Medium" : "High"} Risk).
            </p>
          </section>

          <Separator />

          {/* Five Cs */}
          <section>
            <h2 className="text-base font-bold mb-3">2. Five Cs of Credit Assessment</h2>
            <div className="space-y-3">
              {[
                { title: "Character", desc: "Promoter track record and management integrity assessed through public records, litigation history, and market reputation analysis." },
                { title: "Capacity", desc: `DSCR of ${financials.dscr.toFixed(2)} indicates ${financials.dscr >= 1.2 ? "adequate" : "strained"} debt servicing capacity. Revenue trend shows ${financials.revenueGrowth[financials.revenueGrowth.length - 1] >= 0 ? "positive" : "negative"} growth trajectory.` },
                { title: "Capital", desc: `Debt-to-Equity ratio of ${financials.debtToEquity.toFixed(2)} is ${financials.debtToEquity <= 2 ? "within acceptable" : "above recommended"} limits. EBITDA margin at ${financials.ebitdaMargin.toFixed(1)}%.` },
                { title: "Collateral", desc: "Collateral offered has been assessed for adequacy. Secured lending recommended with appropriate coverage ratio." },
                { title: "Conditions", desc: `The ${industry} sector is subject to regulatory oversight. Current macro conditions and sector-specific risks have been factored into the risk assessment.` },
              ].map((c) => (
                <div key={c.title} className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-sm font-semibold mb-1">{c.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Financial Summary */}
          <section>
            <h2 className="text-base font-bold mb-3">3. Financial Analysis Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Latest Revenue", value: `₹${financials.revenue[financials.revenue.length - 1].value} Cr` },
                { label: "EBITDA", value: `₹${financials.ebitda} Cr` },
                { label: "Net Profit", value: `₹${financials.netProfit} Cr` },
                { label: "Debt-to-Equity", value: financials.debtToEquity.toFixed(2) },
                { label: "DSCR", value: financials.dscr.toFixed(2) },
                { label: "Current Ratio", value: financials.currentRatio.toFixed(2) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm py-1.5 px-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Risk Score */}
          <section>
            <h2 className="text-base font-bold mb-3">4. Risk Score Breakdown</h2>
            <div className="space-y-2">
              {Object.entries(riskScore.components).map(([key, comp]) => (
                <div key={key} className="flex justify-between text-sm py-1.5 px-2 rounded bg-muted/30">
                  <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="font-mono">{comp.score}/100 (Weight: {comp.weight}%) = {comp.weighted.toFixed(1)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-2 px-2 rounded bg-primary/5 border border-primary/20 font-semibold">
                <span>Overall Risk Score</span>
                <span className="font-mono">{riskScore.overall}/100</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* Recommendation */}
          <section>
            <h2 className="text-base font-bold mb-3">5. Final Recommendation</h2>
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Recommended Amount</p>
                  <p className="text-lg font-bold font-mono">{formatCr(recommendation.recommendedAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                  <p className="text-lg font-bold font-mono">{recommendation.suggestedInterestRate}%</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{recommendation.rationale}</p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-6 border-t">
            <p className="text-[10px] text-muted-foreground">
              This document is system-generated by IntelliCredit AI Engine. All computations are explainable and auditable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
