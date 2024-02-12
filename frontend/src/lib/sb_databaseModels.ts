export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      accepted_presentations: {
        Row: {
          accepted_at: string;
          id: string;
          scheduled_for: string | null;
          year: Database['public']['Enums']['summit_year'];
        };
        Insert: {
          accepted_at?: string;
          id: string;
          scheduled_for?: string | null;
          year: Database['public']['Enums']['summit_year'];
        };
        Update: {
          accepted_at?: string;
          id?: string;
          scheduled_for?: string | null;
          year?: Database['public']['Enums']['summit_year'];
        };
        Relationships: [
          {
            foreignKeyName: 'accepted_presentations_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'presentation_submissions';
            referencedColumns: ['id'];
          }
        ];
      };
      agenda_favourites: {
        Row: {
          presentation_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          presentation_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          presentation_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agenda_favourites_presentation_id_fkey';
            columns: ['presentation_id'];
            isOneToOne: false;
            referencedRelation: 'presentation_submissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'agenda_favourites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'container_groups_container_id_fkey';
            columns: ['container_id'];
            isOneToOne: false;
            referencedRelation: 'presentation_submissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'container_groups_presentation_id_fkey';
            columns: ['presentation_id'];
            isOneToOne: false;
            referencedRelation: 'presentation_submissions';
            referencedColumns: ['id'];
          }
        ];
      };
      email_lookup: {
        Row: {
          email: string;
          id: string;
        };
        Insert: {
          email: string;
          id: string;
        };
        Update: {
          email?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_lookup_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      log: {
        Row: {
          created_at: string;
          id: number;
          message: string;
          severity: Database['public']['Enums']['log_type'];
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          message: string;
          severity: Database['public']['Enums']['log_type'];
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          message?: string;
          severity?: Database['public']['Enums']['log_type'];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'log_viewers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      mentoring: {
        Row: {
          created_at: string;
          email: string;
          entry_type: Database['public']['Enums']['mentoring_type'];
          firstname: string;
          lastname: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          entry_type: Database['public']['Enums']['mentoring_type'];
          firstname: string;
          lastname: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          entry_type?: Database['public']['Enums']['mentoring_type'];
          firstname?: string;
          lastname?: string;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: 'organizers_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'presentation_presenters_presentation_id_fkey';
            columns: ['presentation_id'];
            isOneToOne: false;
            referencedRelation: 'presentation_submissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'presentation_presenters_presenter_id_fkey';
            columns: ['presenter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      presentation_submissions: {
        Row: {
          abstract: string;
          id: string;
          is_submitted: boolean;
          learning_points: string | null;
          presentation_type: Database['public']['Enums']['presentation_type'];
          submitter_id: string;
          title: string;
          updated_at: string;
          year: Database['public']['Enums']['summit_year'];
        };
        Insert: {
          abstract: string;
          id?: string;
          is_submitted: boolean;
          learning_points?: string | null;
          presentation_type: Database['public']['Enums']['presentation_type'];
          submitter_id: string;
          title: string;
          updated_at?: string;
          year: Database['public']['Enums']['summit_year'];
        };
        Update: {
          abstract?: string;
          id?: string;
          is_submitted?: boolean;
          learning_points?: string | null;
          presentation_type?: Database['public']['Enums']['presentation_type'];
          submitter_id?: string;
          title?: string;
          updated_at?: string;
          year?: Database['public']['Enums']['summit_year'];
        };
        Relationships: [
          {
            foreignKeyName: 'presentation_submissions_submitter_id_fkey';
            columns: ['submitter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          firstname: string;
          id: string;
          lastname: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          firstname: string;
          id: string;
          lastname: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          firstname?: string;
          id?: string;
          lastname?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'public_profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: 'timezone_preferences_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      video_links: {
        Row: {
          presentation_id: string;
          url: string | null;
        };
        Insert: {
          presentation_id: string;
          url?: string | null;
        };
        Update: {
          presentation_id?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'video_links_presentation_id_fkey';
            columns: ['presentation_id'];
            isOneToOne: true;
            referencedRelation: 'presentation_submissions';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      all_presentations: {
        Row: {
          abstract: string;
          all_presenter_firstnames: string[];
          all_presenter_lastnames: string[];
          all_presenters: string[];
          all_presenters_names: string[];
          presentation_id: string;
          presentation_type: Database['public']['Enums']['presentation_type'];
          primary_presenter: string;
          scheduled_for: string | null;
          title: string;
          year: Database['public']['Enums']['summit_year'];
        };
        Relationships: [];
      };
      my_submissions: {
        Row: {
          abstract: string;
          all_emails: string[];
          all_firstnames: string[];
          all_lastnames: string[];
          all_presenters_ids: string[];
          is_submitted: boolean;
          learning_points: string;
          presentation_id: string;
          presentation_type: Database['public']['Enums']['presentation_type'];
          submitter_id: string;
          title: string;
          year: Database['public']['Enums']['summit_year'];
        };
        Relationships: [];
      };
    };
    Functions: {
      get_all_presentations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          presentation_id: string;
          scheduled_for: string;
          year: Database['public']['Enums']['summit_year'];
          title: string;
          abstract: string;
          presentation_type: Database['public']['Enums']['presentation_type'];
          primary_presenter: string;
          all_presenters: string[];
          all_presenters_names: string[];
          all_presenter_firstnames: string[];
          all_presenter_lastnames: string[];
        }[];
      };
      get_email_by_id: {
        Args: {
          user_id: string;
        };
        Returns: string;
      };
      get_my_submissions: {
        Args: Record<PropertyKey, never>;
        Returns: {
          presentation_id: string;
          title: string;
          abstract: string;
          learning_points: string;
          presentation_type: Database['public']['Enums']['presentation_type'];
          submitter_id: string;
          is_submitted: boolean;
          year: Database['public']['Enums']['summit_year'];
          all_presenters_ids: string[];
          all_firstnames: string[];
          all_lastnames: string[];
          all_emails: string[];
        }[];
      };
      get_presentation_ids:
        | {
            Args: Record<PropertyKey, never>;
            Returns: unknown;
          }
        | {
            Args: {
              p_id: string;
            };
            Returns: unknown;
          };
      get_reviewable_submissions: {
        Args: {
          target_year: Database['public']['Enums']['summit_year'];
        };
        Returns: {
          presentation_id: string;
          title: string;
          abstract: string;
          presentation_type: Database['public']['Enums']['presentation_type'];
          learning_points: string;
          submitter_id: string;
          presenters: Database['public']['CompositeTypes']['presenter_info'][];
          updated_at: string;
        }[];
      };
      is_ok:
        | {
            Args: {
              '': unknown;
            };
            Returns: boolean;
          }
        | {
            Args: {
              '': unknown;
            };
            Returns: boolean;
          };
      presenter_email_lookup: {
        Args: {
          '': unknown;
        };
        Returns: {
          email: string;
          id: string;
        }[];
      };
    };
    Enums: {
      log_type: 'info' | 'error' | 'severe';
      mentoring_type: 'mentor' | 'mentee';
      presentation_type:
        | '7x7'
        | 'full length'
        | 'panel'
        | '15 minutes'
        | 'quiz'
        | 'session-container';
      summit_year: '2020' | '2021' | '2022' | '2024';
    };
    CompositeTypes: {
      presenter_info: {
        id: string;
        firstname: string;
        lastname: string;
      };
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string;
          name: string;
          owner: string;
          metadata: Json;
        };
        Returns: undefined;
      };
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: unknown;
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
      Database['public']['Views'])
  ? (Database['public']['Tables'] &
      Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never;
