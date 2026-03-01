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

    const { evaluation_id } = await req.json();

    // Fetch all parsed documents for this evaluation
    const { data: docs } = await supabase
      .from("uploaded_documents")
      .select("doc_type, parsed_data")
      .eq("evaluation_id", evaluation_id)
      .eq("status", "parsed");

    // Merge extracted data from all documents
    let revenue: any[] = [];
    let ebitda = 0, netProfit = 0, totalDebt = 0, currentAssets = 0, currentLiabilities = 0, totalEquity = 0;
    let activeLegalCases = 0;
    let gstRevenue: number | null = null;
    let bankCredits: number | null = null;

    for (const doc of (docs || [])) {
      const d = doc.parsed_data as any;
      if (!d) continue;

      if (d.revenue?.length) revenue = d.revenue;
      if (d.ebitda) ebitda = d.ebitda;
      if (d.net_profit) netProfit = d.net_profit;
      if (d.total_debt) totalDebt = d.total_debt;
      if (d.current_assets) currentAssets = d.current_assets;
      if (d.current_liabilities) currentLiabilities = d.current_liabilities;
      if (d.total_equity) totalEquity = d.total_equity;
      if (d.active_legal_cases) activeLegalCases += d.active_legal_cases;
      if (d.gst_declared_revenue) gstRevenue = d.gst_declared_revenue;
      if (d.bank_total_credits) bankCredits = d.bank_total_credits;
    }

    // Compute ratios
    const debtToEquity = totalEquity > 0 ? totalDebt / totalEquity : 0;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const latestRevenue = revenue.length > 0 ? revenue[revenue.length - 1]?.value || 0 : 0;
    const ebitdaMargin = latestRevenue > 0 ? (ebitda / latestRevenue) * 100 : 0;
    const dscr = totalDebt > 0 ? (ebitda / (totalDebt * 0.15)) : 0; // Simplified DSCR

    // Revenue growth
    const revenueGrowth: number[] = [];
    for (let i = 1; i < revenue.length; i++) {
      const prev = revenue[i - 1]?.value || 0;
      if (prev > 0) revenueGrowth.push(((revenue[i].value - prev) / prev) * 100);
    }

    // GST-Bank mismatch
    let gstBankMismatch = 0;
    let gstBankMismatchFlag = false;
    if (gstRevenue && bankCredits && gstRevenue > 0) {
      gstBankMismatch = Math.abs(((gstRevenue - bankCredits) / gstRevenue) * 100);
      gstBankMismatchFlag = gstBankMismatch > 10;
    }

    const financialData = {
      evaluation_id,
      revenue,
      ebitda,
      net_profit: netProfit,
      total_debt: totalDebt,
      current_assets: currentAssets,
      current_liabilities: currentLiabilities,
      total_equity: totalEquity,
      debt_to_equity: Math.round(debtToEquity * 100) / 100,
      dscr: Math.round(dscr * 100) / 100,
      ebitda_margin: Math.round(ebitdaMargin * 10) / 10,
      current_ratio: Math.round(currentRatio * 100) / 100,
      revenue_growth: revenueGrowth.map((g) => Math.round(g * 10) / 10),
      gst_bank_mismatch: Math.round(gstBankMismatch * 10) / 10,
      gst_bank_mismatch_flag: gstBankMismatchFlag,
      active_legal_cases: activeLegalCases,
      raw_extraction: docs?.map((d) => ({ doc_type: d.doc_type, data: d.parsed_data })),
    };

    // Upsert
    const { data: existing } = await supabase
      .from("extracted_financials")
      .select("id")
      .eq("evaluation_id", evaluation_id)
      .single();

    if (existing) {
      await supabase.from("extracted_financials").update(financialData).eq("id", existing.id);
    } else {
      await supabase.from("extracted_financials").insert(financialData);
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      evaluation_id,
      user_id: userId,
      action: "Financial analysis complete",
      entity: "Financial Analysis Engine",
      details: `Computed ratios: D/E=${debtToEquity.toFixed(2)}, DSCR=${dscr.toFixed(2)}, EBITDA Margin=${ebitdaMargin.toFixed(1)}%, Current Ratio=${currentRatio.toFixed(2)}`,
    });

    return new Response(JSON.stringify({ success: true, financials: financialData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-financials error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
