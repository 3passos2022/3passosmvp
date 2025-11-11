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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      feature_limits: {
        Row: {
          created_at: string
          feature_name: string
          id: string
          limit_value: number | null
          subscription_tier: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          id?: string
          limit_value?: number | null
          subscription_tier: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          id?: string
          limit_value?: number | null
          subscription_tier?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          neighborhood: string | null
          phone: string | null
          role: string
          subscribed: boolean | null
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          role?: string
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          role?: string
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_item_prices: {
        Row: {
          created_at: string
          id: string
          price_per_unit: number
          provider_id: string
          service_item_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          price_per_unit: number
          provider_id: string
          service_item_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          price_per_unit?: number
          provider_id?: string
          service_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_item_prices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_item_prices_service_item_id_fkey"
            columns: ["service_item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_portfolio: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          provider_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_portfolio_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_ratings: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          quote_id: string
          rating: number
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          quote_id: string
          rating: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          quote_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_ratings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ratings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ratings_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          service_id: string | null
          specialty_id: string | null
          sub_service_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          service_id?: string | null
          specialty_id?: string | null
          sub_service_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          service_id?: string | null
          specialty_id?: string | null
          sub_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_sub_service_id_fkey"
            columns: ["sub_service_id"]
            isOneToOne: false
            referencedRelation: "sub_services"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_settings: {
        Row: {
          accepts_new_clients: boolean | null
          created_at: string
          id: string
          provider_id: string
          service_radius_km: number | null
          updated_at: string
        }
        Insert: {
          accepts_new_clients?: boolean | null
          created_at?: string
          id?: string
          provider_id: string
          service_radius_km?: number | null
          updated_at?: string
        }
        Update: {
          accepts_new_clients?: boolean | null
          created_at?: string
          id?: string
          provider_id?: string
          service_radius_km?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_settings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "service_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_providers: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          quote_id: string
          status: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          quote_id: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          quote_id?: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_providers_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          address: Json
          created_at: string
          description: string | null
          id: string
          items: Json | null
          measurements: Json | null
          service_date: string | null
          service_end_date: string | null
          service_id: string
          service_name: string
          service_time_preference: string | null
          specialty_id: string | null
          specialty_name: string | null
          status: string
          sub_service_id: string | null
          sub_service_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: Json
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          measurements?: Json | null
          service_date?: string | null
          service_end_date?: string | null
          service_id: string
          service_name: string
          service_time_preference?: string | null
          specialty_id?: string | null
          specialty_name?: string | null
          status?: string
          sub_service_id?: string | null
          sub_service_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          measurements?: Json | null
          service_date?: string | null
          service_end_date?: string | null
          service_id?: string
          service_name?: string
          service_time_preference?: string | null
          specialty_id?: string | null
          specialty_name?: string | null
          status?: string
          sub_service_id?: string | null
          sub_service_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          reference_value: number | null
          service_id: string | null
          specialty_id: string | null
          sub_service_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          reference_value?: number | null
          service_id?: string | null
          specialty_id?: string | null
          sub_service_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          reference_value?: number | null
          service_id?: string | null
          specialty_id?: string | null
          sub_service_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_items_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_items_sub_service_id_fkey"
            columns: ["sub_service_id"]
            isOneToOne: false
            referencedRelation: "sub_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_questions: {
        Row: {
          created_at: string
          id: string
          question: string
          service_id: string | null
          specialty_id: string | null
          sub_service_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          service_id?: string | null
          specialty_id?: string | null
          sub_service_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          service_id?: string | null
          specialty_id?: string | null
          sub_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_questions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_questions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_questions_sub_service_id_fkey"
            columns: ["sub_service_id"]
            isOneToOne: false
            referencedRelation: "sub_services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sub_service_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sub_service_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sub_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialties_sub_service_id_fkey"
            columns: ["sub_service_id"]
            isOneToOne: false
            referencedRelation: "sub_services"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          service_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          service_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          start_date: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_feature_limit: {
        Args: { p_feature_name: string; p_user_id: string }
        Returns: {
          limit_val: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
