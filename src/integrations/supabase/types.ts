export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      provider_item_prices: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          price_per_unit: number
          provider_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          price_per_unit?: number
          provider_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          price_per_unit?: number
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_item_prices_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_item_prices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_portfolio: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          provider_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          provider_id: string
        }
        Update: {
          created_at?: string | null
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
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          quote_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          quote_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          quote_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider_ratings_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_provider_ratings_quote"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          base_price: number
          created_at: string | null
          id: string
          provider_id: string
          specialty_id: string
        }
        Insert: {
          base_price?: number
          created_at?: string | null
          id?: string
          provider_id: string
          specialty_id: string
        }
        Update: {
          base_price?: number
          created_at?: string | null
          id?: string
          provider_id?: string
          specialty_id?: string
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
            foreignKeyName: "provider_services_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_settings: {
        Row: {
          bio: string | null
          city: string | null
          complement: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          provider_id: string
          service_radius_km: number | null
          state: string | null
          street: string | null
          zip_code: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          provider_id: string
          service_radius_km?: number | null
          state?: string | null
          street?: string | null
          zip_code?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          provider_id?: string
          service_radius_km?: number | null
          state?: string | null
          street?: string | null
          zip_code?: string | null
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
          created_at: string | null
          id: string
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string | null
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
      quote_answers: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          question_id: string
          quote_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          question_id: string
          quote_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          question_id?: string
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_answers_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "service_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_answers_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          quantity: number
          quote_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          quantity?: number
          quote_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          quantity?: number
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_measurements: {
        Row: {
          area: number | null
          created_at: string | null
          height: number | null
          id: string
          length: number
          quote_id: string
          room_name: string | null
          width: number
        }
        Insert: {
          area?: number | null
          created_at?: string | null
          height?: number | null
          id?: string
          length: number
          quote_id: string
          room_name?: string | null
          width: number
        }
        Update: {
          area?: number | null
          created_at?: string | null
          height?: number | null
          id?: string
          length?: number
          quote_id?: string
          room_name?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_measurements_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_providers: {
        Row: {
          created_at: string | null
          id: string
          provider_id: string
          quote_id: string
          status: string
          total_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider_id: string
          quote_id: string
          status?: string
          total_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          provider_id?: string
          quote_id?: string
          status?: string
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          city: string
          client_id: string | null
          complement: string | null
          created_at: string | null
          description: string | null
          id: string
          is_anonymous: boolean | null
          latitude: number | null
          longitude: number | null
          neighborhood: string
          number: string
          service_id: string
          specialty_id: string
          state: string
          status: string
          street: string
          sub_service_id: string
          zip_code: string
        }
        Insert: {
          city: string
          client_id?: string | null
          complement?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_anonymous?: boolean | null
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          number: string
          service_id: string
          specialty_id: string
          state: string
          status?: string
          street: string
          sub_service_id: string
          zip_code: string
        }
        Update: {
          city?: string
          client_id?: string | null
          complement?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_anonymous?: boolean | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          number?: string
          service_id?: string
          specialty_id?: string
          state?: string
          status?: string
          street?: string
          sub_service_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_sub_service_id_fkey"
            columns: ["sub_service_id"]
            isOneToOne: false
            referencedRelation: "sub_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          created_at: string | null
          id: string
          name: string
          service_id: string | null
          specialty_id: string | null
          sub_service_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          service_id?: string | null
          specialty_id?: string | null
          sub_service_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
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
          created_at: string | null
          id: string
          question: string
          service_id: string | null
          specialty_id: string | null
          sub_service_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          question: string
          service_id?: string | null
          specialty_id?: string | null
          sub_service_id?: string | null
        }
        Update: {
          created_at?: string | null
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
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          tags?: string[] | null
        }
        Relationships: []
      }
      specialties: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sub_service_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sub_service_id: string
        }
        Update: {
          created_at?: string | null
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
          created_at: string | null
          description: string | null
          id: string
          name: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          service_id: string
        }
        Update: {
          created_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_quote_answer: {
        Args: { p_quote_id: string; p_question_id: string; p_option_id: string }
        Returns: string
      }
      add_quote_item: {
        Args: { p_quote_id: string; p_item_id: string; p_quantity: number }
        Returns: string
      }
      add_quote_measurement: {
        Args: {
          p_quote_id: string
          p_room_name: string
          p_width: number
          p_length: number
          p_height?: number
        }
        Returns: string
      }
      create_user_profile: {
        Args: { user_id: string; user_name: string; user_role: string }
        Returns: boolean
      }
      get_all_providers: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          phone: string
          role: string
        }[]
      }
      get_provider_average_rating: {
        Args: { p_provider_id: string }
        Returns: number
      }
      get_provider_quotes: {
        Args: { _provider_id: string }
        Returns: {
          quote_id: string
          status: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_from_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_safely: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_anonymous_quote: {
        Args: { quote_id: string }
        Returns: boolean
      }
      submit_quote: {
        Args: {
          p_service_id: string
          p_sub_service_id?: string
          p_specialty_id?: string
          p_description?: string
          p_street?: string
          p_number?: string
          p_complement?: string
          p_neighborhood?: string
          p_city?: string
          p_state?: string
          p_zip_code?: string
          p_is_anonymous?: boolean
        }
        Returns: string
      }
      update_user_role: {
        Args: { user_id: string; new_role: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
