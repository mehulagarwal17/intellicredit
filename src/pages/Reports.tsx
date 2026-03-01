import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BarChart3, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockEvaluations } from "@/data/mockData";

export default function Reports() {
  const navigate = useNavigate();

  const completedEvals = mockEvaluations.filter((e) => e.status === "completed");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generated Credit Appraisal Memos and analytics reports
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedEvals.map((evaluation) => (
          <Card key={evaluation.id} className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate(`/evaluation/${evaluation.id}`)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <FileText className="h-8 w-8 text-primary/60" />
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  evaluation.riskScore <= 40
                    ? "bg-risk-low-bg text-risk-low"
                    : evaluation.riskScore <= 70
                    ? "bg-risk-medium-bg text-risk-medium"
                    : "bg-risk-high-bg text-risk-high"
                }`}>
                  Score: {evaluation.riskScore}
                </span>
              </div>
              <CardTitle className="text-sm mt-2">{evaluation.companyName}</CardTitle>
              <CardDescription className="text-xs">{evaluation.industry} • {evaluation.lastUpdated}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1">
                  <BarChart3 className="h-3 w-3" /> View
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
