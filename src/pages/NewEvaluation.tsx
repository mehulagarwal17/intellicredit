import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Upload, Check, Building2, FileUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
  { id: "annual-report", label: "Annual Report", accept: ".pdf", required: true },
  { id: "gst-data", label: "GST Data", accept: ".csv", required: true },
  { id: "bank-statement", label: "Bank Statement", accept: ".csv,.pdf", required: true },
  { id: "legal-notice", label: "Legal Notice", accept: ".pdf", required: false },
  { id: "rating-report", label: "Rating Agency Report", accept: ".pdf", required: false },
];

export default function NewEvaluation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploads, setUploads] = useState<Record<string, { name: string; progress: number; status: string }>>({});
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    loanAmount: "",
    existingExposure: "",
    collateral: "",
  });

  const handleUpload = (docId: string, file: File) => {
    setUploads((prev) => ({
      ...prev,
      [docId]: { name: file.name, progress: 0, status: "uploading" },
    }));
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploads((prev) => ({
          ...prev,
          [docId]: { ...prev[docId], progress: 100, status: "parsed" },
        }));
      } else {
        setUploads((prev) => ({
          ...prev,
          [docId]: { ...prev[docId], progress: Math.min(progress, 100) },
        }));
      }
    }, 400);
  };

  const extractedData = [
    { label: "Latest Revenue", value: "₹58.0 Cr", status: "ok" },
    { label: "EBITDA", value: "₹11.6 Cr", status: "ok" },
    { label: "Total Debt", value: "₹29.0 Cr", status: "flag" },
    { label: "Active Legal Cases", value: "2", status: "flag" },
    { label: "GST-Bank Mismatch", value: "8.5% (within threshold)", status: "ok" },
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
              <Button onClick={() => setCurrentStep(2)} className="gap-2">
                Continue <ArrowRight className="h-4 w-4" />
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
            <CardDescription>Upload financial documents for automated parsing and analysis</CardDescription>
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
                          <Badge className="bg-success text-success-foreground text-[10px]">
                            Parsed
                          </Badge>
                        )}
                      </div>
                      <Progress value={uploads[doc.id].progress} className="h-1.5" />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepts: {doc.accept}
                    </p>
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
              <Button onClick={() => setCurrentStep(3)} className="gap-2">
                Continue <ArrowRight className="h-4 w-4" />
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
            <CardDescription>Review the automatically extracted financial data before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {extractedData.map((item) => (
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
              <Button onClick={() => navigate("/evaluation/eval-001")} className="gap-2">
                Proceed to Analysis <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
