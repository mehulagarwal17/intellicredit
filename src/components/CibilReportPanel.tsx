import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload, Loader2, AlertTriangle, CheckCircle, XCircle, Shield,
  FileText, Database, TrendingDown, Ban, Scale, Clock
} from "lucide-react";

interface CibilData {
  credit_rank: number | null;
  credit_score: number | null;
  dpd_30_count: number;
  dpd_60_count: number;
  dpd_90_count: number;
  total_outstanding: number;
  total_overdue: number;
  credit_facilities_count: number;
  active_accounts: number;
  closed_accounts: number;
  suit_filed_count: number;
  wilful_defaulter: boolean;
  borrower_category: string | null;
  credit_history_length_months: number | null;
  worst_status: string | null;
  source: string;
}

interface Props {
  evaluationId: string;
  onDataLoaded?: (data: CibilData) => void;
}

function getRankColor(rank: number | null) {
  if (!rank) return "text-muted-foreground";
  if (rank <= 3) return "text-success";
  if (rank <= 6) return "text-warning";
  return "text-destructive";
}

function getRankLabel(rank: number | null) {
  if (!rank) return "N/A";
  if (rank <= 3) return "Low Risk";
  if (rank <= 6) return "Moderate Risk";
  return "High Risk";
}

function getStatusColor(status: string | null) {
  if (!status) return "secondary";
  const s = status.toLowerCase();
  if (s === "standard") return "default";
  if (s.includes("sma")) return "secondary";
  if (s === "sub-standard" || s === "doubtful") return "destructive";
  if (s === "loss") return "destructive";
  return "secondary";
}

