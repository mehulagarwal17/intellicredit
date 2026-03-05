# 🚀 IntelliCredit

### AI-Powered Credit Intelligence Platform for Corporate Lending

<p align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38BDF8?style=for-the-badge&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)

</p>

<p align="center">
AI-driven platform that automates corporate credit evaluation, financial analysis, and risk scoring to help lenders make faster and smarter decisions.
</p>

---

# 🧠 Overview

**IntelliCredit** is a modern fintech platform designed to streamline the **corporate credit evaluation workflow**.

Traditional credit assessment requires manual review of financial documents, compliance reports, and risk factors. IntelliCredit automates this entire pipeline using intelligent document processing, financial analytics, and automated credit scoring.

Deployed Link: https://intellicredit.lovable.app/

The platform helps financial institutions:

* Reduce credit evaluation time
* Improve risk visibility
* Automate financial analysis
* Generate structured credit appraisal reports
* Track the full credit decision workflow

---

# ✨ Core Features

## 🤖 AI-Driven Financial Analysis

Automatically analyze company financial health.

Capabilities include:

* Financial ratio analysis
* Debt service coverage evaluation
* Liquidity analysis
* Risk-based interest rate suggestions
* Automated lending recommendations

Key metrics analyzed:

* DSCR
* Debt-to-Equity
* Current Ratio
* EBITDA margins
* Profitability trends

---

## 📄 Intelligent Document Processing

Upload financial documents and extract structured financial data automatically.

Supported inputs:

* Annual reports
* GST filings
* Bank statements
* Rating reports
* Legal documents

Capabilities:

* Financial data extraction
* GST vs bank statement reconciliation
* Structured data normalization
* Automated financial summaries

---

## ⚠️ Risk Scoring Engine

Multi-factor credit risk evaluation.

Risk signals considered:

* Financial strength
* Compliance signals
* Litigation risks
* Market sentiment
* Management quality indicators

Output includes:

* Risk category (Low / Medium / High)
* Weighted risk score
* Lending decision recommendations

---

## 🔁 Credit Workflow Management

Track every stage of the credit lifecycle.

Workflow stages:

Draft → In Progress → Under Review → Approved / Rejected

Features include:

* Role-based access control
* Workflow history tracking
* Evaluation comments
* Approval pipeline
* Activity timeline

---

## 🧠 Research Intelligence Agent

Collects external intelligence about evaluated companies.

Includes:

* News aggregation
* Sentiment analysis
* Market perception tracking
* Risk signal detection

---

## 📊 Credit Intelligence Dashboard

Interactive dashboards provide real-time insights.

Capabilities:

* Evaluation summaries
* Financial metrics visualization
* Risk dashboards
* CAM (Credit Appraisal Memo) generation
* Exportable reports

---

## 🔔 Notification System

Stay updated on evaluation progress.

Notifications include:

* Workflow updates
* Evaluation status changes
* Team collaboration alerts
* System events

---

# 🛠 Tech Stack

| Layer              | Technologies            |
| ------------------ | ----------------------- |
| Frontend           | React, TypeScript, Vite |
| Styling            | Tailwind CSS, shadcn/ui |
| Backend            | Supabase                |
| Database           | PostgreSQL              |
| Edge Functions     | Deno                    |
| Data Visualization | Recharts                |
| Animation          | Framer Motion           |
| Reporting          | jsPDF, html2canvas      |

---

# 🏗 System Architecture

Frontend
React + TypeScript + Vite

↓

Backend Services
Supabase + Edge Functions

↓

Database
PostgreSQL (with Row Level Security)

↓

AI Processing Layer
Financial Analysis
Risk Scoring Engine
Document Extraction

---

# 🗄 Database Design

Core entities:

companies
evaluations
uploaded_documents
extracted_financials
risk_scores
loan_recommendations
workflow_history
evaluation_comments
audit_logs
notifications

User management:

profiles
user_roles

---

# ⚙️ Edge Functions

Serverless functions power the intelligence layer.

Functions include:

**analyze-document**

Extract structured financial data from uploaded documents.

**compute-risk-score**

Generate weighted credit risk scores based on financial metrics.

**process-financials**

Normalize extracted financial metrics and prepare them for analysis.

---

# 📂 Project Structure

src/

assets/ – static assets

components/ – reusable UI components

components/ui/ – shadcn UI primitives

hooks/ – custom React hooks

integrations/ – Supabase client setup

pages/ – application pages

types/ – TypeScript definitions

lib/ – utility functions

supabase/

functions/ – edge functions

---

# 🚀 Getting Started

## Prerequisites

You will need:

* Node.js 18+
* npm or yarn

---

## Installation

Clone the repository.
'''
git clone https://github.com/mehulagarwal17/intellicredit.git

cd intellicredit
'''
Install dependencies.

'''
npm install
'''
Start the development server.

'''
npm run dev
'''
The application will run at:

http://localhost:5173

---

# 🧪 Available Scripts

npm run dev – start development server

npm run build – create production build

npm run preview – preview production build

npm run lint – lint project code

npm run test – run tests

---

# 🎯 Use Cases

IntelliCredit can be used for:

* Corporate lending evaluation
* Financial risk assessment
* Automated credit appraisal workflows
* Financial intelligence dashboards
* Regulatory reporting preparation

---

# 📌 Future Roadmap

Planned enhancements include:

* AI-based financial forecasting
* Fraud detection signals
* Portfolio risk analytics
* Multi-bank data integrations
* Advanced underwriting models

---

# 👨‍💻 Author

**Mehul Agarwal**

Focused on building systems at the intersection of:

AI
Finance
Data Intelligence

---

# 📜 License

This project is licensed under the MIT License.

---

# ⭐ Support

If you find this project useful, consider giving it a star on GitHub.
