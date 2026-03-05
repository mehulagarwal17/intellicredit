import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { company_name, search_queries } = await req.json();

    if (!company_name) {
      return new Response(
        JSON.stringify({ success: false, error: "company_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default search queries covering all research dimensions
    const queries = search_queries || [
      `${company_name} latest news India`,
      `${company_name} litigation legal cases NCLT India`,
      `${company_name} promoter fraud dispute India`,
      `${company_name} sector regulatory RBI SEBI India`,
    ];

    console.log("Searching for:", queries);

    // Run all Firecrawl searches in parallel
    const searchPromises = queries.map((query: string) =>
      fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 5,
          lang: "en",
          country: "in",
          tbs: "qdr:m", // last month
        }),
      }).then((r) => r.json()).catch((e) => {
        console.error(`Search failed for "${query}":`, e);
        return { success: false, data: [] };
      })
    );

    const searchResults = await Promise.all(searchPromises);

    // Flatten and deduplicate results by URL
    const allResults: any[] = [];
    const seenUrls = new Set<string>();

    for (const result of searchResults) {
      const items = result?.data || [];
      for (const item of items) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allResults.push({
            url: item.url,
            title: item.title || "",
            description: item.description || "",
            markdown: item.markdown || "",
          });
        }
      }
    }

    console.log(`Found ${allResults.length} unique results`);

    // Use AI to analyze sentiment and categorize each result
    const analysisPrompt = `You are a credit analyst researching "${company_name}" for a corporate loan evaluation.

Analyze these search results and return a JSON array of objects. For each article, provide:
- "headline": concise headline (max 100 chars)
- "source": source domain name
- "date": date if found, otherwise "Recent"
- "sentiment": "positive", "negative", or "neutral"
- "category": one of "news", "litigation", "regulatory", "financial", "management"
- "risk_signal": boolean - true if this is a risk signal for lending
- "summary": 1-sentence summary of relevance to credit assessment

Only include articles relevant to credit assessment. Return max 15 results. Return ONLY valid JSON array, no markdown.

Search results:
${JSON.stringify(allResults.slice(0, 20).map((r) => ({ title: r.title, description: r.description, url: r.url })), null, 2)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a financial research analyst. Return only valid JSON." },
          { role: "user", content: analysisPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI analysis failed:", aiResponse.status, errText);
      // Fallback: return raw results without AI analysis
      const fallbackResults = allResults.slice(0, 15).map((r) => ({
        headline: r.title || "Untitled",
        source: new URL(r.url).hostname.replace("www.", ""),
        date: "Recent",
        sentiment: "neutral" as const,
        category: "news",
        risk_signal: false,
        summary: r.description || "",
        url: r.url,
      }));
      return new Response(
        JSON.stringify({ success: true, results: fallbackResults, ai_analyzed: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    let analyzedResults;
    try {
      analyzedResults = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      analyzedResults = [];
    }

    // Attach original URLs
    const enrichedResults = analyzedResults.map((item: any, i: number) => ({
      ...item,
      url: allResults[i]?.url || "",
    }));

    // Compute a litigation/news risk score based on findings
    const riskSignals = enrichedResults.filter((r: any) => r.risk_signal);
    const negativeCount = enrichedResults.filter((r: any) => r.sentiment === "negative").length;
    const litigationCount = enrichedResults.filter((r: any) => r.category === "litigation").length;

    // Score: base 30, +5 per negative, +10 per litigation, capped at 100
    const newsRiskScore = Math.min(100, 30 + negativeCount * 5 + litigationCount * 10);

    return new Response(
      JSON.stringify({
        success: true,
        results: enrichedResults,
        ai_analyzed: true,
        meta: {
          total_results: allResults.length,
          risk_signals: riskSignals.length,
          negative_count: negativeCount,
          litigation_count: litigationCount,
          computed_news_risk_score: newsRiskScore,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("research-search error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
