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
      accepted_presentations: {
        Row: {
          accepted_at: string
          id: string
          scheduled_for: string | null
          year: Database["public"]["Enums"]["summit_year"]
        }
        Insert: {
          accepted_at?: string
          id: string
          scheduled_for?: string | null
          year: Database["public"]["Enums"]["summit_year"]
        }
        Update: {
          accepted_at?: string
          id?: string
          scheduled_for?: string | null
          year?: Database["public"]["Enums"]["summit_year"]
        }
        Relationships: [
          {
            foreignKeyName: "accepted_presentations_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_favourites: {
        Row: {
          presentation_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          presentation_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          presentation_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_favourites_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmed_presentations: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmed_presentations_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "accepted_presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      container_groups: {
        Row: {
          container_id: string
          presentation_id: string
        }
        Insert: {
          container_id: string
          presentation_id: string
        }
        Update: {
          container_id?: string
          presentation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "container_groups_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "container_groups_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_lookup: {
        Row: {
          email: string
          id: string
        }
        Insert: {
          email: string
          id: string
        }
        Update: {
          email?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_lookup_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forced_conclusions: {
        Row: {
          forced_at: string
          forced_by: string | null
          outcome: string
          presentation_id: string
        }
        Insert: {
          forced_at?: string
          forced_by?: string | null
          outcome: string
          presentation_id: string
        }
        Update: {
          forced_at?: string
          forced_by?: string | null
          outcome?: string
          presentation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forced_conclusions_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: true
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      log: {
        Row: {
          context: Json | null
          created_at: string
          expires_at: string | null
          id: number
          message: string
          severity: Database["public"]["Enums"]["log_type"]
          source: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: number
          message: string
          severity: Database["public"]["Enums"]["log_type"]
          source?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: number
          message?: string
          severity?: Database["public"]["Enums"]["log_type"]
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      log_viewers: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      mentoring: {
        Row: {
          created_at: string
          email: string
          entry_type: Database["public"]["Enums"]["mentoring_type"]
          firstname: string
          lastname: string
        }
        Insert: {
          created_at?: string
          email: string
          entry_type: Database["public"]["Enums"]["mentoring_type"]
          firstname: string
          lastname: string
        }
        Update: {
          created_at?: string
          email?: string
          entry_type?: Database["public"]["Enums"]["mentoring_type"]
          firstname?: string
          lastname?: string
        }
        Relationships: []
      }
      organizers: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_presenters: {
        Row: {
          declined_count: number
          presentation_id: string
          presenter_id: string
          status: string
        }
        Insert: {
          declined_count?: number
          presentation_id: string
          presenter_id: string
          status?: string
        }
        Update: {
          declined_count?: number
          presentation_id?: string
          presenter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_presenters_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_presenters_presenter_id_fkey"
            columns: ["presenter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_submissions: {
        Row: {
          abstract: string
          consent_given_at: string | null
          id: string
          is_submitted: boolean
          learning_points: string | null
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          submitter_id: string
          title: string
          updated_at: string
          year: Database["public"]["Enums"]["summit_year"]
        }
        Insert: {
          abstract: string
          consent_given_at?: string | null
          id?: string
          is_submitted: boolean
          learning_points?: string | null
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          submitter_id: string
          title: string
          updated_at?: string
          year: Database["public"]["Enums"]["summit_year"]
        }
        Update: {
          abstract?: string
          consent_given_at?: string | null
          id?: string
          is_submitted?: boolean
          learning_points?: string | null
          presentation_type?: Database["public"]["Enums"]["presentation_type"]
          submitter_id?: string
          title?: string
          updated_at?: string
          year?: Database["public"]["Enums"]["summit_year"]
        }
        Relationships: [
          {
            foreignKeyName: "presentation_submissions_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presenter_admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      presenter_availability: {
        Row: {
          set_at: string
          slot_start: string
          user_id: string
          year: Database["public"]["Enums"]["summit_year"]
        }
        Insert: {
          set_at?: string
          slot_start: string
          user_id: string
          year: Database["public"]["Enums"]["summit_year"]
        }
        Update: {
          set_at?: string
          slot_start?: string
          user_id?: string
          year?: Database["public"]["Enums"]["summit_year"]
        }
        Relationships: [
          {
            foreignKeyName: "presenter_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          firstname: string
          id: string
          lastname: string
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          firstname: string
          id: string
          lastname: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          firstname?: string
          id?: string
          lastname?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rejected_presentations: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rejected_presentations_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_download_information: {
        Row: {
          last_downloaded: string | null
          presentation_id: string
          viewer_id: string
        }
        Insert: {
          last_downloaded?: string | null
          presentation_id: string
          viewer_id?: string
        }
        Update: {
          last_downloaded?: string | null
          presentation_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_download_information_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_concluders: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      submission_votes: {
        Row: {
          organizer_id: string
          presentation_id: string
          updated_at: string
          vote: Database["public"]["Enums"]["organizer_vote"]
        }
        Insert: {
          organizer_id: string
          presentation_id: string
          updated_at?: string
          vote: Database["public"]["Enums"]["organizer_vote"]
        }
        Update: {
          organizer_id?: string
          presentation_id?: string
          updated_at?: string
          vote?: Database["public"]["Enums"]["organizer_vote"]
        }
        Relationships: [
          {
            foreignKeyName: "submission_votes_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_votes_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_sequences: {
        Row: {
          name: string | null
          year: Database["public"]["Enums"]["summit_year"]
        }
        Insert: {
          name?: string | null
          year: Database["public"]["Enums"]["summit_year"]
        }
        Update: {
          name?: string | null
          year?: Database["public"]["Enums"]["summit_year"]
        }
        Relationships: []
      }
      tickets: {
        Row: {
          created_at: string
          ticket_number: number
          user_id: string
          year: Database["public"]["Enums"]["summit_year"]
        }
        Insert: {
          created_at?: string
          ticket_number: number
          user_id: string
          year: Database["public"]["Enums"]["summit_year"]
        }
        Update: {
          created_at?: string
          ticket_number?: number
          user_id?: string
          year?: Database["public"]["Enums"]["summit_year"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_year_fkey"
            columns: ["year"]
            isOneToOne: false
            referencedRelation: "ticket_sequences"
            referencedColumns: ["year"]
          },
        ]
      }
      timezone_preferences: {
        Row: {
          id: string
          timezone_db: string
          timezone_name: string
          use_24h_clock: boolean
        }
        Insert: {
          id: string
          timezone_db: string
          timezone_name: string
          use_24h_clock?: boolean
        }
        Update: {
          id?: string
          timezone_db?: string
          timezone_name?: string
          use_24h_clock?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "timezone_preferences_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_links: {
        Row: {
          presentation_id: string
          url: string | null
        }
        Insert: {
          presentation_id: string
          url?: string | null
        }
        Update: {
          presentation_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_links_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: true
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_submission_outcome: {
        Args: { v_outcome: string; v_pid: string }
        Returns: string
      }
      email_has_account: { Args: { p_email: string }; Returns: boolean }
      evaluate_submission: { Args: { v_pid: string }; Returns: string }
      force_submission_outcome: {
        Args: { v_outcome: string; v_pid: string }
        Returns: string
      }
      get_all_presentations: {
        Args: never
        Returns: {
          abstract: string
          all_presenter_firstnames: string[]
          all_presenter_lastnames: string[]
          all_presenters: string[]
          all_presenters_names: string[]
          presentation_id: string
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          primary_presenter: string
          scheduled_for: string
          title: string
          year: Database["public"]["Enums"]["summit_year"]
        }[]
      }
      get_editable_submission_emails: {
        Args: { p_presentation_id: string }
        Returns: string[]
      }
      get_my_submissions: {
        Args: never
        Returns: {
          abstract: string
          all_firstnames: string[]
          all_lastnames: string[]
          all_presenter_emails: string[]
          all_presenter_statuses: string[]
          all_presenters_ids: string[]
          is_submitted: boolean
          learning_points: string
          presentation_id: string
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          submitter_id: string
          title: string
          updated_at: string
          year: Database["public"]["Enums"]["summit_year"]
        }[]
      }
      get_or_create_ticket: {
        Args: { p_year: Database["public"]["Enums"]["summit_year"] }
        Returns: {
          created_at: string
          ticket_number: number
          user_id: string
          year: Database["public"]["Enums"]["summit_year"]
        }[]
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_organizer_directory: {
        Args: never
        Returns: {
          firstname: string
          id: string
          lastname: string
        }[]
      }
      get_reviewable_submissions: {
        Args: { target_year: Database["public"]["Enums"]["summit_year"] }
        Returns: {
          abstract: string
          learning_points: string
          presentation_id: string
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          presenters: Database["public"]["CompositeTypes"]["presenter_info"][]
          submitter_id: string
          title: string
          updated_at: string
        }[]
      }
      is_organizer: { Args: never; Returns: boolean }
      purge_synthetic_test_users: { Args: never; Returns: number }
    }
    Enums: {
      log_type: "info" | "error" | "severe"
      mentoring_type: "mentor" | "mentee"
      organizer_vote: "for" | "abstain" | "against"
      presentation_type:
        | "7x7"
        | "full length"
        | "panel"
        | "15 minutes"
        | "quiz"
        | "session-container"
      summit_year: "2020" | "2021" | "2022" | "2024" | "2025" | "2026"
    }
    CompositeTypes: {
      presenter_info: {
        id: string | null
        firstname: string | null
        lastname: string | null
      }
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
      log_type: ["info", "error", "severe"],
      mentoring_type: ["mentor", "mentee"],
      organizer_vote: ["for", "abstain", "against"],
      presentation_type: [
        "7x7",
        "full length",
        "panel",
        "15 minutes",
        "quiz",
        "session-container",
      ],
      summit_year: ["2020", "2021", "2022", "2024", "2025", "2026"],
    },
  },
} as const

