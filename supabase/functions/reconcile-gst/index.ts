import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { gstr2a_text, gstr3b_text, evaluation_id, mode } = await req.json();

    // Mode: "parse" to extract from text, "simulate" for demo data
    if (mode === "simulate") {
      const simulated = generateSimulatedData();
      return new Response(JSON.stringify({ success: true, ...simulated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!gstr2a_text && !gstr3b_text) {
      return new Response(
        JSON.stringify({ success: false, error: "Provide GSTR-2A and/or GSTR-3B data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractionPrompt = `You are a GST reconciliation expert. Extract structured monthly data from these GST returns.

${gstr2a_text ? `GSTR-2A (Auto-populated inward supplies):\n${gstr2a_text}\n\n` : ""}
${gstr3b_text ? `GSTR-3B (Self-declared summary return):\n${gstr3b_text}` : ""}

Extract and return a JSON object with:
{
  "gstr2a": {
    "period": "FY or date range",
    "months": [
      {
        "month": "Apr-2024",
        "taxable_value": number,
        "igst": number,
        "cgst": number,
        "sgst": number,
        "cess": number,
        "total_tax": number,
        "invoice_count": number
      }
    ],
    "total_taxable_value": number,
    "total_tax": number,
    "total_invoices": number
  },
  "gstr3b": {
    "period": "FY or date range",
    "months": [
      {
        "month": "Apr-2024",
        "taxable_value": number,
        "igst": number,
        "cgst": number,
        "sgst": number,
        "cess": number,
        "total_tax": number,
        "itc_claimed": number
      }
    ],
    "total_taxable_value": number,
    "total_tax": number,
    "total_itc_claimed": number
  }
}

If data for a field is not available, use 0. Return ONLY valid JSON.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a GST data extraction expert. Return only valid JSON." },
          { role: "user", content: extractionPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse GST data. Try reformatting." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reconcile
    const reconciliation = reconcileData(parsed.gstr2a, parsed.gstr3b);

    return new Response(JSON.stringify({
      success: true,
      gstr2a: parsed.gstr2a,
      gstr3b: parsed.gstr3b,
      reconciliation,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("reconcile-gst error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function reconcileData(gstr2a: any, gstr3b: any) {
  const monthlyDiffs: any[] = [];
  const months2a = gstr2a?.months || [];
  const months3b = gstr3b?.months || [];

  // Create a map for quick lookup
  const map2a: Record<string, any> = {};
  months2a.forEach((m: any) => { map2a[m.month] = m; });
  const map3b: Record<string, any> = {};
  months3b.forEach((m: any) => { map3b[m.month] = m; });

  const allMonths = new Set([...Object.keys(map2a), ...Object.keys(map3b)]);

  let totalMismatchTax = 0;
  let totalMismatchValue = 0;
  let flaggedMonths = 0;

  for (const month of Array.from(allMonths).sort()) {
    const a = map2a[month] || { taxable_value: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, total_tax: 0, invoice_count: 0 };
    const b = map3b[month] || { taxable_value: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, total_tax: 0, itc_claimed: 0 };

    const taxDiff = b.total_tax - a.total_tax;
    const valueDiff = b.taxable_value - a.taxable_value;
    const taxDiffPct = a.total_tax > 0 ? (Math.abs(taxDiff) / a.total_tax) * 100 : 0;
    const valueDiffPct = a.taxable_value > 0 ? (Math.abs(valueDiff) / a.taxable_value) * 100 : 0;

    // ITC mismatch: 3B claimed vs 2A available
    const itcExcess = (b.itc_claimed || 0) - a.total_tax;

    const flagged = taxDiffPct > 10 || valueDiffPct > 10 || itcExcess > 0;
    if (flagged) flaggedMonths++;

    totalMismatchTax += Math.abs(taxDiff);
    totalMismatchValue += Math.abs(valueDiff);

    monthlyDiffs.push({
      month,
      gstr2a_taxable: a.taxable_value,
      gstr3b_taxable: b.taxable_value,
      value_diff: valueDiff,
      value_diff_pct: Math.round(valueDiffPct * 10) / 10,
      gstr2a_tax: a.total_tax,
      gstr3b_tax: b.total_tax,
      tax_diff: taxDiff,
      tax_diff_pct: Math.round(taxDiffPct * 10) / 10,
      itc_claimed: b.itc_claimed || 0,
      itc_available: a.total_tax,
      itc_excess: itcExcess > 0 ? itcExcess : 0,
      flagged,
    });
  }

  const total2aTax = gstr2a?.total_tax || 0;
  const total3bTax = gstr3b?.total_tax || 0;
  const total2aValue = gstr2a?.total_taxable_value || 0;
  const total3bValue = gstr3b?.total_taxable_value || 0;
  const overallMismatchPct = total2aValue > 0
    ? Math.round((Math.abs(total3bValue - total2aValue) / total2aValue) * 100 * 10) / 10
    : 0;

  // Risk assessment
  let risk_level: "low" | "medium" | "high" = "low";
  let risk_score_impact = 0;
  const observations: string[] = [];

  if (overallMismatchPct > 20) {
    risk_level = "high";
    risk_score_impact = 15;
    observations.push(`Significant overall mismatch of ${overallMismatchPct}% between 2A and 3B taxable values`);
  } else if (overallMismatchPct > 10) {
    risk_level = "medium";
    risk_score_impact = 8;
    observations.push(`Moderate mismatch of ${overallMismatchPct}% between 2A and 3B taxable values`);
  } else {
    observations.push(`Taxable value mismatch within acceptable range (${overallMismatchPct}%)`);
  }

  if (flaggedMonths > 3) {
    risk_score_impact += 5;
    observations.push(`${flaggedMonths} months flagged with >10% discrepancy`);
  }

  const totalItcExcess = monthlyDiffs.reduce((sum, m) => sum + m.itc_excess, 0);
  if (totalItcExcess > 0) {
    risk_score_impact += 10;
    observations.push(`Excess ITC claimed: ₹${(totalItcExcess / 100000).toFixed(2)}L more than 2A availability`);
    if (risk_level === "low") risk_level = "medium";
  }

  return {
    monthly: monthlyDiffs,
    summary: {
      total_2a_taxable: total2aValue,
      total_3b_taxable: total3bValue,
      total_2a_tax: total2aTax,
      total_3b_tax: total3bTax,
      overall_value_mismatch_pct: overallMismatchPct,
      total_mismatch_tax: Math.round(totalMismatchTax * 100) / 100,
      total_mismatch_value: Math.round(totalMismatchValue * 100) / 100,
      flagged_months: flaggedMonths,
      total_months: monthlyDiffs.length,
      total_itc_excess: totalItcExcess,
    },
    risk_assessment: {
      risk_level,
      risk_score_impact,
      observations,
    },
  };
}

function generateSimulatedData() {
  const months = ["Apr-2024", "May-2024", "Jun-2024", "Jul-2024", "Aug-2024", "Sep-2024",
                   "Oct-2024", "Nov-2024", "Dec-2024", "Jan-2025", "Feb-2025", "Mar-2025"];

  const base = 800000 + Math.random() * 400000;

  const gstr2a_months = months.map((m) => {
    const taxable = Math.round(base + (Math.random() - 0.5) * 200000);
    const igst = Math.round(taxable * 0.09);
    const cgst = Math.round(taxable * 0.045);
    const sgst = Math.round(taxable * 0.045);
    return {
      month: m, taxable_value: taxable, igst, cgst, sgst, cess: 0,
      total_tax: igst + cgst + sgst, invoice_count: Math.round(20 + Math.random() * 30),
    };
  });

  // 3B has slight differences - some months with mismatches
  const gstr3b_months = months.map((m, i) => {
    const ref = gstr2a_months[i];
    // Introduce mismatches in some months
    const mismatchFactor = [2, 5, 8].includes(i) ? 1.12 + Math.random() * 0.1 : 0.98 + Math.random() * 0.04;
    const taxable = Math.round(ref.taxable_value * mismatchFactor);
    const igst = Math.round(taxable * 0.09);
    const cgst = Math.round(taxable * 0.045);
    const sgst = Math.round(taxable * 0.045);
    // ITC claimed sometimes exceeds 2A
    const itc_claimed = [2, 5].includes(i)
      ? Math.round(ref.total_tax * (1.05 + Math.random() * 0.1))
      : Math.round(ref.total_tax * (0.95 + Math.random() * 0.05));
    return {
      month: m, taxable_value: taxable, igst, cgst, sgst, cess: 0,
      total_tax: igst + cgst + sgst, itc_claimed,
    };
  });

  const gstr2a = {
    period: "FY 2024-25",
    months: gstr2a_months,
    total_taxable_value: gstr2a_months.reduce((s, m) => s + m.taxable_value, 0),
    total_tax: gstr2a_months.reduce((s, m) => s + m.total_tax, 0),
    total_invoices: gstr2a_months.reduce((s, m) => s + m.invoice_count, 0),
  };

  const gstr3b = {
    period: "FY 2024-25",
    months: gstr3b_months,
    total_taxable_value: gstr3b_months.reduce((s, m) => s + m.taxable_value, 0),
    total_tax: gstr3b_months.reduce((s, m) => s + m.total_tax, 0),
    total_itc_claimed: gstr3b_months.reduce((s, m) => s + m.itc_claimed, 0),
  };

  const reconciliation = reconcileData(gstr2a, gstr3b);

  return { gstr2a, gstr3b, reconciliation };
}
