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
      presentation_submissions: {
        Row: {
          submitter_id: string;
          title: string | null;
          abstract: string | null;
          is_submitted: boolean | null;
          presentation_type:
            | Database["public"]["Enums"]["presentation_type"]
            | null;
          learning_points: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          submitter_id: string;
          title?: string | null;
          abstract?: string | null;
          is_submitted?: boolean | null;
          presentation_type?:
            | Database["public"]["Enums"]["presentation_type"]
            | null;
          learning_points?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          submitter_id?: string;
          title?: string | null;
          abstract?: string | null;
          is_submitted?: boolean | null;
          presentation_type?:
            | Database["public"]["Enums"]["presentation_type"]
            | null;
          learning_points?: string | null;
          id?: string;
          updated_at?: string | null;
        };
      };
      accepted_presentations: {
        Row: {
          id: string;
          accepted_at: string;
          scheduled_for: string | null;
        };
        Insert: {
          id: string;
          accepted_at: string;
          scheduled_for?: string | null;
        };
        Update: {
          id?: string;
          accepted_at?: string;
          scheduled_for?: string | null;
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
      profiles: {
        Row: {
          id: string;
          firstname: string | null;
          lastname: string | null;
          avatar_url: string | null;
          website: string | null;
          bio: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          firstname?: string | null;
          lastname?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          bio?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          firstname?: string | null;
          lastname?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          bio?: string | null;
          updated_at?: string | null;
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
    };
    Views: {
      all_presentations: {
        Row: {
          presentation_id: string | null;
          scheduled_for: string | null;
          title: string | null;
          abstract: string | null;
          presentation_type:
            | Database["public"]["Enums"]["presentation_type"]
            | null;
          primary_presenter: string | null;
          all_presenters: string[] | null;
          all_presenters_names: string[] | null;
        };
      };
      my_submissions: {
        Row: {
          presentation_id: string | null;
          title: string | null;
          abstract: string | null;
          learning_points: string | null;
          presentation_type:
            | Database["public"]["Enums"]["presentation_type"]
            | null;
          submitter_id: string | null;
          is_submitted: boolean | null;
          all_presenters_ids: string[] | null;
          all_firstnames: string[] | null;
          all_lastnames: string[] | null;
          all_emails: string[] | null;
        };
      };
    };
    Functions: {
      get_all_presentations: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      get_email_by_id: {
        Args: { user_id: string };
        Returns: string;
      };
      get_my_submissions: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      get_presentation_ids:
        | {
            Args: Record<PropertyKey, never>;
            Returns: string[];
          }
        | {
            Args: { p_id: string };
            Returns: string[];
          };
      is_ok:
        | {
            Args: Record<string, unknown>;
            Returns: boolean;
          }
        | {
            Args: Record<string, unknown>;
            Returns: boolean;
          };
    };
    Enums: {
      presentation_type: "7x7" | "full length" | "panel" | "15 minutes";
    };
  };
}

