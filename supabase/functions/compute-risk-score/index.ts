import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    let userId: string | null = claimsData?.claims?.sub ?? null;
    if (!userId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Auth validation failed", {
          claimsError: claimsError?.message,
          userError: userError?.message,
        });
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      userId = user.id;
    }

    const { evaluation_id, qualitative_notes } = await req.json();

    // Fetch extracted financials
    const { data: financials } = await supabase
      .from("extracted_financials")
      .select("*")
      .eq("evaluation_id", evaluation_id)
      .single();

    // === Financial Strength Score (0-100, lower is better) ===
    let financialScore = 30; // default moderate
    const topDrivers: string[] = [];

    if (financials) {
      const de = financials.debt_to_equity || 0;
      const dscr = financials.dscr || 0;
      const ebitdaMargin = financials.ebitda_margin || 0;
      const currentRatio = financials.current_ratio || 0;

      // D/E scoring
      if (de > 2) { financialScore += 15; topDrivers.push(`High debt-to-equity ratio: ${de.toFixed(2)}`); }
      else if (de > 1.5) { financialScore += 8; topDrivers.push(`Moderate debt-to-equity ratio: ${de.toFixed(2)}`); }
      else { financialScore -= 5; }

      // DSCR scoring
      if (dscr < 1.2) { financialScore += 15; topDrivers.push(`DSCR below threshold: ${dscr.toFixed(2)}`); }
      else if (dscr < 1.5) { financialScore += 5; }
      else { financialScore -= 5; }

      // EBITDA Margin
      if (ebitdaMargin < 10) { financialScore += 10; topDrivers.push(`Low EBITDA margin: ${ebitdaMargin.toFixed(1)}%`); }
      else if (ebitdaMargin > 20) { financialScore -= 5; }

      // Current Ratio
      if (currentRatio < 1) { financialScore += 10; topDrivers.push(`Current ratio below 1: ${currentRatio.toFixed(2)}`); }

      // GST mismatch
      if (financials.gst_bank_mismatch_flag) {
        financialScore += 10;
        topDrivers.push(`GST-Bank credit mismatch: ${(financials.gst_bank_mismatch || 0).toFixed(1)}%`);
      }
    }
    financialScore = Math.max(0, Math.min(100, financialScore));

    // === Compliance Score ===
    let complianceScore = 40;
    if (financials?.active_legal_cases && financials.active_legal_cases > 0) {
      complianceScore += financials.active_legal_cases * 10;
      topDrivers.push(`${financials.active_legal_cases} pending litigation cases`);
    }
    complianceScore = Math.max(0, Math.min(100, complianceScore));

    // === Litigation/News Score (simulated) ===
    let litigationScore = 45;

    // === Qualitative Assessment ===
    let qualitativeScore = 40;
    const qualitativeAdjustments: { note: string; adjustment: number }[] = [];
    const keywords: Record<string, number> = {
      "low capacity": 5, "promoter dispute": 7, "regulatory compliance delay": 5,
      "management turnover": 4, "audit qualification": 6, "debt restructuring": 8,
      "fraud allegation": 10,
    };

    if (qualitative_notes) {
      const lower = qualitative_notes.toLowerCase();
      for (const [keyword, impact] of Object.entries(keywords)) {
        if (lower.includes(keyword)) {
          qualitativeScore += impact;
          qualitativeAdjustments.push({ note: keyword, adjustment: impact });
          topDrivers.push(`Qualitative flag: ${keyword} (+${impact})`);
        }
      }
    }
    qualitativeScore = Math.max(0, Math.min(100, qualitativeScore));

    // === Weighted Overall Score ===
    const overall = Math.round(
      financialScore * 0.4 +
      complianceScore * 0.25 +
      litigationScore * 0.2 +
      qualitativeScore * 0.15
    );

    // Upsert risk score
    const riskData = {
      evaluation_id,
      overall_score: overall,
      financial_strength_score: financialScore,
      compliance_health_score: complianceScore,
      litigation_news_score: litigationScore,
      qualitative_score: qualitativeScore,
      qualitative_adjustments: qualitativeAdjustments,
      top_drivers: topDrivers.slice(0, 5),
      explanation: `Risk score computed using weighted framework: Financial (40%): ${financialScore}, Compliance (25%): ${complianceScore}, Litigation (20%): ${litigationScore}, Qualitative (15%): ${qualitativeScore}. Overall: ${overall}/100.`,
    };

    // Try update first, then insert
    const { data: existing } = await supabase
      .from("risk_scores")
      .select("id")
      .eq("evaluation_id", evaluation_id)
      .single();

    if (existing) {
      await supabase.from("risk_scores").update(riskData).eq("id", existing.id);
    } else {
      await supabase.from("risk_scores").insert(riskData);
    }

    // Update evaluation risk_score
    await supabase.from("evaluations").update({ risk_score: overall, status: "in_progress" }).eq("id", evaluation_id);

    // === Loan Recommendation ===
    const { data: evalData } = await supabase
      .from("evaluations")
      .select("loan_amount_requested")
      .eq("id", evaluation_id)
      .single();

    const requestedAmount = evalData?.loan_amount_requested || 0;
    let riskCategory: string;
    let approvalPct: number;
    let riskPremium: number;

    if (overall <= 40) {
      riskCategory = "low";
      approvalPct = 80;
      riskPremium = 0;
    } else if (overall <= 70) {
      riskCategory = "medium";
      approvalPct = Math.round(70 - ((overall - 40) / 30) * 20); // 70% to 50%
      riskPremium = 1 + ((overall - 40) / 30); // 1% to 2%
    } else {
      riskCategory = "high";
      approvalPct = 20;
      riskPremium = 3;
    }

    const baseRate = 9.5;
    const recommendedAmount = Math.round(requestedAmount * approvalPct / 100);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let rationale = `Based on overall risk score of ${overall}/100 (${riskCategory} risk), recommending ${approvalPct}% of requested amount.`;

    // Use AI for rationale if available
    if (LOVABLE_API_KEY) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: "You are a credit analyst. Write a 2-3 sentence professional loan recommendation rationale based on the risk assessment data provided. Be specific and cite the key risk factors.",
              },
              {
                role: "user",
                content: JSON.stringify({
                  overall_risk_score: overall,
                  risk_category: riskCategory,
                  financial_score: financialScore,
                  compliance_score: complianceScore,
                  top_drivers: topDrivers,
                  approval_percentage: approvalPct,
                  requested_amount: requestedAmount,
                  recommended_amount: recommendedAmount,
                }),
              },
            ],
          }),
        });
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          rationale = aiData.choices?.[0]?.message?.content || rationale;
        }
      } catch (e) {
        console.error("AI rationale error:", e);
      }
    }

    const loanData = {
      evaluation_id,
      risk_category: riskCategory,
      recommended_amount: recommendedAmount,
      requested_amount: requestedAmount,
      approval_percentage: approvalPct,
      suggested_interest_rate: Math.round((baseRate + riskPremium) * 100) / 100,
      base_rate: baseRate,
      risk_premium: Math.round(riskPremium * 100) / 100,
      rationale,
    };

    const { data: existingLoan } = await supabase
      .from("loan_recommendations")
      .select("id")
      .eq("evaluation_id", evaluation_id)
      .single();

    if (existingLoan) {
      await supabase.from("loan_recommendations").update(loanData).eq("id", existingLoan.id);
    } else {
      await supabase.from("loan_recommendations").insert(loanData);
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      evaluation_id,
      user_id: userId,
      action: "Risk score computed",
      entity: "Risk Scoring Engine",
      details: `Overall risk score: ${overall}/100 (${riskCategory}). Recommended ₹${(recommendedAmount / 10000000).toFixed(1)}Cr at ${(baseRate + riskPremium).toFixed(1)}% interest.`,
    });

    return new Response(JSON.stringify({
      success: true,
      risk_score: riskData,
      loan_recommendation: loanData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compute-risk-score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
