export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_favourites_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "container_groups_presentation_id_fkey"
            columns: ["presentation_id"]
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      log: {
        Row: {
          created_at: string
          id: number
          message: string
          severity: Database["public"]["Enums"]["log_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message: string
          severity: Database["public"]["Enums"]["log_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          severity?: Database["public"]["Enums"]["log_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
        Relationships: [
          {
            foreignKeyName: "log_viewers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      presentation_presenters: {
        Row: {
          presentation_id: string
          presenter_id: string
        }
        Insert: {
          presentation_id: string
          presenter_id: string
        }
        Update: {
          presentation_id?: string
          presenter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_presenters_presentation_id_fkey"
            columns: ["presentation_id"]
            referencedRelation: "presentation_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_presenters_presenter_id_fkey"
            columns: ["presenter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      presentation_submissions: {
        Row: {
          abstract: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      all_presentations: {
        Row: {
          abstract: string
          all_presenter_firstnames: string[]
          all_presenter_lastnames: string[]
          all_presenters: string[]
          all_presenters_names: string[]
          presentation_id: string
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          primary_presenter: string
          scheduled_for: string | null
          title: string
          year: Database["public"]["Enums"]["summit_year"]
        }
        Relationships: []
      }
      my_submissions: {
        Row: {
          abstract: string
          all_emails: string[]
          all_firstnames: string[]
          all_lastnames: string[]
          all_presenters_ids: string[]
          is_submitted: boolean
          learning_points: string
          presentation_id: string
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          submitter_id: string
          title: string
        }
        Relationships: []
      }
    }
    Functions: {
      get_all_presentations: {
        Args: Record<PropertyKey, never>
        Returns: {
          presentation_id: string
          scheduled_for: string
          year: Database["public"]["Enums"]["summit_year"]
          title: string
          abstract: string
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          primary_presenter: string
          all_presenters: string[]
          all_presenters_names: string[]
          all_presenter_firstnames: string[]
          all_presenter_lastnames: string[]
        }[]
      }
      get_email_by_id: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      get_my_submissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          presentation_id: string
          title: string
          abstract: string
          learning_points: string
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          submitter_id: string
          is_submitted: boolean
          all_presenters_ids: string[]
          all_firstnames: string[]
          all_lastnames: string[]
          all_emails: string[]
        }[]
      }
      get_presentation_ids:
        | {
            Args: {
              p_id: string
            }
            Returns: unknown
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: unknown
          }
      get_reviewable_submissions: {
        Args: {
          year: string
        }
        Returns: {
          presentation_id: string
          title: string
          abstract: string
          presentation_type: Database["public"]["Enums"]["presentation_type"]
          learning_points: string
          presenters: Json
          updated_at: string
        }[]
      }
      is_ok:
        | {
            Args: {
              "": unknown
            }
            Returns: boolean
          }
        | {
            Args: {
              "": unknown
            }
            Returns: boolean
          }
      presenter_email_lookup: {
        Args: {
          "": unknown
        }
        Returns: {
          email: string
          id: string
        }[]
      }
    }
    Enums: {
      log_type: "info" | "error" | "severe"
      mentoring_type: "mentor" | "mentee"
      presentation_type:
        | "7x7"
        | "full length"
        | "panel"
        | "15 minutes"
        | "quiz"
        | "session-container"
      summit_year: "2020" | "2021" | "2022" | "2023"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
