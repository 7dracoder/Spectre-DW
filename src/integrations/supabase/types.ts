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
      action_items: {
        Row: {
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          id: string
          owner_id: string | null
          response_id: string | null
          retro_id: string
          status: Database["public"]["Enums"]["action_item_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          due_date?: string | null
          id?: string
          owner_id?: string | null
          response_id?: string | null
          retro_id: string
          status?: Database["public"]["Enums"]["action_item_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          owner_id?: string | null
          response_id?: string | null
          retro_id?: string
          status?: Database["public"]["Enums"]["action_item_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retros"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claim_text: string
          claim_type: string | null
          created_at: string
          id: string
          investigation_id: string
          source_url: string | null
          support_level: string | null
          supporting_evidence_refs: Json | null
        }
        Insert: {
          claim_text: string
          claim_type?: string | null
          created_at?: string
          id?: string
          investigation_id: string
          source_url?: string | null
          support_level?: string | null
          supporting_evidence_refs?: Json | null
        }
        Update: {
          claim_text?: string
          claim_type?: string | null
          created_at?: string
          id?: string
          investigation_id?: string
          source_url?: string | null
          support_level?: string | null
          supporting_evidence_refs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          cluster_label: number | null
          coord_x: number | null
          coord_y: number | null
          created_at: string
          embedding_model: string | null
          id: string
          investigation_id: string
          is_outlier: boolean | null
          observed_at: string | null
          platform: string | null
          source_document_id: string | null
          vector_ref: string | null
        }
        Insert: {
          cluster_label?: number | null
          coord_x?: number | null
          coord_y?: number | null
          created_at?: string
          embedding_model?: string | null
          id?: string
          investigation_id: string
          is_outlier?: boolean | null
          observed_at?: string | null
          platform?: string | null
          source_document_id?: string | null
          vector_ref?: string | null
        }
        Update: {
          cluster_label?: number | null
          coord_x?: number | null
          coord_y?: number | null
          created_at?: string
          embedding_model?: string | null
          id?: string
          investigation_id?: string
          is_outlier?: boolean | null
          observed_at?: string | null
          platform?: string | null
          source_document_id?: string | null
          vector_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      identities: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          investigation_id: string
          is_primary: boolean | null
          platform: string
          url: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          investigation_id: string
          is_primary?: boolean | null
          platform: string
          url: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          investigation_id?: string
          is_primary?: boolean | null
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      investigations: {
        Row: {
          classification: string | null
          confidence_band: string | null
          consistency_score: number | null
          context: string | null
          created_at: string
          created_by: string | null
          dossier_full: Json | null
          dossier_summary: string | null
          error_message: string | null
          github_username: string | null
          id: string
          linkedin_url: string | null
          notes: string | null
          other_profile_url: string | null
          progress: Json | null
          status: Database["public"]["Enums"]["investigation_status"]
          subject_name: string
          updated_at: string
          website_url: string | null
          x_handle: string | null
        }
        Insert: {
          classification?: string | null
          confidence_band?: string | null
          consistency_score?: number | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          dossier_full?: Json | null
          dossier_summary?: string | null
          error_message?: string | null
          github_username?: string | null
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          other_profile_url?: string | null
          progress?: Json | null
          status?: Database["public"]["Enums"]["investigation_status"]
          subject_name: string
          updated_at?: string
          website_url?: string | null
          x_handle?: string | null
        }
        Update: {
          classification?: string | null
          confidence_band?: string | null
          consistency_score?: number | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          dossier_full?: Json | null
          dossier_summary?: string | null
          error_message?: string | null
          github_username?: string | null
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          other_profile_url?: string | null
          progress?: Json | null
          status?: Database["public"]["Enums"]["investigation_status"]
          subject_name?: string
          updated_at?: string
          website_url?: string | null
          x_handle?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      response_comments: {
        Row: {
          created_at: string
          id: string
          response_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_comments_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      response_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          question_id: string
          retro_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          question_id: string
          retro_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          question_id?: string
          retro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_groups_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "retro_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_groups_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retros"
            referencedColumns: ["id"]
          },
        ]
      }
      response_upvotes: {
        Row: {
          created_at: string
          id: string
          response_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_upvotes_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          is_action_item: boolean
          question_id: string
          retro_id: string
          sentiment: number | null
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          is_action_item?: boolean
          question_id: string
          retro_id: string
          sentiment?: number | null
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          is_action_item?: boolean
          question_id?: string
          retro_id?: string
          sentiment?: number | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "response_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "retro_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retros"
            referencedColumns: ["id"]
          },
        ]
      }
      retro_participants: {
        Row: {
          id: string
          joined_at: string
          retro_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          retro_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          retro_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retro_participants_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retros"
            referencedColumns: ["id"]
          },
        ]
      }
      retro_questions: {
        Row: {
          created_at: string
          id: string
          question_text: string
          retro_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          question_text: string
          retro_id: string
          sort_order: number
        }
        Update: {
          created_at?: string
          id?: string
          question_text?: string
          retro_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "retro_questions_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retros"
            referencedColumns: ["id"]
          },
        ]
      }
      retros: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          format: string
          id: string
          project_id: string | null
          status: Database["public"]["Enums"]["retro_status"]
          team_id: string | null
          timeline_end: string | null
          timeline_start: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          format?: string
          id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["retro_status"]
          team_id?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          format?: string
          id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["retro_status"]
          team_id?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retros_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retros_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          created_at: string
          evidence_refs: Json | null
          id: string
          investigation_id: string
          polarity: string | null
          score: number | null
          signal_key: string
          summary: string | null
          title: string
          url: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          evidence_refs?: Json | null
          id?: string
          investigation_id: string
          polarity?: string | null
          score?: number | null
          signal_key: string
          summary?: string | null
          title: string
          url?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          evidence_refs?: Json | null
          id?: string
          investigation_id?: string
          polarity?: string | null
          score?: number | null
          signal_key?: string
          summary?: string | null
          title?: string
          url?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      source_documents: {
        Row: {
          fetched_at: string
          id: string
          investigation_id: string
          platform: string | null
          published_at: string | null
          raw_text: string | null
          source_type: string | null
          structured_json: Json | null
          title: string | null
          url: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          investigation_id: string
          platform?: string | null
          published_at?: string | null
          raw_text?: string | null
          source_type?: string | null
          structured_json?: Json | null
          title?: string | null
          url: string
        }
        Update: {
          fetched_at?: string
          id?: string
          investigation_id?: string
          platform?: string | null
          published_at?: string | null
          raw_text?: string | null
          source_type?: string | null
          structured_json?: Json | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      timeline_entries: {
        Row: {
          created_at: string
          description: string
          entry_date: string
          entry_time: string | null
          id: string
          retro_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          entry_date: string
          entry_time?: string | null
          id?: string
          retro_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          entry_date?: string
          entry_time?: string | null
          id?: string
          retro_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_entries_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retros"
            referencedColumns: ["id"]
          },
        ]
      }
      top3_entries: {
        Row: {
          created_at: string
          id: string
          rank: number
          retro_id: string
          text: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rank: number
          retro_id: string
          text: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rank?: number
          retro_id?: string
          text?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "top3_entries_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retros"
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
      action_item_status: "open" | "done"
      investigation_status: "pending" | "running" | "complete" | "failed"
      retro_status: "open" | "closed"
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
      action_item_status: ["open", "done"],
      investigation_status: ["pending", "running", "complete", "failed"],
      retro_status: ["open", "closed"],
    },
  },
} as const
