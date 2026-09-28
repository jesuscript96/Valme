export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity: {
        Row: {
          agent_id: string | null;
          client_id: string | null;
          created_at: string;
          descripcion: string;
          id: string;
          resultado: string | null;
        };
        Insert: {
          agent_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          descripcion: string;
          id?: string;
          resultado?: string | null;
        };
        Update: {
          agent_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          descripcion?: string;
          id?: string;
          resultado?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_events: {
        Row: {
          action: string;
          actor_id: string | null;
          client_id: string | null;
          created_at: string;
          id: string;
          metadata: NonNullable<Json>;
          target_user_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          target_user_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          target_user_id?: string | null;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          calidad: number;
          carga: number;
          created_at: string;
          disponibilidad: string;
          errores: number;
          especialidad: string;
          id: string;
          nombre: string;
        };
        Insert: {
          calidad?: number;
          carga?: number;
          created_at?: string;
          disponibilidad?: string;
          errores?: number;
          especialidad: string;
          id?: string;
          nombre: string;
        };
        Update: {
          calidad?: number;
          carga?: number;
          created_at?: string;
          disponibilidad?: string;
          errores?: number;
          especialidad?: string;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      approvals: {
        Row: {
          accion: string;
          agent_id: string | null;
          client_id: string | null;
          confianza: number;
          created_at: string;
          estado: string;
          evidencia: string | null;
          id: string;
          impacto: string | null;
          prioridad: string;
          sla_vence: string | null;
          tipo: string;
          updated_at: string;
        };
        Insert: {
          accion: string;
          agent_id?: string | null;
          client_id?: string | null;
          confianza?: number;
          created_at?: string;
          estado?: string;
          evidencia?: string | null;
          id?: string;
          impacto?: string | null;
          prioridad?: string;
          sla_vence?: string | null;
          tipo?: string;
          updated_at?: string;
        };
        Update: {
          accion?: string;
          agent_id?: string | null;
          client_id?: string | null;
          confianza?: number;
          created_at?: string;
          estado?: string;
          evidencia?: string | null;
          id?: string;
          impacto?: string | null;
          prioridad?: string;
          sla_vence?: string | null;
          tipo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approvals_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approvals_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          especialidades: number;
          estado: string;
          id: string;
          nombre: string;
          objetivo: string | null;
          progreso: number;
          sector: string;
          sla_vence: string | null;
          tenant_id: string;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          especialidades?: number;
          estado?: string;
          id?: string;
          nombre: string;
          objetivo?: string | null;
          progreso?: number;
          sector?: string;
          sla_vence?: string | null;
          tenant_id: string;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          especialidades?: number;
          estado?: string;
          id?: string;
          nombre?: string;
          objetivo?: string | null;
          progreso?: number;
          sector?: string;
          sla_vence?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_tenant_fk";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      decisions: {
        Row: {
          approval_id: string;
          created_at: string;
          decidido_por: string | null;
          decision: string;
          id: string;
          motivo: string | null;
        };
        Insert: {
          approval_id: string;
          created_at?: string;
          decidido_por?: string | null;
          decision: string;
          id?: string;
          motivo?: string | null;
        };
        Update: {
          approval_id?: string;
          created_at?: string;
          decidido_por?: string | null;
          decision?: string;
          id?: string;
          motivo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "decisions_approval_id_fkey";
            columns: ["approval_id"];
            isOneToOne: false;
            referencedRelation: "approvals";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          client_id: string;
          created_at: string;
          created_by: string;
          estado: string;
          id: string;
          nombre: string;
          primary_domain: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          created_by: string;
          estado?: string;
          id?: string;
          nombre: string;
          primary_domain: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          created_by?: string;
          estado?: string;
          id?: string;
          nombre?: string;
          primary_domain?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_tenant_fk";
            columns: ["client_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "projects_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      seo_audit_access_refs: {
        Row: {
          access_ref: string;
          audit_id: string;
          created_at: string;
          created_by: string;
          id: string;
          kind: string;
          required_for_capability_ids: string[];
          state: Database["public"]["Enums"]["seo_access_state"];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          access_ref: string;
          audit_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          kind: string;
          required_for_capability_ids?: string[];
          state?: Database["public"]["Enums"]["seo_access_state"];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          access_ref?: string;
          audit_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          kind?: string;
          required_for_capability_ids?: string[];
          state?: Database["public"]["Enums"]["seo_access_state"];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seo_access_refs_audit_fk";
            columns: ["audit_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "seo_audits";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      seo_audit_evidence: {
        Row: {
          artifact_ref: string | null;
          audit_id: string;
          collection_method: string;
          contains_external_untrusted_data: boolean;
          created_at: string;
          created_by: string;
          device: string | null;
          id: string;
          integrity_hash: string | null;
          language: string | null;
          level: string | null;
          market: string | null;
          measurement_from: string | null;
          measurement_to: string | null;
          observed_at: string;
          observed_data: string;
          source: string;
          tenant_id: string;
          url_or_resource: string;
        };
        Insert: {
          artifact_ref?: string | null;
          audit_id: string;
          collection_method: string;
          contains_external_untrusted_data?: boolean;
          created_at?: string;
          created_by: string;
          device?: string | null;
          id?: string;
          integrity_hash?: string | null;
          language?: string | null;
          level?: string | null;
          market?: string | null;
          measurement_from?: string | null;
          measurement_to?: string | null;
          observed_at: string;
          observed_data: string;
          source: string;
          tenant_id: string;
          url_or_resource: string;
        };
        Update: {
          artifact_ref?: string | null;
          audit_id?: string;
          collection_method?: string;
          contains_external_untrusted_data?: boolean;
          created_at?: string;
          created_by?: string;
          device?: string | null;
          id?: string;
          integrity_hash?: string | null;
          language?: string | null;
          level?: string | null;
          market?: string | null;
          measurement_from?: string | null;
          measurement_to?: string | null;
          observed_at?: string;
          observed_data?: string;
          source?: string;
          tenant_id?: string;
          url_or_resource?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seo_evidence_audit_fk";
            columns: ["audit_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "seo_audits";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      seo_audit_findings: {
        Row: {
          audit_id: string;
          category: string;
          confidence: Database["public"]["Enums"]["seo_confidence_level"];
          created_at: string;
          created_by: string;
          depends_on_access_ref: string | null;
          description: string;
          id: string;
          impact: string;
          limitations: string[];
          observed_at: string;
          priority: Database["public"]["Enums"]["seo_priority"];
          recommendation: string;
          related_service_id: string;
          requires_human_approval: boolean;
          responsible_id: string;
          responsible_kind: string;
          responsible_name: string;
          result_type: Database["public"]["Enums"]["seo_result_type"];
          sources: string[];
          state: Database["public"]["Enums"]["seo_finding_state"];
          tenant_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          audit_id: string;
          category: string;
          confidence: Database["public"]["Enums"]["seo_confidence_level"];
          created_at?: string;
          created_by: string;
          depends_on_access_ref?: string | null;
          description: string;
          id?: string;
          impact: string;
          limitations?: string[];
          observed_at: string;
          priority: Database["public"]["Enums"]["seo_priority"];
          recommendation: string;
          related_service_id: string;
          requires_human_approval?: boolean;
          responsible_id: string;
          responsible_kind: string;
          responsible_name: string;
          result_type: Database["public"]["Enums"]["seo_result_type"];
          sources: string[];
          state?: Database["public"]["Enums"]["seo_finding_state"];
          tenant_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          audit_id?: string;
          category?: string;
          confidence?: Database["public"]["Enums"]["seo_confidence_level"];
          created_at?: string;
          created_by?: string;
          depends_on_access_ref?: string | null;
          description?: string;
          id?: string;
          impact?: string;
          limitations?: string[];
          observed_at?: string;
          priority?: Database["public"]["Enums"]["seo_priority"];
          recommendation?: string;
          related_service_id?: string;
          requires_human_approval?: boolean;
          responsible_id?: string;
          responsible_kind?: string;
          responsible_name?: string;
          result_type?: Database["public"]["Enums"]["seo_result_type"];
          sources?: string[];
          state?: Database["public"]["Enums"]["seo_finding_state"];
          tenant_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seo_findings_access_ref_fk";
            columns: ["tenant_id", "audit_id", "depends_on_access_ref"];
            isOneToOne: false;
            referencedRelation: "seo_audit_access_refs";
            referencedColumns: ["tenant_id", "audit_id", "access_ref"];
          },
          {
            foreignKeyName: "seo_findings_audit_fk";
            columns: ["audit_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "seo_audits";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      seo_audit_state_events: {
        Row: {
          actor_id: string;
          audit_id: string;
          created_at: string;
          from_state: Database["public"]["Enums"]["seo_audit_state"] | null;
          id: number;
          reason: string | null;
          tenant_id: string;
          to_state: Database["public"]["Enums"]["seo_audit_state"];
        };
        Insert: {
          actor_id: string;
          audit_id: string;
          created_at?: string;
          from_state?: Database["public"]["Enums"]["seo_audit_state"] | null;
          id?: never;
          reason?: string | null;
          tenant_id: string;
          to_state: Database["public"]["Enums"]["seo_audit_state"];
        };
        Update: {
          actor_id?: string;
          audit_id?: string;
          created_at?: string;
          from_state?: Database["public"]["Enums"]["seo_audit_state"] | null;
          id?: never;
          reason?: string | null;
          tenant_id?: string;
          to_state?: Database["public"]["Enums"]["seo_audit_state"];
        };
        Relationships: [
          {
            foreignKeyName: "seo_audit_state_events_audit_fk";
            columns: ["audit_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "seo_audits";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      seo_audits: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          authorization_ref: string | null;
          authorized_by: string | null;
          authorized_scope: NonNullable<Json>;
          client_id: string;
          contract_version: string;
          created_at: string;
          currency: string;
          id: string;
          languages: string[];
          markets: string[];
          max_cost_amount: number;
          max_duration_minutes: number;
          max_pages: number;
          primary_domain: string;
          project_id: string;
          requested_by: string;
          requested_capability_ids: string[];
          seed_urls: string[];
          service_ids: string[];
          state: Database["public"]["Enums"]["seo_audit_state"];
          tenant_id: string;
          transition_reason: string | null;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          authorization_ref?: string | null;
          authorized_by?: string | null;
          authorized_scope: NonNullable<Json>;
          client_id: string;
          contract_version: string;
          created_at?: string;
          currency: string;
          id?: string;
          languages: string[];
          markets: string[];
          max_cost_amount: number;
          max_duration_minutes: number;
          max_pages: number;
          primary_domain: string;
          project_id: string;
          requested_by: string;
          requested_capability_ids: string[];
          seed_urls: string[];
          service_ids: string[];
          state?: Database["public"]["Enums"]["seo_audit_state"];
          tenant_id: string;
          transition_reason?: string | null;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          authorization_ref?: string | null;
          authorized_by?: string | null;
          authorized_scope?: NonNullable<Json>;
          client_id?: string;
          contract_version?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          languages?: string[];
          markets?: string[];
          max_cost_amount?: number;
          max_duration_minutes?: number;
          max_pages?: number;
          primary_domain?: string;
          project_id?: string;
          requested_by?: string;
          requested_capability_ids?: string[];
          seed_urls?: string[];
          service_ids?: string[];
          state?: Database["public"]["Enums"]["seo_audit_state"];
          tenant_id?: string;
          transition_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seo_audits_project_scope_fk";
            columns: ["project_id", "tenant_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id", "tenant_id", "client_id"];
          },
          {
            foreignKeyName: "seo_audits_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      seo_finding_evidence: {
        Row: {
          audit_id: string;
          evidence_id: string;
          finding_id: string;
          linked_at: string;
          linked_by: string;
          tenant_id: string;
        };
        Insert: {
          audit_id: string;
          evidence_id: string;
          finding_id: string;
          linked_at?: string;
          linked_by: string;
          tenant_id: string;
        };
        Update: {
          audit_id?: string;
          evidence_id?: string;
          finding_id?: string;
          linked_at?: string;
          linked_by?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seo_finding_evidence_evidence_fk";
            columns: ["evidence_id", "tenant_id", "audit_id"];
            isOneToOne: false;
            referencedRelation: "seo_audit_evidence";
            referencedColumns: ["id", "tenant_id", "audit_id"];
          },
          {
            foreignKeyName: "seo_finding_evidence_finding_fk";
            columns: ["finding_id", "tenant_id", "audit_id"];
            isOneToOne: false;
            referencedRelation: "seo_audit_findings";
            referencedColumns: ["id", "tenant_id", "audit_id"];
          },
        ];
      };
      seo_service_coverage: {
        Row: {
          audit_id: string;
          created_at: string;
          declared_at: string | null;
          declared_by: string | null;
          reason: string | null;
          service_id: string;
          state: Database["public"]["Enums"]["seo_coverage_state"];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          audit_id: string;
          created_at?: string;
          declared_at?: string | null;
          declared_by?: string | null;
          reason?: string | null;
          service_id: string;
          state: Database["public"]["Enums"]["seo_coverage_state"];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          audit_id?: string;
          created_at?: string;
          declared_at?: string | null;
          declared_by?: string | null;
          reason?: string | null;
          service_id?: string;
          state?: Database["public"]["Enums"]["seo_coverage_state"];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seo_service_coverage_audit_fk";
            columns: ["audit_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "seo_audits";
            referencedColumns: ["id", "tenant_id"];
          },
        ];
      };
      tasks: {
        Row: {
          agent_id: string | null;
          client_id: string | null;
          completada_en: string | null;
          created_at: string;
          created_by: string | null;
          detalle: string | null;
          estado: string;
          fase: string;
          fecha_limite: string | null;
          id: string;
          orden_fase: number;
          prioridad: string;
          proyecto: string | null;
          responsable: string;
          titulo: string;
          updated_at: string;
        };
        Insert: {
          agent_id?: string | null;
          client_id?: string | null;
          completada_en?: string | null;
          created_at?: string;
          created_by?: string | null;
          detalle?: string | null;
          estado?: string;
          fase?: string;
          fecha_limite?: string | null;
          id?: string;
          orden_fase?: number;
          prioridad?: string;
          proyecto?: string | null;
          responsable: string;
          titulo: string;
          updated_at?: string;
        };
        Update: {
          agent_id?: string | null;
          client_id?: string | null;
          completada_en?: string | null;
          created_at?: string;
          created_by?: string | null;
          detalle?: string | null;
          estado?: string;
          fase?: string;
          fecha_limite?: string | null;
          id?: string;
          orden_fase?: number;
          prioridad?: string;
          proyecto?: string | null;
          responsable?: string;
          titulo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_memberships: {
        Row: {
          created_at: string;
          created_by: string | null;
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          role?: Database["public"]["Enums"]["tenant_role"];
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          nombre: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          nombre: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          nombre?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_access: {
        Row: {
          email: string;
          full_name: string | null;
          full_portfolio: boolean;
          invited_at: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["valme_role"];
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          email: string;
          full_name?: string | null;
          full_portfolio?: boolean;
          invited_at?: string;
          invited_by?: string | null;
          role: Database["public"]["Enums"]["valme_role"];
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          full_portfolio?: boolean;
          invited_at?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["valme_role"];
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_client_access: {
        Row: {
          client_id: string;
          created_at: string;
          granted_by: string | null;
          id: string;
          role: Database["public"]["Enums"]["valme_role"];
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["valme_role"];
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["valme_role"];
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_client_access_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_client_access_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_access";
            referencedColumns: ["user_id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_contribute_to_tenant: { Args: { _tenant_id: string }; Returns: boolean };
      can_manage_clients: { Args: Record<PropertyKey, never>; Returns: boolean };
      can_manage_tenant: { Args: { _tenant_id: string }; Returns: boolean };
      can_read_seo_audit: { Args: { _audit_id: string; _tenant_id: string }; Returns: boolean };
      can_write_seo_audit: { Args: { _audit_id: string; _tenant_id: string }; Returns: boolean };
      current_valme_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["valme_role"];
      };
      effective_tenant_role: {
        Args: { _tenant_id: string };
        Returns: Database["public"]["Enums"]["tenant_role"];
      };
      has_client_access: { Args: { _client_id: string }; Returns: boolean };
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string };
        Returns: boolean;
      };
      has_tenant_role: {
        Args: { _roles: Database["public"]["Enums"]["tenant_role"][]; _tenant_id: string };
        Returns: boolean;
      };
      is_equipo: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_internal: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_super_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_tenant_member: { Args: { _tenant_id: string }; Returns: boolean };
      seo_audit_transition_allowed: {
        Args: {
          _from: Database["public"]["Enums"]["seo_audit_state"];
          _to: Database["public"]["Enums"]["seo_audit_state"];
        };
        Returns: boolean;
      };
      tenant_role_rank: {
        Args: { _role: Database["public"]["Enums"]["tenant_role"] };
        Returns: number;
      };
      valme_role_rank: {
        Args: { _role: Database["public"]["Enums"]["valme_role"] };
        Returns: number;
      };
    };
    Enums: {
      app_role: "admin" | "equipo";
      seo_access_state: "no_solicitado" | "pendiente" | "validado" | "insuficiente" | "caducado";
      seo_audit_state:
        | "borrador"
        | "pendiente_autorizacion"
        | "autorizado"
        | "en_cola"
        | "en_ejecucion"
        | "bloqueado"
        | "control_calidad"
        | "devuelto"
        | "validado"
        | "cancelado";
      seo_confidence_level: "baja" | "media" | "alta";
      seo_coverage_state:
        | "evidencia_suficiente"
        | "cobertura_parcial"
        | "bloqueo_por_acceso"
        | "ausencia_declarada"
        | "pendiente_justificado";
      seo_finding_state: "propuesto" | "bloqueado" | "devuelto" | "validado" | "descartado";
      seo_priority: "baja" | "media" | "alta" | "critica";
      seo_result_type: "medicion" | "observacion" | "estimacion" | "heuristica";
      tenant_role: "owner" | "manager" | "member" | "reviewer";
      valme_role: "super_admin" | "project_manager" | "equipo" | "cliente";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "equipo"],
      seo_access_state: ["no_solicitado", "pendiente", "validado", "insuficiente", "caducado"],
      seo_audit_state: [
        "borrador",
        "pendiente_autorizacion",
        "autorizado",
        "en_cola",
        "en_ejecucion",
        "bloqueado",
        "control_calidad",
        "devuelto",
        "validado",
        "cancelado",
      ],
      seo_confidence_level: ["baja", "media", "alta"],
      seo_coverage_state: [
        "evidencia_suficiente",
        "cobertura_parcial",
        "bloqueo_por_acceso",
        "ausencia_declarada",
        "pendiente_justificado",
      ],
      seo_finding_state: ["propuesto", "bloqueado", "devuelto", "validado", "descartado"],
      seo_priority: ["baja", "media", "alta", "critica"],
      seo_result_type: ["medicion", "observacion", "estimacion", "heuristica"],
      tenant_role: ["owner", "manager", "member", "reviewer"],
      valme_role: ["super_admin", "project_manager", "equipo", "cliente"],
    },
  },
} as const;
