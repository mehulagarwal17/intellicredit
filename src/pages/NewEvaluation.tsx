import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Upload, Check, Building2, FileUp, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Company Profile", icon: Building2 },
  { id: 2, title: "Document Upload", icon: FileUp },
  { id: 3, title: "Extracted Data", icon: BarChart3 },
];

const industries = [
  "Manufacturing", "Infrastructure", "Technology", "Agriculture", "Real Estate",
  "Pharmaceuticals", "FMCG", "Textiles", "Chemicals", "Financial Services",
];

const documentTypes = [
  { id: "annual_report", label: "Annual Report", accept: ".pdf,.txt", required: true },
  { id: "gst_data", label: "GST Data", accept: ".csv,.txt", required: true },
  { id: "bank_statement", label: "Bank Statement", accept: ".csv,.pdf,.txt", required: true },
  { id: "legal_notice", label: "Legal Notice", accept: ".pdf,.txt", required: false },
  { id: "rating_report", label: "Rating Agency Report", accept: ".pdf,.txt", required: false },
];

export default function NewEvaluation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, { name: string; progress: number; status: string }>>({});
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    loanAmount: "",
    existingExposure: "",
    collateral: "",
  });

  const handleStep1Submit = async () => {
    if (!formData.companyName || !formData.industry || !formData.loanAmount) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      // Create company
      const { data: company, error: companyErr } = await supabase
        .from("companies")
        .insert({
          name: formData.companyName,
          industry: formData.industry,
          created_by: user!.id,
        })
        .select("id")
        .single();
      if (companyErr) throw companyErr;

      // Create evaluation
      const { data: evaluation, error: evalErr } = await supabase
        .from("evaluations")
        .insert({
          company_id: company.id,
          loan_amount_requested: parseFloat(formData.loanAmount),
          existing_exposure: formData.existingExposure ? parseFloat(formData.existingExposure) : 0,
          collateral_details: formData.collateral || null,
          created_by: user!.id,
          status: "draft",
        })
        .select("id")
        .single();
      if (evalErr) throw evalErr;

      setCompanyId(company.id);
      setEvaluationId(evaluation.id);

      // Audit log
      await supabase.from("audit_logs").insert({
        evaluation_id: evaluation.id,
        user_id: user!.id,
        action: "Started new evaluation",
        entity: formData.companyName,
        details: `Created evaluation for ${formData.companyName} (${formData.industry}), Loan: ₹${formData.loanAmount}`,
      });

      toast.success("Company profile saved");
      setCurrentStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (docId: string, file: File) => {
    if (!evaluationId) return;
    
    setUploads((prev) => ({
      ...prev,
      [docId]: { name: file.name, progress: 10, status: "uploading" },
    }));

    try {
      // Upload to storage
      const filePath = `${evaluationId}/${docId}/${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      setUploads((prev) => ({
        ...prev,
        [docId]: { ...prev[docId], progress: 40, status: "uploaded" },
      }));

      // Record in DB
      await supabase.from("uploaded_documents").insert({
        evaluation_id: evaluationId,
        doc_type: docId as any,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        status: "uploaded",
      });

      // Read file text for AI analysis
      const text = await file.text();
      setUploads((prev) => ({
        ...prev,
        [docId]: { ...prev[docId], progress: 60, status: "parsing" },
      }));

      // Call AI analysis edge function
      const { data: funcData, error: funcErr } = await supabase.functions.invoke("analyze-document", {
        body: { evaluation_id: evaluationId, document_text: text.slice(0, 15000), doc_type: docId },
      });

      if (funcErr) throw funcErr;

      setUploads((prev) => ({
        ...prev,
        [docId]: { name: file.name, progress: 100, status: "parsed" },
      }));

      // Audit log
      await supabase.from("audit_logs").insert({
        evaluation_id: evaluationId,
        user_id: user!.id,
        action: "Uploaded and parsed document",
        entity: formData.companyName,
        details: `${file.name} (${docId}) - AI extraction complete`,
      });

      toast.success(`${file.name} parsed successfully`);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploads((prev) => ({
        ...prev,
        [docId]: { ...prev[docId], progress: 0, status: "error" },
      }));
      toast.error(`Failed to process ${file.name}: ${err.message}`);
    }
  };

  const handleProcessFinancials = async () => {
    if (!evaluationId) return;
    setProcessing(true);
    try {
      // Process financials
      const { data: finData, error: finErr } = await supabase.functions.invoke("process-financials", {
        body: { evaluation_id: evaluationId },
      });
      if (finErr) throw finErr;

      // Compute risk score
      const { data: riskData, error: riskErr } = await supabase.functions.invoke("compute-risk-score", {
        body: { evaluation_id: evaluationId, qualitative_notes: "" },
      });
      if (riskErr) throw riskErr;

      // Fetch extracted data for display
      const { data: extracted } = await supabase
        .from("extracted_financials")
        .select("*")
        .eq("evaluation_id", evaluationId)
        .single();

      setExtractedData(extracted);
      setCurrentStep(3);
      toast.success("Financial analysis complete");
    } catch (err: any) {
      toast.error(err.message || "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const displayData = extractedData
    ? [
        { label: "Latest Revenue", value: extractedData.revenue?.length ? `₹${extractedData.revenue[extractedData.revenue.length - 1]?.value?.toFixed(1)} Cr` : "N/A", status: "ok" },
        { label: "EBITDA", value: extractedData.ebitda ? `₹${Number(extractedData.ebitda).toFixed(1)} Cr` : "N/A", status: "ok" },
        { label: "Total Debt", value: extractedData.total_debt ? `₹${Number(extractedData.total_debt).toFixed(1)} Cr` : "N/A", status: Number(extractedData.debt_to_equity) > 2 ? "flag" : "ok" },
        { label: "D/E Ratio", value: extractedData.debt_to_equity?.toFixed(2) || "N/A", status: Number(extractedData.debt_to_equity) > 2 ? "flag" : "ok" },
        { label: "Active Legal Cases", value: String(extractedData.active_legal_cases || 0), status: extractedData.active_legal_cases > 0 ? "flag" : "ok" },
        { label: "GST-Bank Mismatch", value: `${(extractedData.gst_bank_mismatch || 0).toFixed(1)}%`, status: extractedData.gst_bank_mismatch_flag ? "flag" : "ok" },
      ]
    : [
        { label: "Latest Revenue", value: "₹58.0 Cr", status: "ok" },
        { label: "EBITDA", value: "₹11.6 Cr", status: "ok" },
        { label: "Total Debt", value: "₹29.0 Cr", status: "flag" },
        { label: "Active Legal Cases", value: "2", status: "flag" },
        { label: "GST-Bank Mismatch", value: "8.5%", status: "ok" },
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Credit Evaluation</h1>
          <p className="text-sm text-muted-foreground">Complete all steps to generate risk assessment</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-2 flex-1 rounded-lg px-4 py-3 text-sm transition-all ${
                currentStep === step.id
                  ? "bg-primary text-primary-foreground shadow-elevated"
                  : currentStep > step.id
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.id ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <step.icon className="h-4 w-4 shrink-0" />
              )}
              <span className="font-medium hidden sm:inline">{step.title}</span>
              <span className="font-medium sm:hidden">Step {step.id}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Company Profile */}
      {currentStep === 1 && (
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Enter the basic details of the borrower company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  placeholder="e.g. Reliance Infra Ventures Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loan Amount Requested (₹) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000000"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Existing Exposure (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 10000000"
                  value={formData.existingExposure}
                  onChange={(e) => setFormData({ ...formData, existingExposure: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Collateral Details</Label>
              <Textarea
                placeholder="Describe collateral offered (property, equipment, receivables, etc.)"
                value={formData.collateral}
                onChange={(e) => setFormData({ ...formData, collateral: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleStep1Submit} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Continue"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Document Upload */}
      {currentStep === 2 && (
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>Upload financial documents for AI-powered parsing and analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentTypes.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{doc.label}</span>
                    {doc.required && (
                      <Badge variant="secondary" className="text-[10px]">Required</Badge>
                    )}
                  </div>
                  {uploads[doc.id] ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{uploads[doc.id].name}</span>
                        {uploads[doc.id].status === "parsed" && (
                          <Badge className="bg-success text-success-foreground text-[10px]">Parsed</Badge>
                        )}
                        {uploads[doc.id].status === "parsing" && (
                          <Badge variant="secondary" className="text-[10px]">AI Analyzing...</Badge>
                        )}
                        {uploads[doc.id].status === "error" && (
                          <Badge variant="destructive" className="text-[10px]">Error</Badge>
                        )}
                      </div>
                      <Progress value={uploads[doc.id].progress} className="h-1.5" />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Accepts: {doc.accept}</p>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept={doc.accept}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(doc.id, file);
                    }}
                  />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </div>
                </label>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleProcessFinancials} disabled={processing} className="gap-2">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {processing ? "Processing..." : "Analyze & Continue"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Extracted Data Summary */}
      {currentStep === 3 && (
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle>Extracted Data Summary</CardTitle>
            <CardDescription>Review the AI-extracted financial data before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayData.map((item) => (
                <div
                  key={item.label}
                  className={`p-4 rounded-lg border ${
                    item.status === "flag" ? "border-warning/40 bg-warning/5" : "bg-muted/30"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold mt-1 font-mono">{item.value}</p>
                  {item.status === "flag" && (
                    <p className="text-[10px] text-warning font-medium mt-1">⚠ Review Required</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => navigate(`/evaluation/${evaluationId || "eval-001"}`)} className="gap-2">
                Proceed to Analysis <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
