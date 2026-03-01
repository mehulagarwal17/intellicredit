import { Evaluation, FinancialData, RiskScore, LoanRecommendation, AuditLogEntry, NewsItem, CompanyProfile } from "@/types/evaluation";

export const mockEvaluations: Evaluation[] = [
  {
    id: "eval-001",
    companyName: "Reliance Infra Ventures Ltd",
    industry: "Infrastructure",
    loanAmountRequested: 50000000,
    riskScore: 32,
    status: "completed",
    lastUpdated: "2026-02-28",
    createdBy: "credit-officer-1",
  },
  {
    id: "eval-002",
    companyName: "Tata Steel Processing",
    industry: "Manufacturing",
    loanAmountRequested: 120000000,
    riskScore: 55,
    status: "completed",
    lastUpdated: "2026-02-27",
    createdBy: "credit-officer-1",
  },
  {
    id: "eval-003",
    companyName: "Bharti AgroTech Pvt Ltd",
    industry: "Agriculture",
    loanAmountRequested: 25000000,
    riskScore: 78,
    status: "completed",
    lastUpdated: "2026-02-25",
    createdBy: "credit-officer-2",
  },
  {
    id: "eval-004",
    companyName: "Wipro Digital Solutions",
    industry: "Technology",
    loanAmountRequested: 80000000,
    riskScore: 28,
    status: "in-progress",
    lastUpdated: "2026-03-01",
    createdBy: "credit-officer-1",
  },
  {
    id: "eval-005",
    companyName: "Godrej Properties East",
    industry: "Real Estate",
    loanAmountRequested: 200000000,
    riskScore: 62,
    status: "in-progress",
    lastUpdated: "2026-02-28",
    createdBy: "credit-officer-1",
  },
];

export const mockFinancialData: FinancialData = {
  revenue: [
    { year: "FY 2024", value: 4500 },
    { year: "FY 2025", value: 5200 },
    { year: "FY 2026", value: 5800 },
  ],
  ebitda: 1160,
  netProfit: 580,
  totalDebt: 2900,
  currentAssets: 2100,
  currentLiabilities: 1400,
  totalEquity: 3200,
  debtToEquity: 0.91,
  dscr: 1.45,
  ebitdaMargin: 20.0,
  currentRatio: 1.5,
  revenueGrowth: [15.6, 11.5],
};

export const mockRiskScore: RiskScore = {
  overall: 42,
  components: {
    financialStrength: { score: 30, weight: 40, weighted: 12 },
    complianceHealth: { score: 45, weight: 25, weighted: 11.25 },
    litigationNews: { score: 55, weight: 20, weighted: 11 },
    qualitativeAssessment: { score: 52, weight: 15, weighted: 7.8 },
  },
  topDrivers: [
    "Moderate debt-to-equity ratio approaching threshold",
    "Two pending litigation cases in NCLT",
    "Industry facing regulatory headwinds",
    "Promoter succession planning uncertainty",
    "GST-Bank credit mismatch of 8.5%",
  ],
};

export const mockLoanRecommendation: LoanRecommendation = {
  riskCategory: "medium",
  recommendedAmount: 36000000,
  requestedAmount: 50000000,
  approvalPercentage: 72,
  suggestedInterestRate: 11.5,
  baseRate: 9.5,
  riskPremium: 2.0,
  rationale:
    "The company demonstrates moderate financial health with stable revenue growth and acceptable debt levels. However, pending litigation and sector headwinds warrant a conservative lending approach. We recommend approving 72% of the requested amount with a 200 bps risk premium over the base rate.",
};

export const mockNewsItems: NewsItem[] = [
  { id: "1", headline: "NCLT admits insolvency plea against subsidiary", source: "Economic Times", date: "2026-02-20", sentiment: "negative" },
  { id: "2", headline: "Company wins ₹120Cr infrastructure contract", source: "Business Standard", date: "2026-02-18", sentiment: "positive" },
  { id: "3", headline: "RBI tightens lending norms for infrastructure sector", source: "Mint", date: "2026-02-15", sentiment: "negative" },
  { id: "4", headline: "Quarterly results show 11.5% revenue growth", source: "MoneyControl", date: "2026-02-10", sentiment: "positive" },
  { id: "5", headline: "Promoter pledges additional 5% shares", source: "LiveMint", date: "2026-02-05", sentiment: "negative" },
];

export const mockAuditLogs: AuditLogEntry[] = [
  { id: "log-1", timestamp: "2026-03-01 10:32:15", user: "Rajesh Kumar", action: "Started new evaluation", entity: "Reliance Infra Ventures", details: "Created evaluation eval-001" },
  { id: "log-2", timestamp: "2026-03-01 10:35:42", user: "Rajesh Kumar", action: "Uploaded documents", entity: "Reliance Infra Ventures", details: "Annual Report FY2026, GST Returns, Bank Statement" },
  { id: "log-3", timestamp: "2026-03-01 10:40:18", user: "System", action: "Document parsing completed", entity: "Reliance Infra Ventures", details: "Extracted financials from 3 documents" },
  { id: "log-4", timestamp: "2026-03-01 10:42:05", user: "System", action: "Financial analysis complete", entity: "Reliance Infra Ventures", details: "Computed 5 financial ratios" },
  { id: "log-5", timestamp: "2026-03-01 10:45:30", user: "Rajesh Kumar", action: "Added due diligence notes", entity: "Reliance Infra Ventures", details: "Added qualitative risk assessment" },
  { id: "log-6", timestamp: "2026-03-01 10:48:12", user: "System", action: "Risk score computed", entity: "Reliance Infra Ventures", details: "Overall risk score: 42/100 (Medium)" },
  { id: "log-7", timestamp: "2026-03-01 10:50:00", user: "System", action: "Loan recommendation generated", entity: "Reliance Infra Ventures", details: "Recommended ₹3.6Cr at 11.5% interest" },
  { id: "log-8", timestamp: "2026-03-01 11:05:22", user: "Rajesh Kumar", action: "Generated CAM report", entity: "Reliance Infra Ventures", details: "Credit Appraisal Memo exported as PDF" },
];
