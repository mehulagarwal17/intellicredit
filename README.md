<p align="center">
  <img src="src/assets/logo.png" alt="IntelliCredit" width="80" />
</p>

<h1 align="center">IntelliCredit</h1>

<p align="center">
  <strong>AI-Powered Credit Decision Support System for Indian Corporate Lending</strong>
</p>

<p align="center">
  <a href="https://intellicredit.lovable.app">Live Demo</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#getting-started">Getting Started</a>
</p>

---

## Overview

IntelliCredit is an enterprise-grade platform that transforms credit evaluation workflows for mid-sized corporate loan applications. It leverages AI to analyze financials, score risk, and generate comprehensive credit memos — reducing decision time from **weeks to hours**.

Built for credit officers, analysts, and risk managers in the Indian financial ecosystem.

## Features

### 🧠 AI-Powered Analysis
- Automated financial ratio analysis (DSCR, D/E, EBITDA margins, current ratio)
- AI-driven risk scoring with weighted multi-factor components
- Intelligent loan recommendations with interest rate suggestions

### 📄 Smart Document Processing
- Upload & parse annual reports, GST filings, bank statements, and legal notices
- Automated data extraction and structuring via edge functions
- GST-bank statement mismatch detection

### 📊 Risk Scoring Engine
- **Financial Strength** — balance sheet & profitability metrics
- **Compliance Health** — GST consistency, regulatory adherence
- **Litigation & News** — active legal case tracking, sentiment analysis
- **Qualitative Assessment** — management quality, industry outlook

### 🔄 Workflow Management
- Full evaluation lifecycle: `Draft → In Progress → Under Review → Approved / Rejected`
- Role-based access control (Admin, Credit Officer, Analyst)
- Workflow history tracking with comments

### 🔍 Research Agent
- AI-powered company research and news aggregation
- Sentiment-tagged news feed integration

### 📈 Dashboard & Reporting
- Real-time analytics with evaluation metrics
- CAM (Credit Appraisal Memo) preview & PDF export
- Comprehensive audit logs for regulatory compliance

### 🔔 Notifications
- Real-time notification system for evaluation updates
- Status change alerts across the workflow

### 🔐 Authentication & Security
- Email-based authentication with verification
- Row-Level Security (RLS) on all database tables
- Role-based access via `user_roles` table with `has_role()` security definer function

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State** | TanStack React Query |
| **Backend** | Lovable Cloud (Supabase) |
| **Database** | PostgreSQL with RLS policies |
| **Edge Functions** | Deno (document analysis, risk scoring, financial processing) |
| **PDF Generation** | jsPDF + html2canvas |
| **Charts** | Recharts |

## Database Schema

```
companies ─────────┐
                    ├── evaluations ──┬── extracted_financials
profiles            │                 ├── risk_scores
user_roles          │                 ├── loan_recommendations
                    │                 ├── uploaded_documents
                    │                 ├── evaluation_comments
                    │                 ├── workflow_history
                    │                 ├── audit_logs
                    │                 └── notifications
```

### Key Enums
- **Evaluation Status:** `draft` · `in_progress` · `under_review` · `completed` · `approved` · `rejected` · `archived`
- **Document Types:** `annual_report` · `gst_data` · `bank_statement` · `legal_notice` · `rating_report`
- **Risk Categories:** `low` · `medium` · `high`
- **User Roles:** `admin` · `credit_officer` · `analyst`

## Edge Functions

| Function | Purpose |
|----------|---------|
| `analyze-document` | Parses uploaded documents and extracts structured data |
| `compute-risk-score` | Calculates weighted risk scores from financial & qualitative data |
| `process-financials` | Processes raw financial data into standardized metrics |

## Getting Started

### Prerequisites
- Node.js 18+ & npm

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd intellicredit

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run lint` | Lint codebase |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── assets/            # Static assets (logo, images)
├── components/        # Reusable UI components
│   ├── ui/            # shadcn/ui primitives
│   ├── AppLayout.tsx  # Authenticated app shell
│   ├── AppSidebar.tsx # Navigation sidebar
│   └── ...            # Feature components
├── data/              # Mock data for development
├── hooks/             # Custom React hooks (auth, toast, mobile)
├── integrations/      # Supabase client & types (auto-generated)
├── pages/             # Route-level page components
│   ├── Landing.tsx    # Marketing landing page
│   ├── Auth.tsx       # Login / signup
│   ├── Dashboard.tsx  # Main dashboard
│   ├── NewEvaluation.tsx
│   ├── EvaluationDetail.tsx
│   ├── ResearchAgent.tsx
│   ├── Reports.tsx
│   ├── AuditLogs.tsx
│   └── Profile.tsx
├── types/             # TypeScript type definitions
└── lib/               # Utility functions
supabase/
└── functions/         # Edge functions (Deno)
```

## License

Private — All rights reserved © 2026 IntelliCredit.
