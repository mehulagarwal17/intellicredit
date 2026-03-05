
-- Add new status values to evaluation_status enum
ALTER TYPE public.evaluation_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.evaluation_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.evaluation_status ADD VALUE IF NOT EXISTS 'rejected';

-- Workflow history table to track all transitions
CREATE TABLE public.workflow_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_history ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view workflow history for evaluations they can see
CREATE POLICY "Users can view workflow history"
  ON public.workflow_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM evaluations e WHERE e.id = workflow_history.evaluation_id));

-- Authenticated users can insert workflow history entries they authored
CREATE POLICY "Users can insert workflow history"
  ON public.workflow_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = changed_by);
