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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activities_description: string | null
          bathroom_notes: string | null
          behavior_notes: string | null
          child_id: string
          created_at: string
          health_notes: string | null
          id: string
          log_date: string
          logged_by: string
          meal_breakfast: Database["public"]["Enums"]["meal_status"] | null
          meal_lunch: Database["public"]["Enums"]["meal_status"] | null
          meal_snack: Database["public"]["Enums"]["meal_status"] | null
          mood: Database["public"]["Enums"]["mood_type"] | null
          nap_duration: number | null
          nap_quality: Database["public"]["Enums"]["nap_quality"] | null
          photos: Json | null
        }
        Insert: {
          activities_description?: string | null
          bathroom_notes?: string | null
          behavior_notes?: string | null
          child_id: string
          created_at?: string
          health_notes?: string | null
          id?: string
          log_date?: string
          logged_by: string
          meal_breakfast?: Database["public"]["Enums"]["meal_status"] | null
          meal_lunch?: Database["public"]["Enums"]["meal_status"] | null
          meal_snack?: Database["public"]["Enums"]["meal_status"] | null
          mood?: Database["public"]["Enums"]["mood_type"] | null
          nap_duration?: number | null
          nap_quality?: Database["public"]["Enums"]["nap_quality"] | null
          photos?: Json | null
        }
        Update: {
          activities_description?: string | null
          bathroom_notes?: string | null
          behavior_notes?: string | null
          child_id?: string
          created_at?: string
          health_notes?: string | null
          id?: string
          log_date?: string
          logged_by?: string
          meal_breakfast?: Database["public"]["Enums"]["meal_status"] | null
          meal_lunch?: Database["public"]["Enums"]["meal_status"] | null
          meal_snack?: Database["public"]["Enums"]["meal_status"] | null
          mood?: Database["public"]["Enums"]["mood_type"] | null
          nap_duration?: number | null
          nap_quality?: Database["public"]["Enums"]["nap_quality"] | null
          photos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          class_id: string | null
          content: string
          expires_at: string | null
          id: string
          posted_at: string
          posted_by: string
          school_id: string | null
          target_audience: Database["public"]["Enums"]["announcement_audience"]
          title: string
        }
        Insert: {
          class_id?: string | null
          content: string
          expires_at?: string | null
          id?: string
          posted_at?: string
          posted_by: string
          school_id?: string | null
          target_audience?: Database["public"]["Enums"]["announcement_audience"]
          title: string
        }
        Update: {
          class_id?: string | null
          content?: string
          expires_at?: string | null
          id?: string
          posted_at?: string
          posted_by?: string
          school_id?: string | null
          target_audience?: Database["public"]["Enums"]["announcement_audience"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in_by: string | null
          check_in_time: string | null
          check_out_by: string | null
          check_out_time: string | null
          child_id: string
          created_at: string
          date: string
          guardian_id: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          check_in_by?: string | null
          check_in_time?: string | null
          check_out_by?: string | null
          check_out_time?: string | null
          child_id: string
          created_at?: string
          date?: string
          guardian_id?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          check_in_by?: string | null
          check_in_time?: string | null
          check_out_by?: string | null
          check_out_time?: string | null
          child_id?: string
          created_at?: string
          date?: string
          guardian_id?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_check_in_by_fkey"
            columns: ["check_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_check_out_by_fkey"
            columns: ["check_out_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      child_access_requests: {
        Row: {
          child_id: string
          created_at: string
          id: string
          note: string | null
          parent_id: string
          relationship: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          note?: string | null
          parent_id: string
          relationship?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          note?: string | null
          parent_id?: string
          relationship?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_access_requests_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          afternoon_session_enrolled: boolean
          allergies: string | null
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          dietary_restrictions: string | null
          enrollment_date: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          last_name: string
          medical_info: string | null
          photo_url: string | null
          school_id: string | null
          special_needs: string | null
          status: Database["public"]["Enums"]["child_status"]
          updated_at: string
        }
        Insert: {
          afternoon_session_enrolled?: boolean
          allergies?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: string | null
          enrollment_date?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          last_name: string
          medical_info?: string | null
          photo_url?: string | null
          school_id?: string | null
          special_needs?: string | null
          status?: Database["public"]["Enums"]["child_status"]
          updated_at?: string
        }
        Update: {
          afternoon_session_enrolled?: boolean
          allergies?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: string | null
          enrollment_date?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          last_name?: string
          medical_info?: string | null
          photo_url?: string | null
          school_id?: string | null
          special_needs?: string | null
          status?: Database["public"]["Enums"]["child_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_group: string | null
          capacity: number | null
          class_name: string
          created_at: string
          has_afternoon_session: boolean
          id: string
          level: Database["public"]["Enums"]["class_level"] | null
          school_id: string | null
          teacher_id: string | null
        }
        Insert: {
          age_group?: string | null
          capacity?: number | null
          class_name: string
          created_at?: string
          has_afternoon_session?: boolean
          id?: string
          level?: Database["public"]["Enums"]["class_level"] | null
          school_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          age_group?: string | null
          capacity?: number | null
          class_name?: string
          created_at?: string
          has_afternoon_session?: boolean
          id?: string
          level?: Database["public"]["Enums"]["class_level"] | null
          school_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_templates: {
        Row: {
          academic_year: string
          afternoon_amount: number
          class_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          extras_amount: number
          id: string
          meals_amount: number
          notes: string | null
          term: string
          total_amount: number | null
          transport_amount: number
          tuition_amount: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          afternoon_amount?: number
          class_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          extras_amount?: number
          id?: string
          meals_amount?: number
          notes?: string | null
          term: string
          total_amount?: number | null
          transport_amount?: number
          tuition_amount?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          afternoon_amount?: number
          class_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          extras_amount?: number
          id?: string
          meals_amount?: number
          notes?: string | null
          term?: string
          total_amount?: number | null
          transport_amount?: number
          tuition_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_templates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          academic_year: string
          amount_paid: number | null
          child_id: string
          created_at: string
          due_date: string | null
          extras_amount: number | null
          id: string
          meals_amount: number | null
          term: string
          total_amount: number | null
          transport_amount: number | null
          tuition_amount: number | null
        }
        Insert: {
          academic_year: string
          amount_paid?: number | null
          child_id: string
          created_at?: string
          due_date?: string | null
          extras_amount?: number | null
          id?: string
          meals_amount?: number | null
          term: string
          total_amount?: number | null
          transport_amount?: number | null
          tuition_amount?: number | null
        }
        Update: {
          academic_year?: string
          amount_paid?: number | null
          child_id?: string
          created_at?: string
          due_date?: string | null
          extras_amount?: number | null
          id?: string
          meals_amount?: number | null
          term?: string
          total_amount?: number | null
          transport_amount?: number | null
          tuition_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          child_id: string | null
          id: string
          is_authorized_pickup: boolean | null
          is_primary: boolean | null
          pickup_pin: string | null
          relationship: string | null
          user_id: string | null
        }
        Insert: {
          child_id?: string | null
          id?: string
          is_authorized_pickup?: boolean | null
          is_primary?: boolean | null
          pickup_pin?: string | null
          relationship?: string | null
          user_id?: string | null
        }
        Update: {
          child_id?: string | null
          id?: string
          is_authorized_pickup?: boolean | null
          is_primary?: boolean | null
          pickup_pin?: string | null
          relationship?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          child_id: string | null
          id: string
          is_read: boolean | null
          message_body: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          sent_at: string
          subject: string | null
        }
        Insert: {
          child_id?: string | null
          id?: string
          is_read?: boolean | null
          message_body: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          sent_at?: string
          subject?: string | null
        }
        Update: {
          child_id?: string | null
          id?: string
          is_read?: boolean | null
          message_body?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          sent_at?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          child_id: string
          created_at: string
          fee_id: string | null
          id: string
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          provider: Database["public"]["Enums"]["payment_provider"] | null
          receipt_number: string | null
          received_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          child_id: string
          created_at?: string
          fee_id?: string | null
          id?: string
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          provider?: Database["public"]["Enums"]["payment_provider"] | null
          receipt_number?: string | null
          received_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          child_id?: string
          created_at?: string
          fee_id?: string | null
          id?: string
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          provider?: Database["public"]["Enums"]["payment_provider"] | null
          receipt_number?: string | null
          received_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          school_id: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          school_name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          school_name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          school_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_fee_template: { Args: { _template_id: string }; Returns: number }
      get_children_directory: {
        Args: never
        Returns: {
          class_name: string
          first_name: string
          id: string
          last_initial: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      announcement_audience: "all" | "class" | "parents"
      app_role: "admin" | "teacher" | "parent"
      attendance_status: "present" | "absent" | "late"
      child_status: "active" | "graduated" | "withdrawn"
      class_level: "daycare" | "baby" | "middle" | "top"
      gender_type: "male" | "female"
      meal_status: "consumed" | "partial" | "none"
      mood_type: "happy" | "okay" | "upset" | "tired"
      nap_quality: "good" | "fair" | "poor" | "none"
      payment_method: "mobile_money" | "cash" | "bank"
      payment_provider: "MTN" | "Airtel" | "N/A"
      payment_status: "pending" | "completed" | "failed"
      user_status: "active" | "inactive"
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
      announcement_audience: ["all", "class", "parents"],
      app_role: ["admin", "teacher", "parent"],
      attendance_status: ["present", "absent", "late"],
      child_status: ["active", "graduated", "withdrawn"],
      class_level: ["daycare", "baby", "middle", "top"],
      gender_type: ["male", "female"],
      meal_status: ["consumed", "partial", "none"],
      mood_type: ["happy", "okay", "upset", "tired"],
      nap_quality: ["good", "fair", "poor", "none"],
      payment_method: ["mobile_money", "cash", "bank"],
      payment_provider: ["MTN", "Airtel", "N/A"],
      payment_status: ["pending", "completed", "failed"],
      user_status: ["active", "inactive"],
    },
  },
} as const
