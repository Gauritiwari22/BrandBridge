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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_codes: {
        Row: {
          brand_id: string
          campaign_id: string | null
          clicks: number | null
          code: string
          commission_pct: number | null
          conversions: number | null
          created_at: string
          creator_id: string
          id: string
          revenue: number | null
          updated_at: string
          url: string | null
        }
        Insert: {
          brand_id: string
          campaign_id?: string | null
          clicks?: number | null
          code: string
          commission_pct?: number | null
          conversions?: number | null
          created_at?: string
          creator_id: string
          id?: string
          revenue?: number | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          brand_id?: string
          campaign_id?: string | null
          clicks?: number | null
          code?: string
          commission_pct?: number | null
          conversions?: number | null
          created_at?: string
          creator_id?: string
          id?: string
          revenue?: number | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_codes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_codes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_match_score: number | null
          campaign_id: string
          created_at: string
          creator_id: string
          id: string
          pitch: string | null
          proposed_rate: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          ai_match_score?: number | null
          campaign_id: string
          created_at?: string
          creator_id: string
          id?: string
          pitch?: string | null
          proposed_rate?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          ai_match_score?: number | null
          campaign_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          pitch?: string | null
          proposed_rate?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_analytics: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          created_at: string
          engagements: number | null
          id: string
          impressions: number | null
          reach: number | null
          recorded_on: string
          spend: number | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          engagements?: number | null
          id?: string
          impressions?: number | null
          reach?: number | null
          recorded_on?: string
          spend?: number | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          engagements?: number | null
          id?: string
          impressions?: number | null
          reach?: number | null
          recorded_on?: string
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand_id: string
          budget: number
          category: string | null
          cover_url: string | null
          created_at: string
          deliverables: string | null
          description: string | null
          end_date: string | null
          id: string
          min_engagement: number | null
          min_followers: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_niches: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          budget?: number
          category?: string | null
          cover_url?: string | null
          created_at?: string
          deliverables?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          min_engagement?: number | null
          min_followers?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_niches?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          budget?: number
          category?: string | null
          cover_url?: string | null
          created_at?: string
          deliverables?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          min_engagement?: number | null
          min_followers?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_niches?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          brand_id: string
          brand_signature: string | null
          brand_signed_at: string | null
          campaign_id: string | null
          created_at: string
          creator_id: string
          creator_signature: string | null
          creator_signed_at: string | null
          deliverables: string | null
          due_date: string | null
          id: string
          status: Database["public"]["Enums"]["contract_status"]
          terms: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          brand_id: string
          brand_signature?: string | null
          brand_signed_at?: string | null
          campaign_id?: string | null
          created_at?: string
          creator_id: string
          creator_signature?: string | null
          creator_signed_at?: string | null
          deliverables?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          terms: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          brand_id?: string
          brand_signature?: string | null
          brand_signed_at?: string | null
          campaign_id?: string | null
          created_at?: string
          creator_id?: string
          creator_signature?: string | null
          creator_signed_at?: string | null
          deliverables?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          terms?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          brochure_url: string | null
          category: string | null
          college: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          event_date: string | null
          expected_footfall: number | null
          funding_goal: number | null
          funding_raised: number | null
          id: string
          location: string | null
          organizer_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brochure_url?: string | null
          category?: string | null
          college?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          expected_footfall?: number | null
          funding_goal?: number | null
          funding_raised?: number | null
          id?: string
          location?: string | null
          organizer_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brochure_url?: string | null
          category?: string | null
          college?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          expected_footfall?: number | null
          funding_goal?: number | null
          funding_raised?: number | null
          id?: string
          location?: string | null
          organizer_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          authenticity_score: number | null
          avatar_url: string | null
          bio: string | null
          brand_name: string | null
          college: string | null
          created_at: string
          email: string | null
          engagement_rate: number | null
          followers: number | null
          full_name: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          location: string | null
          niche: string[] | null
          role: Database["public"]["Enums"]["user_role"]
          skills: string[] | null
          trust_score: number | null
          twitter: string | null
          updated_at: string
          verified: boolean | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          authenticity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          brand_name?: string | null
          college?: string | null
          created_at?: string
          email?: string | null
          engagement_rate?: number | null
          followers?: number | null
          full_name?: string | null
          id: string
          instagram?: string | null
          linkedin?: string | null
          location?: string | null
          niche?: string[] | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          trust_score?: number | null
          twitter?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          authenticity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          brand_name?: string | null
          college?: string | null
          created_at?: string
          email?: string | null
          engagement_rate?: number | null
          followers?: number | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          location?: string | null
          niche?: string[] | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          trust_score?: number | null
          twitter?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      sponsorships: {
        Row: {
          brand_id: string
          created_at: string
          event_id: string
          id: string
          message: string | null
          offer_amount: number
          status: Database["public"]["Enums"]["sponsorship_status"]
          tier: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          event_id: string
          id?: string
          message?: string | null
          offer_amount: number
          status?: Database["public"]["Enums"]["sponsorship_status"]
          tier?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          event_id?: string
          id?: string
          message?: string | null
          offer_amount?: number
          status?: Database["public"]["Enums"]["sponsorship_status"]
          tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      campaign_status:
        | "draft"
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
      contract_status:
        | "draft"
        | "sent"
        | "signed_creator"
        | "signed_brand"
        | "active"
        | "completed"
      sponsorship_status: "proposed" | "accepted" | "rejected" | "paid"
      user_role: "brand" | "influencer" | "student" | "organizer" | "business"
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
      application_status: ["pending", "accepted", "rejected", "withdrawn"],
      campaign_status: [
        "draft",
        "open",
        "in_progress",
        "completed",
        "cancelled",
      ],
      contract_status: [
        "draft",
        "sent",
        "signed_creator",
        "signed_brand",
        "active",
        "completed",
      ],
      sponsorship_status: ["proposed", "accepted", "rejected", "paid"],
      user_role: ["brand", "influencer", "student", "organizer", "business"],
    },
  },
} as const
