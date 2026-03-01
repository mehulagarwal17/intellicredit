export interface Evaluation {
  id: string;
  companyName: string;
  industry: string;
  loanAmountRequested: number;
  riskScore: number;
  status: "in-progress" | "completed";
  lastUpdated: string;
  createdBy: string;
}

export interface CompanyProfile {
  companyName: string;
  industry: string;
  loanAmountRequested: number;
  existingExposure: number;
  collateralDetails: string;
}

export interface FinancialData {
  revenue: { year: string; value: number }[];
  ebitda: number;
  netProfit: number;
  totalDebt: number;
  currentAssets: number;
  currentLiabilities: number;
  totalEquity: number;
  debtToEquity: number;
  dscr: number;
  ebitdaMargin: number;
  currentRatio: number;
  revenueGrowth: number[];
}

export interface RiskScoreComponent {
  score: number;
  weight: number;
  weighted: number;
}

export interface RiskScore {
  overall: number;
  components: {
    financialStrength: RiskScoreComponent;
    complianceHealth: RiskScoreComponent;
    litigationNews: RiskScoreComponent;
    qualitativeAssessment: RiskScoreComponent;
  };
  topDrivers: string[];
}

export interface LoanRecommendation {
  riskCategory: "low" | "medium" | "high";
  recommendedAmount: number;
  requestedAmount: number;
  approvalPercentage: number;
  suggestedInterestRate: number;
  baseRate: number;
  riskPremium: number;
  rationale: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  date: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  details: string;
}
