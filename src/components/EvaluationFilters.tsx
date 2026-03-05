import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FiltersState {
  status: string;
  riskLevel: string;
  industry: string;
}

interface Props {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  industries: string[];
}

export function EvaluationFilters({ filters, onFiltersChange, industries }: Props) {
  const hasFilters = filters.status !== "all" || filters.riskLevel !== "all" || filters.industry !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={filters.status} onValueChange={(v) => onFiltersChange({ ...filters, status: v })}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="under_review">Under Review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.riskLevel} onValueChange={(v) => onFiltersChange({ ...filters, riskLevel: v })}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="Risk Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk</SelectItem>
          <SelectItem value="low">Low (0-40)</SelectItem>
          <SelectItem value="medium">Medium (41-70)</SelectItem>
          <SelectItem value="high">High (71-100)</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.industry} onValueChange={(v) => onFiltersChange({ ...filters, industry: v })}>
        <SelectTrigger className="w-[160px] h-9 text-xs">
          <SelectValue placeholder="Industry" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Industries</SelectItem>
          {industries.map((ind) => (
            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs gap-1"
          onClick={() => onFiltersChange({ status: "all", riskLevel: "all", industry: "all" })}
        >
          <X className="h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  );
}
