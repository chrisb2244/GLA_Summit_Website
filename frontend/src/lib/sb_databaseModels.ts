export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string;
          firstname: string;
          lastname: string;
          avatar_url: string | null;
          website: string | null;
          bio: string | null;
        };
        Insert: {
          id: string;
          updated_at?: string;
          firstname: string;
          lastname: string;
          avatar_url?: string | null;
          website?: string | null;
          bio?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string;
          firstname?: string;
          lastname?: string;
          avatar_url?: string | null;
          website?: string | null;
          bio?: string | null;
        };
      };
      accepted_presentations: {
        Row: {
          id: string;
          accepted_at: string;
          scheduled_for: string | null;
          year: Database["public"]["Enums"]["summit_year"];
        };
        Insert: {
          id: string;
          accepted_at?: string;
          scheduled_for?: string | null;
          year: Database["public"]["Enums"]["summit_year"];
        };
        Update: {
          id?: string;
          accepted_at?: string;
          scheduled_for?: string | null;
          year?: Database["public"]["Enums"]["summit_year"];
        };
      };
      presentation_submissions: {
        Row: {
          id: string;
          submitter_id: string;
          updated_at: string;
          title: string;
          abstract: string;
          is_submitted: boolean;
          presentation_type: Database["public"]["Enums"]["presentation_type"];
          learning_points: string | null;
        };
        Insert: {
          id?: string;
          submitter_id: string;
          updated_at?: string;
          title: string;
          abstract: string;
          is_submitted: boolean;
          presentation_type: Database["public"]["Enums"]["presentation_type"];
          learning_points?: string | null;
        };
        Update: {
          id?: string;
          submitter_id?: string;
          updated_at?: string;
          title?: string;
          abstract?: string;
          is_submitted?: boolean;
          presentation_type?: Database["public"]["Enums"]["presentation_type"];
          learning_points?: string | null;
        };
      };
      email_lookup: {
        Row: {
          id: string;
          email: string;
        };
        Insert: {
          id: string;
          email: string;
        };
        Update: {
          id?: string;
          email?: string;
        };
      };
      presentation_presenters: {
        Row: {
          presentation_id: string;
          presenter_id: string;
        };
        Insert: {
          presentation_id: string;
          presenter_id: string;
        };
        Update: {
          presentation_id?: string;
          presenter_id?: string;
        };
      };
      organizers: {
        Row: {
          id: string;
        };
        Insert: {
          id: string;
        };
        Update: {
          id?: string;
        };
      };
      mentoring: {
        Row: {
          email: string;
          firstname: string;
          lastname: string;
          entry_type: Database["public"]["Enums"]["mentoring_type"];
          created_at: string;
        };
        Insert: {
          email: string;
          firstname: string;
          lastname: string;
          entry_type: Database["public"]["Enums"]["mentoring_type"];
          created_at?: string;
        };
        Update: {
          email?: string;
          firstname?: string;
          lastname?: string;
          entry_type?: Database["public"]["Enums"]["mentoring_type"];
          created_at?: string;
        };
      };
      public_profiles: {
        Row: {
          id: string;
        };
        Insert: {
          id: string;
        };
        Update: {
          id?: string;
        };
      };
      timezone_preferences: {
        Row: {
          id: string;
          timezone_db: string;
          timezone_name: string;
          use_24h_clock: boolean;
        };
        Insert: {
          id: string;
          timezone_db: string;
          timezone_name: string;
          use_24h_clock?: boolean;
        };
        Update: {
          id?: string;
          timezone_db?: string;
          timezone_name?: string;
          use_24h_clock?: boolean;
        };
      };
      agenda_favourites: {
        Row: {
          user_id: string;
          presentation_id: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          presentation_id: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          presentation_id?: string;
          updated_at?: string;
        };
      };
      log: {
        Row: {
          id: number;
          created_at: string;
          severity: Database["public"]["Enums"]["log_type"];
          message: string;
          user_id: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          severity: Database["public"]["Enums"]["log_type"];
          message: string;
          user_id?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          severity?: Database["public"]["Enums"]["log_type"];
          message?: string;
          user_id?: string | null;
        };
      };
      container_groups: {
        Row: {
          container_id: string;
          presentation_id: string;
        };
        Insert: {
          container_id: string;
          presentation_id: string;
        };
        Update: {
          container_id?: string;
          presentation_id?: string;
        };
      };
      log_viewers: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id: string;
        };
        Update: {
          user_id?: string;
        };
      };
    };
    Views: {
      all_presentations: {
        Row: {
          presentation_id: string;
          scheduled_for: string | null;
          year: Database["public"]["Enums"]["summit_year"];
          title: string;
          abstract: string;
          presentation_type: Database["public"]["Enums"]["presentation_type"];
          primary_presenter: string;
          all_presenters: string[];
          all_presenters_names: string[];
          all_presenter_firstnames: string[];
          all_presenter_lastnames: string[];
        };
      };
      my_submissions: {
        Row: {
          presentation_id: string;
          title: string;
          abstract: string;
          learning_points: string;
          presentation_type: Database["public"]["Enums"]["presentation_type"];
          submitter_id: string;
          is_submitted: boolean;
          all_presenters_ids: string[];
          all_firstnames: string[];
          all_lastnames: string[];
          all_emails: string[];
        };
      };
    };
    Functions: {
      is_ok:
        | {
            Args: Record<string, unknown>;
            Returns: boolean;
          }
        | {
            Args: Record<string, unknown>;
            Returns: boolean;
          };
      get_presentation_ids:
        | {
            Args: { p_id: string };
            Returns: string[];
          }
        | {
            Args: Record<PropertyKey, never>;
            Returns: string[];
          };
      get_email_by_id: {
        Args: { user_id: string };
        Returns: string;
      };
      get_my_submissions: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      presenter_email_lookup: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
      get_all_presentations: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
    };
    Enums: {
      presentation_type:
        | "7x7"
        | "full length"
        | "panel"
        | "15 minutes"
        | "quiz"
        | "session-container";
      mentoring_type: "mentor" | "mentee";
      log_type: "info" | "error" | "severe";
      summit_year: "2020" | "2021" | "2022" | "2023";
    };
  };
}

