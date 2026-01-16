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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string
          account_type: string
          balance: number
          category: Database["public"]["Enums"]["account_category"] | null
          created_at: string
          currency: string
          id: string
          is_sub_account: boolean | null
          parent_account_id: string | null
          routing_number: string
          secondary_balance: number | null
          secondary_currency: string | null
          status: string
          sub_account_has_login: boolean | null
          sub_account_name: string | null
          tier: Database["public"]["Enums"]["account_tier"] | null
          transfer_limit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_type?: string
          balance?: number
          category?: Database["public"]["Enums"]["account_category"] | null
          created_at?: string
          currency?: string
          id?: string
          is_sub_account?: boolean | null
          parent_account_id?: string | null
          routing_number?: string
          secondary_balance?: number | null
          secondary_currency?: string | null
          status?: string
          sub_account_has_login?: boolean | null
          sub_account_name?: string | null
          tier?: Database["public"]["Enums"]["account_tier"] | null
          transfer_limit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          balance?: number
          category?: Database["public"]["Enums"]["account_category"] | null
          created_at?: string
          currency?: string
          id?: string
          is_sub_account?: boolean | null
          parent_account_id?: string | null
          routing_number?: string
          secondary_balance?: number | null
          secondary_currency?: string | null
          status?: string
          sub_account_has_login?: boolean | null
          sub_account_name?: string | null
          tier?: Database["public"]["Enums"]["account_tier"] | null
          transfer_limit?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          secret_key: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          secret_key: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          secret_key?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          description: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          description: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          description?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      admin_ip_whitelist: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
        }
        Relationships: []
      }
      authorized_users: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          invited_email: string | null
          permission_level: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          invited_email?: string | null
          permission_level?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          invited_email?: string | null
          permission_level?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_users_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_address: string | null
          business_name: string
          business_type: string
          created_at: string | null
          ein: string | null
          id: string
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verification_status: string | null
        }
        Insert: {
          business_address?: string | null
          business_name: string
          business_type: string
          created_at?: string | null
          ein?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Update: {
          business_address?: string | null
          business_name?: string
          business_type?: string
          created_at?: string | null
          ein?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Relationships: []
      }
      credit_scores: {
        Row: {
          created_at: string
          factors: Json | null
          id: string
          score: number
          score_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          factors?: Json | null
          id?: string
          score: number
          score_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          factors?: Json | null
          id?: string
          score?: number
          score_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          from_currency: string
          id: string
          rate: number
          to_currency: string
          updated_at: string
        }
        Insert: {
          from_currency: string
          id?: string
          rate: number
          to_currency: string
          updated_at?: string
        }
        Update: {
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          account_id: string
          amount: number
          client_email: string
          client_name: string
          created_at: string | null
          due_date: string
          id: string
          invoice_number: string
          items: Json
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          client_email: string
          client_name: string
          created_at?: string | null
          due_date: string
          id?: string
          invoice_number: string
          items?: Json
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          client_email?: string
          client_name?: string
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      linked_banks: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at: string
          id: string
          nickname: string | null
          routing_number: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at?: string
          id?: string
          nickname?: string | null
          routing_number: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          id?: string
          nickname?: string | null
          routing_number?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_low_balance: boolean
          email_scheduled_payments: boolean
          email_transactions: boolean
          id: string
          low_balance_threshold: number
          sms_low_balance: boolean
          sms_transactions: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_low_balance?: boolean
          email_scheduled_payments?: boolean
          email_transactions?: boolean
          id?: string
          low_balance_threshold?: number
          sms_low_balance?: boolean
          sms_transactions?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_low_balance?: boolean
          email_scheduled_payments?: boolean
          email_transactions?: boolean
          id?: string
          low_balance_threshold?: number
          sms_low_balance?: boolean
          sms_transactions?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      privileged_users: {
        Row: {
          can_deposit: boolean
          can_request_reversal: boolean
          created_at: string
          email: string
          id: string
          instant_reversal: boolean
        }
        Insert: {
          can_deposit?: boolean
          can_request_reversal?: boolean
          created_at?: string
          email: string
          id?: string
          instant_reversal?: boolean
        }
        Update: {
          can_deposit?: boolean
          can_request_reversal?: boolean
          created_at?: string
          email?: string
          id?: string
          instant_reversal?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_international: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_international?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_international?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reversal_requests: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          reason: string | null
          status: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reversal_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reversal_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_payments: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          next_payment_date: string
          recipient_account: string
          recipient_bank: string | null
          recipient_name: string
          recipient_routing: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          next_payment_date: string
          recipient_account: string
          recipient_bank?: string | null
          recipient_name: string
          recipient_routing: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          next_payment_date?: string
          recipient_account?: string
          recipient_bank?: string | null
          recipient_name?: string
          recipient_routing?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          recipient_account: string | null
          recipient_bank: string | null
          recipient_country: string | null
          recipient_name: string | null
          recipient_routing: string | null
          reference_number: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          recipient_account?: string | null
          recipient_bank?: string | null
          recipient_country?: string | null
          recipient_name?: string | null
          recipient_routing?: string | null
          reference_number?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          recipient_account?: string | null
          recipient_bank?: string | null
          recipient_country?: string | null
          recipient_name?: string | null
          recipient_routing?: string | null
          reference_number?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_tier_transfer_limit:
        | {
            Args: {
              category: Database["public"]["Enums"]["account_category"]
              tier: Database["public"]["Enums"]["account_tier"]
            }
            Returns: number
          }
        | {
            Args: {
              category: Database["public"]["Enums"]["account_category"]
              tier: Database["public"]["Enums"]["account_tier"]
            }
            Returns: number
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      internal_transfer: {
        Args: {
          recipient_account_number: string
          sender_user_id: string
          transfer_amount: number
          transfer_description?: string
        }
        Returns: Json
      }
      is_account_owner: { Args: { check_account_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_parent_account_owner: { Args: { parent_id: string }; Returns: boolean }
      process_reversal: {
        Args: { p_transaction_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      account_category: "personal" | "business"
      account_tier: "free" | "plus" | "pro" | "enterprise"
      app_role: "super_admin" | "admin" | "viewer"
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
      account_category: ["personal", "business"],
      account_tier: ["free", "plus", "pro", "enterprise"],
      app_role: ["super_admin", "admin", "viewer"],
    },
  },
} as const
