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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_purchase: number | null
          per_user_limit: number | null
          product_ids: string[] | null
          role_restriction: Database["public"]["Enums"]["app_role"][] | null
          starts_at: string | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          per_user_limit?: number | null
          product_ids?: string[] | null
          role_restriction?: Database["public"]["Enums"]["app_role"][] | null
          starts_at?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          per_user_limit?: number | null
          product_ids?: string[] | null
          role_restriction?: Database["public"]["Enums"]["app_role"][] | null
          starts_at?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      fulfillment_jobs: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          id: string
          job_type: Database["public"]["Enums"]["product_type"]
          last_error: string | null
          max_attempts: number | null
          next_retry_at: string | null
          order_item_id: string
          provider_account_id: string | null
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["fulfillment_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          job_type: Database["public"]["Enums"]["product_type"]
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          order_item_id: string
          provider_account_id?: string | null
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          job_type?: Database["public"]["Enums"]["product_type"]
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          order_item_id?: string
          provider_account_id?: string | null
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_jobs_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_jobs_provider_account_id_fkey"
            columns: ["provider_account_id"]
            isOneToOne: false
            referencedRelation: "provider_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_data: Json | null
          id: string
          input_data: Json | null
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_data?: Json | null
          id?: string
          input_data?: Json | null
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_data?: Json | null
          id?: string
          input_data?: Json | null
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_id: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          discount_amount: number | null
          guest_token: string | null
          id: string
          is_reseller_order: boolean | null
          notes: string | null
          paid_at: string | null
          points_discount: number | null
          points_used: number | null
          reseller_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          guest_token?: string | null
          id?: string
          is_reseller_order?: boolean | null
          notes?: string | null
          paid_at?: string | null
          points_discount?: number | null
          points_used?: number | null
          reseller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          guest_token?: string | null
          id?: string
          is_reseller_order?: boolean | null
          notes?: string | null
          paid_at?: string | null
          points_discount?: number | null
          points_used?: number | null
          reseller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          fee: number | null
          id: string
          net_amount: number | null
          order_id: string
          paid_at: string | null
          pay_url: string | null
          qr_link: string | null
          ref_id: string
          status: Database["public"]["Enums"]["payment_status"]
          tokopay_trx_id: string | null
          updated_at: string
          webhook_data: Json | null
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          fee?: number | null
          id?: string
          net_amount?: number | null
          order_id: string
          paid_at?: string | null
          pay_url?: string | null
          qr_link?: string | null
          ref_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          tokopay_trx_id?: string | null
          updated_at?: string
          webhook_data?: Json | null
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          fee?: number | null
          id?: string
          net_amount?: number | null
          order_id?: string
          paid_at?: string | null
          pay_url?: string | null
          qr_link?: string | null
          ref_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tokopay_trx_id?: string | null
          updated_at?: string
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          transaction_type: Database["public"]["Enums"]["point_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          transaction_type: Database["public"]["Enums"]["point_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          transaction_type?: Database["public"]["Enums"]["point_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          benefits: Json | null
          category_id: string | null
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          image_url: string | null
          input_schema: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          provider_id: string | null
          require_read_description: boolean | null
          reseller_price: number | null
          retail_price: number
          short_description: string | null
          slug: string
          sort_order: number | null
          total_sold: number | null
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          image_url?: string | null
          input_schema?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          product_type?: Database["public"]["Enums"]["product_type"]
          provider_id?: string | null
          require_read_description?: boolean | null
          reseller_price?: number | null
          retail_price?: number
          short_description?: string | null
          slug: string
          sort_order?: number | null
          total_sold?: number | null
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          image_url?: string | null
          input_schema?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          provider_id?: string | null
          require_read_description?: boolean | null
          reseller_price?: number | null
          retail_price?: number
          short_description?: string | null
          slug?: string
          sort_order?: number | null
          total_sold?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_accounts: {
        Row: {
          cooldown_until: string | null
          created_at: string
          credentials: Json
          current_daily_invites: number | null
          id: string
          is_active: boolean | null
          last_invite_at: string | null
          max_daily_invites: number | null
          name: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          cooldown_until?: string | null
          created_at?: string
          credentials?: Json
          current_daily_invites?: number | null
          id?: string
          is_active?: boolean | null
          last_invite_at?: string | null
          max_daily_invites?: number | null
          name: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          cooldown_until?: string | null
          created_at?: string
          credentials?: Json
          current_daily_invites?: number | null
          id?: string
          is_active?: boolean | null
          last_invite_at?: string | null
          max_daily_invites?: number | null
          name?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_accounts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      reseller_api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      reseller_wallets: {
        Row: {
          balance: number
          id: string
          total_cashback: number
          total_spent: number
          total_topup: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          total_cashback?: number
          total_spent?: number
          total_topup?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          total_cashback?: number
          total_spent?: number
          total_topup?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          product_id: string
          reserved_at: string | null
          secret_data: string
          sold_at: string | null
          status: Database["public"]["Enums"]["stock_status"]
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          reserved_at?: string | null
          secret_data: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["stock_status"]
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          reserved_at?: string | null
          secret_data?: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["stock_status"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_points: {
        Row: {
          balance: number
          id: string
          total_earned: number
          total_redeemed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          payment_id: string | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          error: string | null
          event_type: string | null
          id: string
          is_valid: boolean | null
          payload: Json
          processed: boolean | null
          signature: string | null
          source: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type?: string | null
          id?: string
          is_valid?: boolean | null
          payload: Json
          processed?: boolean | null
          signature?: string | null
          source: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string | null
          id?: string
          is_valid?: boolean | null
          payload?: Json
          processed?: boolean | null
          signature?: string | null
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      is_admin: { Args: never; Returns: boolean }
      is_reseller_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "member" | "reseller" | "admin"
      discount_type: "PERCENTAGE" | "FIXED"
      fulfillment_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
      order_status:
        | "AWAITING_PAYMENT"
        | "PAID"
        | "PROCESSING"
        | "DELIVERED"
        | "FAILED"
        | "CANCELLED"
      payment_status: "PENDING" | "PAID" | "EXPIRED" | "FAILED"
      point_transaction_type: "EARNED" | "REDEEMED" | "ADJUSTMENT"
      product_type: "STOCK" | "INVITE"
      stock_status: "AVAILABLE" | "RESERVED" | "SOLD"
      wallet_transaction_type: "TOPUP" | "PURCHASE" | "CASHBACK" | "ADJUSTMENT"
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
      app_role: ["member", "reseller", "admin"],
      discount_type: ["PERCENTAGE", "FIXED"],
      fulfillment_status: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      order_status: [
        "AWAITING_PAYMENT",
        "PAID",
        "PROCESSING",
        "DELIVERED",
        "FAILED",
        "CANCELLED",
      ],
      payment_status: ["PENDING", "PAID", "EXPIRED", "FAILED"],
      point_transaction_type: ["EARNED", "REDEEMED", "ADJUSTMENT"],
      product_type: ["STOCK", "INVITE"],
      stock_status: ["AVAILABLE", "RESERVED", "SOLD"],
      wallet_transaction_type: ["TOPUP", "PURCHASE", "CASHBACK", "ADJUSTMENT"],
    },
  },
} as const
