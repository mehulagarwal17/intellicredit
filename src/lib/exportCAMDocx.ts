import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import { FinancialData, RiskScore, LoanRecommendation } from "@/types/evaluation";

function formatCr(amount: number) {
  return `₹${(amount / 10000000).toFixed(1)} Cr`;
}

function riskLabel(score: number) {
  if (score <= 40) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
} as const;

function cell(text: string, bold = false, shading?: string) {
  return new TableCell({
    borders: BORDER,
    shading: shading ? { type: ShadingType.SOLID, color: shading } : undefined,
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, bold, size: 20, font: "Calibri" })],
      }),
    ],
  });
}

function kvRow(label: string, value: string) {
  return new TableRow({
    children: [
      cell(label, false, "F5F5F5"),
      cell(value, true),
    ],
  });
}

export async function exportCAMDocx(
  company: string,
  industry: string,
  financials: FinancialData,
  riskScore: RiskScore,
  recommendation: LoanRecommendation
) {
  const date = new Date().toLocaleDateString("en-IN");
  const riskLevel = riskLabel(riskScore.overall);

  const fiveCs = [
    { title: "Character", desc: "Promoter track record and management integrity assessed through public records, litigation history, and market reputation analysis." },
    { title: "Capacity", desc: `DSCR of ${financials.dscr.toFixed(2)} indicates ${financials.dscr >= 1.2 ? "adequate" : "strained"} debt servicing capacity. Revenue trend shows ${financials.revenueGrowth[financials.revenueGrowth.length - 1] >= 0 ? "positive" : "negative"} growth trajectory.` },
    { title: "Capital", desc: `Debt-to-Equity ratio of ${financials.debtToEquity.toFixed(2)} is ${financials.debtToEquity <= 2 ? "within acceptable" : "above recommended"} limits. EBITDA margin at ${financials.ebitdaMargin.toFixed(1)}%.` },
    { title: "Collateral", desc: "Collateral offered has been assessed for adequacy. Secured lending recommended with appropriate coverage ratio." },
    { title: "Conditions", desc: `The ${industry} sector is subject to regulatory oversight. Current macro conditions and sector-specific risks have been factored into the risk assessment.` },
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [
      {
        children: [
          // Header
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "CONFIDENTIAL", size: 16, color: "888888", font: "Calibri", allCaps: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "Credit Appraisal Memorandum", bold: true, size: 36, font: "Calibri" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: company, bold: true, size: 28, font: "Calibri", color: "1a56db" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `${industry} • Generated ${date}`, size: 20, color: "666666", font: "Calibri" })] }),

          // 1. Executive Summary
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 }, children: [new TextRun({ text: "1. Executive Summary", bold: true })] }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `This Credit Appraisal Memo evaluates the creditworthiness of ${company} operating in the ${industry} sector. The company has requested a loan facility of ${formatCr(recommendation.requestedAmount)}. Based on comprehensive financial analysis, compliance review, litigation assessment, and qualitative due diligence, the overall risk score is determined to be ` }),
              new TextRun({ text: `${riskScore.overall}/100 (${riskLevel} Risk)`, bold: true }),
              new TextRun({ text: "." }),
            ],
          }),

          // 2. Five Cs
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 }, children: [new TextRun({ text: "2. Five Cs of Credit Assessment", bold: true })] }),
          ...fiveCs.flatMap((c) => [
            new Paragraph({ spacing: { before: 100, after: 40 }, children: [new TextRun({ text: c.title, bold: true, size: 22 })] }),
            new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: c.desc, size: 20, color: "444444" })] }),
          ]),

          // 3. Financial Analysis
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "3. Financial Analysis Summary", bold: true })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              kvRow("Latest Revenue", `₹${financials.revenue[financials.revenue.length - 1].value} Cr`),
              kvRow("EBITDA", `₹${financials.ebitda} Cr`),
              kvRow("Net Profit", `₹${financials.netProfit} Cr`),
              kvRow("Debt-to-Equity", financials.debtToEquity.toFixed(2)),
              kvRow("DSCR", financials.dscr.toFixed(2)),
              kvRow("Current Ratio", financials.currentRatio.toFixed(2)),
              kvRow("EBITDA Margin", `${financials.ebitdaMargin.toFixed(1)}%`),
            ],
          }),

          // 4. Risk Score
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "4. Risk Score Breakdown", bold: true })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [cell("Component", true, "E8E8E8"), cell("Score", true, "E8E8E8"), cell("Weight", true, "E8E8E8"), cell("Weighted", true, "E8E8E8")],
              }),
              ...Object.entries(riskScore.components).map(([key, comp]) =>
                new TableRow({
                  children: [
                    cell(key.replace(/([A-Z])/g, " $1").trim()),
                    cell(`${comp.score}/100`),
                    cell(`${comp.weight}%`),
                    cell(comp.weighted.toFixed(1)),
                  ],
                })
              ),
              new TableRow({
                children: [
                  cell("Overall Risk Score", true, "EBF5FF"),
                  cell(`${riskScore.overall}/100`, true, "EBF5FF"),
                  cell("100%", true, "EBF5FF"),
                  cell(`${riskScore.overall.toFixed(1)}`, true, "EBF5FF"),
                ],
              }),
            ],
          }),

          // 5. Recommendation
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "5. Final Recommendation", bold: true })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              kvRow("Risk Category", `${riskLevel} Risk`),
              kvRow("Requested Amount", formatCr(recommendation.requestedAmount)),
              kvRow("Recommended Amount", formatCr(recommendation.recommendedAmount)),
              kvRow("Approval %", `${recommendation.approvalPercentage}%`),
              kvRow("Suggested Interest Rate", `${recommendation.suggestedInterestRate}%`),
              kvRow("Base Rate", `${recommendation.baseRate}%`),
              kvRow("Risk Premium", `${recommendation.riskPremium}%`),
            ],
          }),
          new Paragraph({ spacing: { before: 120, after: 200 }, children: [new TextRun({ text: recommendation.rationale, size: 20, color: "444444" })] }),

          // Footer
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [new TextRun({ text: "This document is system-generated by IntelliCredit AI Engine. All computations are explainable and auditable.", size: 16, color: "999999", italics: true })],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `CAM_${company.replace(/\s+/g, "_")}.docx`);
}
