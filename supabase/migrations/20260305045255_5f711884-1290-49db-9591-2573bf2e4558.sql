
-- CIBIL Commercial Reports table
CREATE TABLE public.cibil_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'simulated')),
  credit_rank INTEGER,
  credit_score INTEGER,
  dpd_30_count INTEGER DEFAULT 0,
  dpd_60_count INTEGER DEFAULT 0,
  dpd_90_count INTEGER DEFAULT 0,
  total_outstanding NUMERIC DEFAULT 0,
  total_overdue NUMERIC DEFAULT 0,
  credit_facilities_count INTEGER DEFAULT 0,
  active_accounts INTEGER DEFAULT 0,
  closed_accounts INTEGER DEFAULT 0,
  suit_filed_count INTEGER DEFAULT 0,
  wilful_defaulter BOOLEAN DEFAULT false,
  borrower_category TEXT,
  credit_history_length_months INTEGER,
  worst_status TEXT,
  raw_extraction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.cibil_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view CIBIL reports for their evaluations"
  ON public.cibil_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM evaluations e WHERE e.id = cibil_reports.evaluation_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Users can insert CIBIL reports for their evaluations"
  ON public.cibil_reports FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM evaluations e WHERE e.id = cibil_reports.evaluation_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Users can update CIBIL reports for their evaluations"
  ON public.cibil_reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM evaluations e WHERE e.id = cibil_reports.evaluation_id AND e.created_by = auth.uid()
  ));

-- Unique constraint: one CIBIL report per evaluation
CREATE UNIQUE INDEX idx_cibil_reports_evaluation ON public.cibil_reports(evaluation_id);
