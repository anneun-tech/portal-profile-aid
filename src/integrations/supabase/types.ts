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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ncc_details: {
        Row: {
          cadet_rank: string | null
          created_at: string | null
          enrollment_date: string | null
          ncc_id: string
          ncc_wing: Database["public"]["Enums"]["ncc_wing_type"]
          regimental_number: string | null
          student_id: string
        }
        Insert: {
          cadet_rank?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          ncc_id?: string
          ncc_wing: Database["public"]["Enums"]["ncc_wing_type"]
          regimental_number?: string | null
          student_id: string
        }
        Update: {
          cadet_rank?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          ncc_id?: string
          ncc_wing?: Database["public"]["Enums"]["ncc_wing_type"]
          regimental_number?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ncc_details_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      placements_internships: {
        Row: {
          company_name: string
          created_at: string | null
          end_date: string | null
          experience: Database["public"]["Enums"]["experience_type"]
          experience_id: string
          role: string | null
          start_date: string | null
          student_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          end_date?: string | null
          experience: Database["public"]["Enums"]["experience_type"]
          experience_id?: string
          role?: string | null
          start_date?: string | null
          student_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          end_date?: string | null
          experience?: Database["public"]["Enums"]["experience_type"]
          experience_id?: string
          role?: string | null
          start_date?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placements_internships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      students: {
        Row: {
          aadhaar_encrypted: string | null
          aadhaar_number: string | null
          account_number: string | null
          account_number_encrypted: string | null
          address: string | null
          branch: string | null
          created_at: string | null
          email: string
          name: string
          pan_encrypted: string | null
          pan_number: string | null
          parents_phone_number: string | null
          phone_number: string | null
          student_id: string
          user_id: string
          year: number | null
        }
        Insert: {
          aadhaar_encrypted?: string | null
          aadhaar_number?: string | null
          account_number?: string | null
          account_number_encrypted?: string | null
          address?: string | null
          branch?: string | null
          created_at?: string | null
          email: string
          name: string
          pan_encrypted?: string | null
          pan_number?: string | null
          parents_phone_number?: string | null
          phone_number?: string | null
          student_id?: string
          user_id: string
          year?: number | null
        }
        Update: {
          aadhaar_encrypted?: string | null
          aadhaar_number?: string | null
          account_number?: string | null
          account_number_encrypted?: string | null
          address?: string | null
          branch?: string | null
          created_at?: string | null
          email?: string
          name?: string
          pan_encrypted?: string | null
          pan_number?: string | null
          parents_phone_number?: string | null
          phone_number?: string | null
          student_id?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      decrypt_sensitive_data: {
        Args: { encrypted: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { plaintext: string }
        Returns: string
      }
      get_student_decrypted: {
        Args: { p_user_id: string }
        Returns: {
          aadhaar_number: string
          account_number: string
          address: string
          branch: string
          created_at: string
          email: string
          name: string
          pan_number: string
          parents_phone_number: string
          phone_number: string
          student_id: string
          user_id: string
          year: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_student_encrypted: {
        Args: {
          p_aadhaar_number: string
          p_account_number: string
          p_address: string
          p_branch: string
          p_email: string
          p_name: string
          p_pan_number: string
          p_parents_phone_number: string
          p_phone_number: string
          p_user_id: string
          p_year: number
        }
        Returns: string
      }
      update_student_encrypted: {
        Args: {
          p_aadhaar_number: string
          p_account_number: string
          p_address: string
          p_branch: string
          p_email: string
          p_name: string
          p_pan_number: string
          p_parents_phone_number: string
          p_phone_number: string
          p_user_id: string
          p_year: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student"
      experience_type: "placement" | "internship"
      ncc_wing_type: "air" | "army" | "navy"
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
      app_role: ["admin", "student"],
      experience_type: ["placement", "internship"],
      ncc_wing_type: ["air", "army", "navy"],
    },
  },
} as const