export function CibilReportPanel({ evaluationId, onDataLoaded }: Props) {
  const [cibilData, setCibilData] = useState<CibilData | null>(null);
  const [observations, setObservations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [simProfile, setSimProfile] = useState("moderate");

  // Load existing CIBIL data
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("cibil_reports")
        .select("*")
        .eq("evaluation_id", evaluationId)
        .single();

      if (data) {
        setCibilData(data as any);
        const raw = data.raw_extraction as any;
        setObservations(raw?.key_observations || []);
        onDataLoaded?.(data as any);
      }
      setLoading(false);
    };
    load();
  }, [evaluationId]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(20);
    try {
      const text = await file.text();
      setUploadProgress(50);

      const { data, error } = await supabase.functions.invoke("parse-cibil-report", {
        body: { evaluation_id: evaluationId, document_text: text.slice(0, 20000) },
      });

      if (error) throw error;
      setUploadProgress(100);

      if (data?.success) {
        setCibilData(data.cibil);
        setObservations(data.observations || []);
        onDataLoaded?.(data.cibil);
        toast.success("CIBIL report parsed successfully");
      } else {
        throw new Error(data?.error || "Failed to parse report");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to parse CIBIL report");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const { data, error } = await supabase.functions.invoke("simulate-cibil", {
        body: { evaluation_id: evaluationId, profile_type: simProfile },
      });

      if (error) throw error;

      if (data?.success) {
        setCibilData(data.cibil);
        setObservations(data.observations || []);
        onDataLoaded?.(data.cibil);
        toast.success(`Simulated CIBIL data generated (${simProfile} profile)`);
      } else {
        throw new Error(data?.error || "Simulation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to simulate CIBIL data");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading CIBIL data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Input Section */}
      {!cibilData && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              CIBIL Commercial Report
            </CardTitle>
            <CardDescription>
              Upload a real CIBIL commercial report or use simulated data for demo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1 gap-2 text-xs sm:text-sm">
                  <Upload className="h-3.5 w-3.5" /> Upload Report
                </TabsTrigger>
                <TabsTrigger value="simulate" className="flex-1 gap-2 text-xs sm:text-sm">
                  <Database className="h-3.5 w-3.5" /> Simulated API
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-3">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload CIBIL Commercial Credit Report (PDF or TXT)
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                      }}
                    />
                    <Button variant="outline" className="gap-2" disabled={uploading} asChild>
                      <span>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploading ? "Parsing..." : "Select File"}
                      </span>
                    </Button>
                  </label>
                  {uploading && <Progress value={uploadProgress} className="mt-3 h-1.5" />}
                </div>
              </TabsContent>

              <TabsContent value="simulate" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generate realistic CIBIL data for demo scenarios. Select a credit profile:
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={simProfile} onValueChange={setSimProfile}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good (CMR 1-3, Low Risk)</SelectItem>
                      <SelectItem value="moderate">Moderate (CMR 4-6, Medium Risk)</SelectItem>
                      <SelectItem value="poor">Poor (CMR 7-10, High Risk)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSimulate} disabled={simulating} className="gap-2">
                    {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    {simulating ? "Generating..." : "Generate CIBIL Data"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* CIBIL Data Display */}
      {cibilData && (
        <>
          {/* Header Score Card */}
          <Card className={`shadow-elevated border-2 ${
            (cibilData.credit_rank || 5) <= 3 ? "border-success/30" :
            (cibilData.credit_rank || 5) <= 6 ? "border-warning/30" : "border-destructive/30"
          }`}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center h-16 w-16 rounded-full ${
                    (cibilData.credit_rank || 5) <= 3 ? "bg-success/10" :
                    (cibilData.credit_rank || 5) <= 6 ? "bg-warning/10" : "bg-destructive/10"
                  }`}>
                    <span className={`text-2xl font-bold font-mono ${getRankColor(cibilData.credit_rank)}`}>
                      {cibilData.credit_rank || "–"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CIBIL CMR Rank</p>
                    <p className={`text-lg font-bold ${getRankColor(cibilData.credit_rank)}`}>
                      {getRankLabel(cibilData.credit_rank)}
                    </p>
                    {cibilData.credit_score && (
                      <p className="text-xs text-muted-foreground">Score: {cibilData.credit_score}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={cibilData.source === "upload" ? "default" : "secondary"}>
                    {cibilData.source === "upload" ? "Uploaded Report" : "Simulated Data"}
                  </Badge>
                  {cibilData.wilful_defaulter && (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="h-3 w-3" /> Wilful Defaulter
                    </Badge>
                  )}
                  {cibilData.worst_status && (
                    <Badge variant={getStatusColor(cibilData.worst_status) as any}>
                      Worst: {cibilData.worst_status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="shadow-card">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">DPD Summary</span>
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">30+ DPD</span>
                    <span className={`font-mono font-medium ${cibilData.dpd_30_count > 0 ? "text-warning" : "text-success"}`}>
                      {cibilData.dpd_30_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">60+ DPD</span>
                    <span className={`font-mono font-medium ${cibilData.dpd_60_count > 0 ? "text-warning" : "text-success"}`}>
                      {cibilData.dpd_60_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">90+ DPD</span>
                    <span className={`font-mono font-medium ${cibilData.dpd_90_count > 0 ? "text-destructive" : "text-success"}`}>
                      {cibilData.dpd_90_count}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Scale className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Outstanding</span>
                </div>
                <p className="text-xl font-bold font-mono mt-2">₹{cibilData.total_outstanding} Cr</p>
                <p className={`text-xs mt-1 ${cibilData.total_overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  Overdue: ₹{cibilData.total_overdue} Cr
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Facilities</span>
                </div>
                <p className="text-xl font-bold font-mono mt-2">{cibilData.credit_facilities_count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active: {cibilData.active_accounts} | Closed: {cibilData.closed_accounts}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">History</span>
                </div>
                <p className="text-xl font-bold font-mono mt-2">
                  {cibilData.credit_history_length_months
                    ? `${Math.round(cibilData.credit_history_length_months / 12)} yrs`
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Suits Filed: <span className={cibilData.suit_filed_count > 0 ? "text-destructive font-medium" : ""}>
                    {cibilData.suit_filed_count}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Observations */}
          {observations.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Key Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {observations.map((obs, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg border bg-muted/20">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{obs}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Replace Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCibilData(null);
                setObservations([]);
              }}
              className="text-xs"
            >
              Replace CIBIL Data
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
