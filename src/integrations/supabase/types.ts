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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      professionals: {
        Row: {
          id: string
          user_id: string
          nome: string
          profissao: string
          nome_salao: string | null
          cep: string
          lat: number
          lng: number
          raio_atendimento_km: number
          whatsapp: string | null
          instagram: string | null
          bio: string | null
          ativo: boolean
          verificado: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          profissao: string
          nome_salao?: string | null
          cep: string
          lat: number
          lng: number
          raio_atendimento_km?: number
          whatsapp?: string | null
          instagram?: string | null
          bio?: string | null
          ativo?: boolean
          verificado?: boolean
          created_at?: string
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      briefing_sends: {
        Row: {
          id: string
          user_id: string
          professional_id: string
          package_id: string | null
          modulo: string | null
          titulo: string
          texto: string
          status: string
          resposta: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          professional_id: string
          package_id?: string | null
          modulo?: string | null
          titulo: string
          texto: string
          status?: string
          resposta?: string | null
          created_at?: string
        }
        Update: {
          [key: string]: unknown
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          created_at: string
          event: string
          id: string
          meta: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          meta?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          meta?: Json
          user_id?: string
        }
        Relationships: []
      }
      beard_profiles: {
        Row: {
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          id: string
          name: string
          package_ids: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          package_ids?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          package_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      confidence_kits: {
        Row: {
          content: Json
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          accepted_at: string
          dna_paused: boolean
          image_generation: boolean
          module_permissions: Json
          personalization: boolean
          photo_processing: boolean
          reminders: boolean
          terms_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          dna_paused?: boolean
          image_generation?: boolean
          module_permissions?: Json
          personalization?: boolean
          photo_processing?: boolean
          reminders?: boolean
          terms_version?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          dna_paused?: boolean
          image_generation?: boolean
          module_permissions?: Json
          personalization?: boolean
          photo_processing?: boolean
          reminders?: boolean
          terms_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dna_corrections: {
        Row: {
          correction: string | null
          created_at: string
          field: string
          id: string
          original: string | null
          user_id: string
        }
        Insert: {
          correction?: string | null
          created_at?: string
          field: string
          id?: string
          original?: string | null
          user_id: string
        }
        Update: {
          correction?: string | null
          created_at?: string
          field?: string
          id?: string
          original?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dna_versions: {
        Row: {
          created_at: string
          id: string
          source: string
          summary: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source?: string
          summary: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      dress_code_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          occasion: string
          rule: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          occasion: string
          rule: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          occasion?: string
          rule?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comfort: number | null
          created_at: string
          id: string
          module: string | null
          package_id: string | null
          rating: number | null
          reflection: string | null
          user_id: string
        }
        Insert: {
          comfort?: number | null
          created_at?: string
          id?: string
          module?: string | null
          package_id?: string | null
          rating?: number | null
          reflection?: string | null
          user_id: string
        }
        Update: {
          comfort?: number | null
          created_at?: string
          id?: string
          module?: string | null
          package_id?: string | null
          rating?: number | null
          reflection?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_references: {
        Row: {
          created_at: string
          error: string | null
          id: string
          package_id: string | null
          path: string | null
          prompt: string
          slot: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          package_id?: string | null
          path?: string | null
          prompt: string
          slot: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          package_id?: string | null
          path?: string | null
          prompt?: string
          slot?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_references_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      hair_alerts: {
        Row: {
          active: boolean
          created_at: string
          every_days: number
          id: string
          kind: string
          next_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          every_days?: number
          id?: string
          kind: string
          next_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          every_days?: number
          id?: string
          kind?: string
          next_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hair_catalog: {
        Row: {
          active: boolean
          category: string
          chemical: boolean
          created_at: string
          description: string | null
          id: string
          maintenance: string
          name: string
          price_max: number
          price_min: number
        }
        Insert: {
          active?: boolean
          category: string
          chemical?: boolean
          created_at?: string
          description?: string | null
          id?: string
          maintenance?: string
          name: string
          price_max?: number
          price_min?: number
        }
        Update: {
          active?: boolean
          category?: string
          chemical?: boolean
          created_at?: string
          description?: string | null
          id?: string
          maintenance?: string
          name?: string
          price_max?: number
          price_min?: number
        }
        Relationships: []
      }
      hair_profiles: {
        Row: {
          bleaching_history: string | null
          chemical_history: string | null
          current_length: string | null
          desired_image: string | null
          grooming_mode: boolean
          heat_damage: string | null
          maintenance_tolerance: number
          scalp_sensitivity: string | null
          skill: number
          texture: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bleaching_history?: string | null
          chemical_history?: string | null
          current_length?: string | null
          desired_image?: string | null
          grooming_mode?: boolean
          heat_damage?: string | null
          maintenance_tolerance?: number
          scalp_sensitivity?: string | null
          skill?: number
          texture?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bleaching_history?: string | null
          chemical_history?: string | null
          current_length?: string | null
          desired_image?: string | null
          grooming_mode?: boolean
          heat_damage?: string | null
          maintenance_tolerance?: number
          scalp_sensitivity?: string | null
          skill?: number
          texture?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hair_rules: {
        Row: {
          active: boolean
          condition: string
          created_at: string
          id: string
          warning: string
        }
        Insert: {
          active?: boolean
          condition: string
          created_at?: string
          id?: string
          warning: string
        }
        Update: {
          active?: boolean
          condition?: string
          created_at?: string
          id?: string
          warning?: string
        }
        Relationships: []
      }
      image_access_state: {
        Row: {
          denied: boolean
          message: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          denied?: boolean
          message?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          denied?: boolean
          message?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journey_goals: {
        Row: {
          created_at: string
          custom: string | null
          goal: string
          id: string
          user_id: string
          why: string | null
        }
        Insert: {
          created_at?: string
          custom?: string | null
          goal: string
          id?: string
          user_id: string
          why?: string | null
        }
        Update: {
          created_at?: string
          custom?: string | null
          goal?: string
          id?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      journey_plans: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          period: string
          starts_on: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          period?: string
          starts_on?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          period?: string
          starts_on?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "journey_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_reflections: {
        Row: {
          created_at: string
          emotional_note: string | null
          id: string
          include_in_report: boolean
          maintenance: number | null
          note: string | null
          plan_id: string
          practicality: number | null
          self_esteem: number | null
          social_reception: string | null
          step_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emotional_note?: string | null
          id?: string
          include_in_report?: boolean
          maintenance?: number | null
          note?: string | null
          plan_id: string
          practicality?: number | null
          self_esteem?: number | null
          social_reception?: string | null
          step_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          emotional_note?: string | null
          id?: string
          include_in_report?: boolean
          maintenance?: number | null
          note?: string | null
          plan_id?: string
          practicality?: number | null
          self_esteem?: number | null
          social_reception?: string | null
          step_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_reflections_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "journey_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_reflections_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_reports: {
        Row: {
          content: Json
          created_at: string
          id: string
          kind: string
          plan_id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          kind?: string
          plan_id: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_reports_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "journey_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          category: string
          created_at: string
          id: string
          package_id: string | null
          period_index: number
          plan_id: string
          status: string
          status_history: Json
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          package_id?: string | null
          period_index?: number
          plan_id: string
          status?: string
          status_history?: Json
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          package_id?: string | null
          period_index?: number
          plan_id?: string
          status?: string
          status_history?: Json
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "journey_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      makeup_profiles: {
        Row: {
          allergies: string | null
          avoid_ingredients: string[]
          budget: string | null
          finish: string | null
          products_used: string[]
          references_text: string | null
          skill: number
          skin_conditions: string | null
          skin_type: string | null
          time_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string | null
          avoid_ingredients?: string[]
          budget?: string | null
          finish?: string | null
          products_used?: string[]
          references_text?: string | null
          skill?: number
          skin_conditions?: string | null
          skin_type?: string | null
          time_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string | null
          avoid_ingredients?: string[]
          budget?: string | null
          finish?: string | null
          products_used?: string[]
          references_text?: string | null
          skill?: number
          skin_conditions?: string | null
          skin_type?: string | null
          time_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      makeup_signatures: {
        Row: {
          created_at: string
          id: string
          summary: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          batch_id: string
          beautiful_not_practical: boolean
          content: Json
          context: Json
          created_at: string
          emotional_mode: string | null
          entry_mode: string
          id: string
          kind: string
          module: string | null
          note: string | null
          status: string
          user_id: string
        }
        Insert: {
          batch_id: string
          beautiful_not_practical?: boolean
          content: Json
          context?: Json
          created_at?: string
          emotional_mode?: string | null
          entry_mode: string
          id?: string
          kind?: string
          module?: string | null
          note?: string | null
          status?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          beautiful_not_practical?: boolean
          content?: Json
          context?: Json
          created_at?: string
          emotional_mode?: string | null
          entry_mode?: string
          id?: string
          kind?: string
          module?: string | null
          note?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string
          id: string
          journey_step_id: string | null
          kind: string
          pair_role: string | null
          path: string
          tattoo_project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          journey_step_id?: string | null
          kind?: string
          pair_role?: string | null
          path: string
          tattoo_project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          journey_step_id?: string | null
          kind?: string
          pair_role?: string | null
          path?: string
          tattoo_project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_tattoo_project_id_fkey"
            columns: ["tattoo_project_id"]
            isOneToOne: false
            referencedRelation: "tattoo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          body_highlight: string | null
          body_preserve: string | null
          colors_liked: string[]
          colors_rejected: string[]
          permanent_tolerance: number
          professional_goals: string | null
          social_goals: string | null
          styles_liked: string[]
          styles_rejected: string[]
          theory_only: string | null
          updated_at: string
          user_id: string
          works_in_life: string | null
        }
        Insert: {
          body_highlight?: string | null
          body_preserve?: string | null
          colors_liked?: string[]
          colors_rejected?: string[]
          permanent_tolerance?: number
          professional_goals?: string | null
          social_goals?: string | null
          styles_liked?: string[]
          styles_rejected?: string[]
          theory_only?: string | null
          updated_at?: string
          user_id: string
          works_in_life?: string | null
        }
        Update: {
          body_highlight?: string | null
          body_preserve?: string | null
          colors_liked?: string[]
          colors_rejected?: string[]
          permanent_tolerance?: number
          professional_goals?: string | null
          social_goals?: string | null
          styles_liked?: string[]
          styles_rejected?: string[]
          theory_only?: string | null
          updated_at?: string
          user_id?: string
          works_in_life?: string | null
        }
        Relationships: []
      }
      product_catalog: {
        Row: {
          active: boolean
          category: string
          created_at: string
          finish: string | null
          id: string
          name: string
          price_max: number
          price_min: number
          sensitive_safe: boolean
          tags: string[]
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          finish?: string | null
          id?: string
          name: string
          price_max?: number
          price_min?: number
          sensitive_safe?: boolean
          tags?: string[]
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          finish?: string | null
          id?: string
          name?: string
          price_max?: number
          price_min?: number
          sensitive_safe?: boolean
          tags?: string[]
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          done: boolean
          due_at: string
          id: string
          journey_plan_id: string | null
          tattoo_project_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_at: string
          id?: string
          journey_plan_id?: string | null
          tattoo_project_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_at?: string
          id?: string
          journey_plan_id?: string | null
          tattoo_project_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_journey_plan_id_fkey"
            columns: ["journey_plan_id"]
            isOneToOne: false
            referencedRelation: "journey_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_tattoo_project_id_fkey"
            columns: ["tattoo_project_id"]
            isOneToOne: false
            referencedRelation: "tattoo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_config: {
        Row: {
          blocked_terms: string[]
          id: number
          tattoo_disclaimer: string
          updated_at: string
        }
        Insert: {
          blocked_terms?: string[]
          id?: number
          tattoo_disclaimer?: string
          updated_at?: string
        }
        Update: {
          blocked_terms?: string[]
          id?: number
          tattoo_disclaimer?: string
          updated_at?: string
        }
        Relationships: []
      }
      style_analyses: {
        Row: {
          content: Json
          created_at: string
          done: boolean
          id: string
          input: Json
          kind: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          done?: boolean
          id?: string
          input?: Json
          kind: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          done?: boolean
          id?: string
          input?: Json
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      style_profiles: {
        Row: {
          avoided_pieces: string | null
          budget: string | null
          city: string | null
          climate: string | null
          desired_image: string | null
          dress_code: string | null
          profession: string | null
          routine: string | null
          silhouettes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avoided_pieces?: string | null
          budget?: string | null
          city?: string | null
          climate?: string | null
          desired_image?: string | null
          dress_code?: string | null
          profession?: string | null
          routine?: string | null
          silhouettes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avoided_pieces?: string | null
          budget?: string | null
          city?: string | null
          climate?: string | null
          desired_image?: string | null
          dress_code?: string | null
          profession?: string | null
          routine?: string | null
          silhouettes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tattoo_care_logs: {
        Row: {
          created_at: string
          id: string
          note: string
          observed_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          observed_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          observed_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tattoo_care_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tattoo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tattoo_profiles: {
        Row: {
          body_photo_consent: boolean
          consent_version: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          body_photo_consent?: boolean
          consent_version?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          body_photo_consent?: boolean
          consent_version?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tattoo_projects: {
        Row: {
          checkpoints: Json
          created_at: string
          id: string
          intention: Json
          selected_level: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checkpoints?: Json
          created_at?: string
          id?: string
          intention?: Json
          selected_level?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checkpoints?: Json
          created_at?: string
          id?: string
          intention?: Json
          selected_level?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      visual_dna: {
        Row: {
          signals: Json
          signals_since_review: number
          summary: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          signals?: Json
          signals_since_review?: number
          summary?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          signals?: Json
          signals_since_review?: number
          summary?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visual_profiles: {
        Row: {
          completed: boolean
          data: Json
          mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          data?: Json
          mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          data?: Json
          mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          category: string
          color: string | null
          created_at: string
          fabric: string | null
          formality: number
          id: string
          name: string
          notes: string | null
          photo_path: string | null
          season: string | null
          times_used: number
          user_id: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          fabric?: string | null
          formality?: number
          id?: string
          name: string
          notes?: string | null
          photo_path?: string | null
          season?: string | null
          times_used?: number
          user_id: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          fabric?: string | null
          formality?: number
          id?: string
          name?: string
          notes?: string | null
          photo_path?: string | null
          season?: string | null
          times_used?: number
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
