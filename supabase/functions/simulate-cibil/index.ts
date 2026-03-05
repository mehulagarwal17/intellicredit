import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simulated CIBIL profiles for demo purposes
const profiles: Record<string, any> = {
  good: {
    credit_rank: 2,
    credit_score: 780,
    dpd_30_count: 0,
    dpd_60_count: 0,
    dpd_90_count: 0,
    total_outstanding: 45.2,
    total_overdue: 0,
    credit_facilities_count: 8,
    active_accounts: 5,
    closed_accounts: 3,
    suit_filed_count: 0,
    wilful_defaulter: false,
    borrower_category: "Standard",
    credit_history_length_months: 120,
    worst_status: "Standard",
    key_observations: [
      "Excellent credit history with no defaults",
      "All accounts in Standard category",
      "Long credit history of 10+ years",
      "No suits filed or overdue amounts",
      "Diversified credit portfolio across 8 facilities",
    ],
  },
  moderate: {
    credit_rank: 5,
    credit_score: 650,
    dpd_30_count: 2,
    dpd_60_count: 1,
    dpd_90_count: 0,
    total_outstanding: 82.5,
    total_overdue: 3.2,
    credit_facilities_count: 12,
    active_accounts: 8,
    closed_accounts: 4,
    suit_filed_count: 0,
    wilful_defaulter: false,
    borrower_category: "Standard",
    credit_history_length_months: 72,
    worst_status: "SMA-1",
    key_observations: [
      "Moderate credit profile with some stress signals",
      "2 accounts with 30+ DPD in last 12 months",
      "1 account classified as SMA-1",
      "Overdue amount of ₹3.2 Cr needs monitoring",
      "Credit history of 6 years — adequate but not long",
    ],
  },
  poor: {
    credit_rank: 8,
    credit_score: 480,
    dpd_30_count: 5,
    dpd_60_count: 3,
    dpd_90_count: 2,
    total_outstanding: 120.8,
    total_overdue: 28.5,
    credit_facilities_count: 15,
    active_accounts: 10,
    closed_accounts: 5,
    suit_filed_count: 2,
    wilful_defaulter: false,
    borrower_category: "Sub-Standard",
    credit_history_length_months: 48,
    worst_status: "Doubtful",
    key_observations: [
      "High-risk credit profile with multiple defaults",
      "2 accounts with 90+ DPD — classified as Doubtful",
      "2 suits filed by lenders indicating recovery action",
      "Significant overdue of ₹28.5 Cr (23.6% of outstanding)",
      "Borrower category: Sub-Standard — indicates stress",
    ],
  },
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

    const { evaluation_id, profile_type } = await req.json();

    // Pick profile: good, moderate, or poor
    const profileKey = (profile_type || "moderate").toLowerCase();
    const profile = profiles[profileKey] || profiles.moderate;

    // Add some randomness for realism
    const jitter = (val: number, pct: number) => {
      const delta = val * pct * (Math.random() * 2 - 1);
      return Math.round((val + delta) * 100) / 100;
    };

    const simulated = {
      ...profile,
      total_outstanding: jitter(profile.total_outstanding, 0.15),
      total_overdue: jitter(profile.total_overdue, 0.2),
      credit_score: Math.round(jitter(profile.credit_score, 0.05)),
    };

    // Upsert
    const cibilData = {
      evaluation_id,
      source: "simulated",
      ...simulated,
      raw_extraction: { simulated: true, profile_type: profileKey, ...simulated },
    };
    delete cibilData.key_observations;

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
      action: "Simulated CIBIL data generated",
      entity: "CIBIL Integration",
      details: `Profile: ${profileKey}. Credit Rank: ${simulated.credit_rank}, Score: ${simulated.credit_score}, DPD90: ${simulated.dpd_90_count}`,
    });

    return new Response(JSON.stringify({
      success: true,
      cibil: cibilData,
      observations: simulated.key_observations || profile.key_observations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simulate-cibil error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
