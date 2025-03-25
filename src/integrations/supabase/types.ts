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
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          provider_id: string
          service_radius_km: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_id: string
          service_radius_km?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_id?: string
          service_radius_km?: number | null
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
          client_id: string
          complement: string | null
          created_at: string | null
          description: string | null
          id: string
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
          client_id: string
          complement?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
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
          client_id?: string
          complement?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
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
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
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
          id: string
          name: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          service_id: string
        }
        Update: {
          created_at?: string | null
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
