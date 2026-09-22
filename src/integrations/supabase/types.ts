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
      activity: {
        Row: {
          agent_id: string | null
          client_id: string | null
          created_at: string
          descripcion: string
          id: string
          resultado: string | null
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          created_at?: string
          descripcion: string
          id?: string
          resultado?: string | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          created_at?: string
          descripcion?: string
          id?: string
          resultado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          calidad: number
          carga: number
          created_at: string
          disponibilidad: string
          errores: number
          especialidad: string
          id: string
          nombre: string
        }
        Insert: {
          calidad?: number
          carga?: number
          created_at?: string
          disponibilidad?: string
          errores?: number
          especialidad: string
          id?: string
          nombre: string
        }
        Update: {
          calidad?: number
          carga?: number
          created_at?: string
          disponibilidad?: string
          errores?: number
          especialidad?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      approvals: {
        Row: {
          accion: string
          agent_id: string | null
          client_id: string | null
          confianza: number
          created_at: string
          estado: string
          evidencia: string | null
          id: string
          impacto: string | null
          prioridad: string
          sla_vence: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          accion: string
          agent_id?: string | null
          client_id?: string | null
          confianza?: number
          created_at?: string
          estado?: string
          evidencia?: string | null
          id?: string
          impacto?: string | null
          prioridad?: string
          sla_vence?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          accion?: string
          agent_id?: string | null
          client_id?: string | null
          confianza?: number
          created_at?: string
          estado?: string
          evidencia?: string | null
          id?: string
          impacto?: string | null
          prioridad?: string
          sla_vence?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          especialidades: number
          estado: string
          id: string
          nombre: string
          objetivo: string | null
          progreso: number
          sector: string
          sla_vence: string | null
        }
        Insert: {
          created_at?: string
          especialidades?: number
          estado?: string
          id?: string
          nombre: string
          objetivo?: string | null
          progreso?: number
          sector?: string
          sla_vence?: string | null
        }
        Update: {
          created_at?: string
          especialidades?: number
          estado?: string
          id?: string
          nombre?: string
          objetivo?: string | null
          progreso?: number
          sector?: string
          sla_vence?: string | null
        }
        Relationships: []
      }
      decisions: {
        Row: {
          approval_id: string
          created_at: string
          decidido_por: string | null
          decision: string
          id: string
          motivo: string | null
        }
        Insert: {
          approval_id: string
          created_at?: string
          decidido_por?: string | null
          decision: string
          id?: string
          motivo?: string | null
        }
        Update: {
          approval_id?: string
          created_at?: string
          decidido_por?: string | null
          decision?: string
          id?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agent_id: string | null
          client_id: string | null
          completada_en: string | null
          created_at: string
          created_by: string | null
          detalle: string | null
          estado: string
          fase: string
          fecha_limite: string | null
          id: string
          orden_fase: number
          prioridad: string
          proyecto: string | null
          responsable: string
          titulo: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          completada_en?: string | null
          created_at?: string
          created_by?: string | null
          detalle?: string | null
          estado?: string
          fase?: string
          fecha_limite?: string | null
          id?: string
          orden_fase?: number
          prioridad?: string
          proyecto?: string | null
          responsable: string
          titulo: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          completada_en?: string | null
          created_at?: string
          created_by?: string | null
          detalle?: string | null
          estado?: string
          fase?: string
          fecha_limite?: string | null
          id?: string
          orden_fase?: number
          prioridad?: string
          proyecto?: string | null
          responsable?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_equipo: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "equipo"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "equipo"],
    },
  },
} as const
