
-- =============================================
-- IntelliCredit Database Schema
-- =============================================

-- 1. Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. App roles enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'credit_officer', 'analyst');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'credit_officer');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  cin TEXT,
  pan TEXT,
  registered_address TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view companies" ON public.companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own companies" ON public.companies
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Evaluations table
CREATE TYPE public.evaluation_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');

CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  loan_amount_requested NUMERIC NOT NULL DEFAULT 0,
  existing_exposure NUMERIC DEFAULT 0,
  collateral_details TEXT,
  status evaluation_status NOT NULL DEFAULT 'draft',
  risk_score NUMERIC,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evaluations" ON public.evaluations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create evaluations" ON public.evaluations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own evaluations" ON public.evaluations
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Uploaded documents
CREATE TYPE public.document_type AS ENUM ('annual_report', 'gst_data', 'bank_statement', 'legal_notice', 'rating_report');
CREATE TYPE public.document_status AS ENUM ('uploading', 'uploaded', 'parsing', 'parsed', 'error');

CREATE TABLE public.uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  doc_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  status document_status NOT NULL DEFAULT 'uploaded',
  parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their evaluations" ON public.uploaded_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );
CREATE POLICY "Users can upload documents" ON public.uploaded_documents
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );
CREATE POLICY "Users can update own documents" ON public.uploaded_documents
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.uploaded_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Extracted financial data
CREATE TABLE public.extracted_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  revenue JSONB, -- [{year, value}]
  ebitda NUMERIC,
  net_profit NUMERIC,
  total_debt NUMERIC,
  current_assets NUMERIC,
  current_liabilities NUMERIC,
  total_equity NUMERIC,
  debt_to_equity NUMERIC,
  dscr NUMERIC,
  ebitda_margin NUMERIC,
  current_ratio NUMERIC,
  revenue_growth JSONB, -- [percentages]
  gst_bank_mismatch NUMERIC,
  gst_bank_mismatch_flag BOOLEAN DEFAULT false,
  active_legal_cases INTEGER DEFAULT 0,
  raw_extraction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.extracted_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view financials for their evaluations" ON public.extracted_financials
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );
CREATE POLICY "System can insert financials" ON public.extracted_financials
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );
CREATE POLICY "System can update financials" ON public.extracted_financials
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );

CREATE TRIGGER update_financials_updated_at BEFORE UPDATE ON public.extracted_financials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Risk scores
CREATE TABLE public.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  overall_score NUMERIC NOT NULL DEFAULT 0,
  financial_strength_score NUMERIC DEFAULT 0,
  financial_strength_weight NUMERIC DEFAULT 40,
  compliance_health_score NUMERIC DEFAULT 0,
  compliance_health_weight NUMERIC DEFAULT 25,
  litigation_news_score NUMERIC DEFAULT 0,
  litigation_news_weight NUMERIC DEFAULT 20,
  qualitative_score NUMERIC DEFAULT 0,
  qualitative_weight NUMERIC DEFAULT 15,
  qualitative_adjustments JSONB, -- [{note, adjustment}]
  top_drivers JSONB, -- [strings]
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risk scores" ON public.risk_scores
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );
CREATE POLICY "Users can insert risk scores" ON public.risk_scores
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );
CREATE POLICY "Users can update risk scores" ON public.risk_scores
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );

CREATE TRIGGER update_risk_scores_updated_at BEFORE UPDATE ON public.risk_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Loan recommendations
CREATE TYPE public.risk_category AS ENUM ('low', 'medium', 'high');

CREATE TABLE public.loan_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  risk_category risk_category NOT NULL DEFAULT 'medium',
  recommended_amount NUMERIC NOT NULL DEFAULT 0,
  requested_amount NUMERIC NOT NULL DEFAULT 0,
  approval_percentage NUMERIC DEFAULT 0,
  suggested_interest_rate NUMERIC DEFAULT 0,
  base_rate NUMERIC DEFAULT 9.5,
  risk_premium NUMERIC DEFAULT 0,
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loan recommendations" ON public.loan_recommendations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );
CREATE POLICY "Users can insert loan recommendations" ON public.loan_recommendations
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );
CREATE POLICY "Users can update loan recommendations" ON public.loan_recommendations
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.evaluations e WHERE e.id = evaluation_id AND e.created_by = auth.uid())
  );

CREATE TRIGGER update_loan_recommendations_updated_at BEFORE UPDATE ON public.loan_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT,
  details TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 11. Storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documents');
