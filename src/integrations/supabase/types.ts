export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity: string | null
          evaluation_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity?: string | null
          evaluation_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity?: string | null
          evaluation_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cin: string | null
          created_at: string
          created_by: string
          id: string
          industry: string
          name: string
          pan: string | null
          registered_address: string | null
          updated_at: string
        }
        Insert: {
          cin?: string | null
          created_at?: string
          created_by: string
          id?: string
          industry: string
          name: string
          pan?: string | null
          registered_address?: string | null
          updated_at?: string
        }
        Update: {
          cin?: string | null
          created_at?: string
          created_by?: string
          id?: string
          industry?: string
          name?: string
          pan?: string | null
          registered_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          collateral_details: string | null
          company_id: string
          created_at: string
          created_by: string
          existing_exposure: number | null
          id: string
          loan_amount_requested: number
          risk_score: number | null
          status: Database["public"]["Enums"]["evaluation_status"]
          updated_at: string
        }
        Insert: {
          collateral_details?: string | null
          company_id: string
          created_at?: string
          created_by: string
          existing_exposure?: number | null
          id?: string
          loan_amount_requested?: number
          risk_score?: number | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          updated_at?: string
        }
        Update: {
          collateral_details?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          existing_exposure?: number | null
          id?: string
          loan_amount_requested?: number
          risk_score?: number | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_financials: {
        Row: {
          active_legal_cases: number | null
          created_at: string
          current_assets: number | null
          current_liabilities: number | null
          current_ratio: number | null
          debt_to_equity: number | null
          dscr: number | null
          ebitda: number | null
          ebitda_margin: number | null
          evaluation_id: string
          gst_bank_mismatch: number | null
          gst_bank_mismatch_flag: boolean | null
          id: string
          net_profit: number | null
          raw_extraction: Json | null
          revenue: Json | null
          revenue_growth: Json | null
          total_debt: number | null
          total_equity: number | null
          updated_at: string
        }
        Insert: {
          active_legal_cases?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio?: number | null
          debt_to_equity?: number | null
          dscr?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          evaluation_id: string
          gst_bank_mismatch?: number | null
          gst_bank_mismatch_flag?: boolean | null
          id?: string
          net_profit?: number | null
          raw_extraction?: Json | null
          revenue?: Json | null
          revenue_growth?: Json | null
          total_debt?: number | null
          total_equity?: number | null
          updated_at?: string
        }
        Update: {
          active_legal_cases?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio?: number | null
          debt_to_equity?: number | null
          dscr?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          evaluation_id?: string
          gst_bank_mismatch?: number | null
          gst_bank_mismatch_flag?: boolean | null
          id?: string
          net_profit?: number | null
          raw_extraction?: Json | null
          revenue?: Json | null
          revenue_growth?: Json | null
          total_debt?: number | null
          total_equity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_financials_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: true
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_recommendations: {
        Row: {
          approval_percentage: number | null
          base_rate: number | null
          created_at: string
          evaluation_id: string
          id: string
          rationale: string | null
          recommended_amount: number
          requested_amount: number
          risk_category: Database["public"]["Enums"]["risk_category"]
          risk_premium: number | null
          suggested_interest_rate: number | null
          updated_at: string
        }
        Insert: {
          approval_percentage?: number | null
          base_rate?: number | null
          created_at?: string
          evaluation_id: string
          id?: string
          rationale?: string | null
          recommended_amount?: number
          requested_amount?: number
          risk_category?: Database["public"]["Enums"]["risk_category"]
          risk_premium?: number | null
          suggested_interest_rate?: number | null
          updated_at?: string
        }
        Update: {
          approval_percentage?: number | null
          base_rate?: number | null
          created_at?: string
          evaluation_id?: string
          id?: string
          rationale?: string | null
          recommended_amount?: number
          requested_amount?: number
          risk_category?: Database["public"]["Enums"]["risk_category"]
          risk_premium?: number | null
          suggested_interest_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_recommendations_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: true
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          compliance_health_score: number | null
          compliance_health_weight: number | null
          created_at: string
          evaluation_id: string
          explanation: string | null
          financial_strength_score: number | null
          financial_strength_weight: number | null
          id: string
          litigation_news_score: number | null
          litigation_news_weight: number | null
          overall_score: number
          qualitative_adjustments: Json | null
          qualitative_score: number | null
          qualitative_weight: number | null
          top_drivers: Json | null
          updated_at: string
        }
        Insert: {
          compliance_health_score?: number | null
          compliance_health_weight?: number | null
          created_at?: string
          evaluation_id: string
          explanation?: string | null
          financial_strength_score?: number | null
          financial_strength_weight?: number | null
          id?: string
          litigation_news_score?: number | null
          litigation_news_weight?: number | null
          overall_score?: number
          qualitative_adjustments?: Json | null
          qualitative_score?: number | null
          qualitative_weight?: number | null
          top_drivers?: Json | null
          updated_at?: string
        }
        Update: {
          compliance_health_score?: number | null
          compliance_health_weight?: number | null
          created_at?: string
          evaluation_id?: string
          explanation?: string | null
          financial_strength_score?: number | null
          financial_strength_weight?: number | null
          id?: string
          litigation_news_score?: number | null
          litigation_news_weight?: number | null
          overall_score?: number
          qualitative_adjustments?: Json | null
          qualitative_score?: number | null
          qualitative_weight?: number | null
          top_drivers?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: true
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          evaluation_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          parsed_data: Json | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["document_type"]
          evaluation_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          parsed_data?: Json | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          evaluation_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          parsed_data?: Json | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_documents_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "credit_officer" | "analyst"
      document_status: "uploading" | "uploaded" | "parsing" | "parsed" | "error"
      document_type:
        | "annual_report"
        | "gst_data"
        | "bank_statement"
        | "legal_notice"
        | "rating_report"
      evaluation_status: "draft" | "in_progress" | "completed" | "archived"
      risk_category: "low" | "medium" | "high"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "credit_officer", "analyst"],
      document_status: ["uploading", "uploaded", "parsing", "parsed", "error"],
      document_type: [
        "annual_report",
        "gst_data",
        "bank_statement",
        "legal_notice",
        "rating_report",
      ],
      evaluation_status: ["draft", "in_progress", "completed", "archived"],
      risk_category: ["low", "medium", "high"],
    },
  },
} as const
