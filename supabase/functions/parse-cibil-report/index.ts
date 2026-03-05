import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData } = await supabase.auth.getClaims(token);
    let userId: string | null = claimsData?.claims?.sub ?? null;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      userId = user.id;
    }

    const { evaluation_id, document_text } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a CIBIL Commercial Credit Report parser for Indian corporate lending.
Extract the following fields from the CIBIL report text. Return ONLY valid JSON with these fields:

- credit_rank: integer 1-10 (CMR rank, 1=best, 10=worst). If "CMR" or "Credit Rank" is mentioned.
- credit_score: integer (CIBIL score if present, typically 300-900 range)
- dpd_30_count: number of accounts with 30+ Days Past Due
- dpd_60_count: number of accounts with 60+ Days Past Due  
- dpd_90_count: number of accounts with 90+ Days Past Due
- total_outstanding: total outstanding amount in Crores (numeric)
- total_overdue: total overdue amount in Crores (numeric)
- credit_facilities_count: total number of credit facilities
- active_accounts: number of active/live accounts
- closed_accounts: number of closed accounts
- suit_filed_count: number of suit filed / wilful default / written-off accounts
- wilful_defaulter: boolean - true if marked as wilful defaulter
- borrower_category: string - category if mentioned (e.g. "Standard", "Sub-Standard", "Doubtful")
- credit_history_length_months: approximate credit history length in months
- worst_status: worst account status found (e.g. "Standard", "SMA-1", "SMA-2", "Sub-Standard", "Doubtful", "Loss")
- key_observations: array of strings - 3-5 key risk observations from the report

Use null for any field not found. Return ONLY valid JSON, no markdown.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `CIBIL Commercial Report content:\n${document_text}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    let extracted;
    try {
      extracted = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      extracted = { error: "Failed to parse AI response", raw: content };
    }

    // Upsert CIBIL report
    const cibilData = {
      evaluation_id,
      source: "upload",
      credit_rank: extracted.credit_rank ?? null,
      credit_score: extracted.credit_score ?? null,
      dpd_30_count: extracted.dpd_30_count ?? 0,
      dpd_60_count: extracted.dpd_60_count ?? 0,
      dpd_90_count: extracted.dpd_90_count ?? 0,
      total_outstanding: extracted.total_outstanding ?? 0,
      total_overdue: extracted.total_overdue ?? 0,
      credit_facilities_count: extracted.credit_facilities_count ?? 0,
      active_accounts: extracted.active_accounts ?? 0,
      closed_accounts: extracted.closed_accounts ?? 0,
      suit_filed_count: extracted.suit_filed_count ?? 0,
      wilful_defaulter: extracted.wilful_defaulter ?? false,
      borrower_category: extracted.borrower_category ?? null,
      credit_history_length_months: extracted.credit_history_length_months ?? null,
      worst_status: extracted.worst_status ?? null,
      raw_extraction: extracted,
    };

    const { data: existing } = await supabase
      .from("cibil_reports")
      .select("id")
      .eq("evaluation_id", evaluation_id)
      .single();

    if (existing) {
      await supabase.from("cibil_reports").update(cibilData).eq("id", existing.id);
    } else {
      await supabase.from("cibil_reports").insert(cibilData);
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      evaluation_id,
      user_id: userId,
      action: "CIBIL report parsed",
      entity: "CIBIL Integration",
      details: `Credit Rank: ${extracted.credit_rank || "N/A"}, Score: ${extracted.credit_score || "N/A"}, DPD90: ${extracted.dpd_90_count || 0}, Wilful Defaulter: ${extracted.wilful_defaulter ? "YES" : "No"}`,
    });

    return new Response(JSON.stringify({ success: true, cibil: cibilData, observations: extracted.key_observations || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-cibil-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
