// Generado desde Supabase (proyecto burritos-dev). No editar a mano:
// regenerar con `pnpm db:types` o con `generate_typescript_types` del MCP.

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
      categorias_ingrediente: {
        Row: {
          id: string
          min: number
          nombre: string
          obligatoria: boolean
          paso: number
          permite_repetir: boolean
          slug: string
        }
        Insert: {
          id?: string
          min?: number
          nombre: string
          obligatoria?: boolean
          paso: number
          permite_repetir?: boolean
          slug: string
        }
        Update: {
          id?: string
          min?: number
          nombre?: string
          obligatoria?: boolean
          paso?: number
          permite_repetir?: boolean
          slug?: string
        }
        Relationships: []
      }
      combo_items: {
        Row: {
          cantidad: number
          combo_id: string
          producto_id: string
        }
        Insert: {
          cantidad?: number
          combo_id: string
          producto_id: string
        }
        Update: {
          cantidad?: number
          combo_id?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      config_negocio: {
        Row: {
          abierto: boolean
          alias_transferencia: string | null
          aviso_celiacos: string | null
          cvu: string | null
          horarios: Json
          id: boolean
          pago_efectivo_activo: boolean
          pago_mp_activo: boolean
          pago_stripe_activo: boolean
          pago_transferencia_activo: boolean
          titular: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          abierto?: boolean
          alias_transferencia?: string | null
          aviso_celiacos?: string | null
          cvu?: string | null
          horarios?: Json
          id?: boolean
          pago_efectivo_activo?: boolean
          pago_mp_activo?: boolean
          pago_stripe_activo?: boolean
          pago_transferencia_activo?: boolean
          titular?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          abierto?: boolean
          alias_transferencia?: string | null
          aviso_celiacos?: string | null
          cvu?: string | null
          horarios?: Json
          id?: boolean
          pago_efectivo_activo?: boolean
          pago_mp_activo?: boolean
          pago_stripe_activo?: boolean
          pago_transferencia_activo?: boolean
          titular?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      ingredientes: {
        Row: {
          activo: boolean
          categoria_id: string
          color_hex: string | null
          descripcion: string | null
          id: string
          imagen_url: string | null
          modelo_3d_url: string | null
          nombre: string
          orden: number
          precio_extra: number
          sin_tacc: boolean
          slug: string
          vegetariano: boolean
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          color_hex?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          modelo_3d_url?: string | null
          nombre: string
          orden?: number
          precio_extra?: number
          sin_tacc?: boolean
          slug: string
          vegetariano?: boolean
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          color_hex?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          modelo_3d_url?: string | null
          nombre?: string
          orden?: number
          precio_extra?: number
          sin_tacc?: boolean
          slug?: string
          vegetariano?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_ingrediente"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
          orden?: number
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      pagos_eventos: {
        Row: {
          created_at: string
          evento_id: string
          id: string
          payload: Json
          procesado: boolean
          proveedor: string
          tipo: string
        }
        Insert: {
          created_at?: string
          evento_id: string
          id?: string
          payload: Json
          procesado?: boolean
          proveedor: string
          tipo: string
        }
        Update: {
          created_at?: string
          evento_id?: string
          id?: string
          payload?: Json
          procesado?: boolean
          proveedor?: string
          tipo?: string
        }
        Relationships: []
      }
      pedido_historial: {
        Row: {
          created_at: string
          estado_anterior: Database["public"]["Enums"]["estado_pedido"] | null
          estado_nuevo: Database["public"]["Enums"]["estado_pedido"]
          id: string
          pedido_id: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          estado_anterior?: Database["public"]["Enums"]["estado_pedido"] | null
          estado_nuevo: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          pedido_id: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          estado_anterior?: Database["public"]["Enums"]["estado_pedido"] | null
          estado_nuevo?: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          pedido_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_historial_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_item_ingredientes: {
        Row: {
          categoria: string
          ingrediente_id: string
          item_id: string
          nombre: string
          precio: number
        }
        Insert: {
          categoria: string
          ingrediente_id: string
          item_id: string
          nombre: string
          precio: number
        }
        Update: {
          categoria?: string
          ingrediente_id?: string
          item_id?: string
          nombre?: string
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_item_ingredientes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_item_ingredientes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pedido_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          cantidad: number
          detalle: Json
          id: string
          nombre: string
          pedido_id: string
          precio_unitario: number
          producto_id: string | null
          tamano_id: string | null
          tipo: Database["public"]["Enums"]["tipo_item"]
        }
        Insert: {
          cantidad: number
          detalle?: Json
          id?: string
          nombre: string
          pedido_id: string
          precio_unitario: number
          producto_id?: string | null
          tamano_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_item"]
        }
        Update: {
          cantidad?: number
          detalle?: Json
          id?: string
          nombre?: string
          pedido_id?: string
          precio_unitario?: number
          producto_id?: string | null
          tamano_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_item"]
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_tamano_id_fkey"
            columns: ["tamano_id"]
            isOneToOne: false
            referencedRelation: "tamanos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_email: string | null
          cliente_nombre: string
          cliente_telefono: string
          costo_envio: number
          created_at: string
          direccion: string | null
          estado: Database["public"]["Enums"]["estado_pedido"]
          estado_pago: Database["public"]["Enums"]["estado_pago"]
          id: string
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          notas: string | null
          numero: number
          paga_con: number | null
          pago_proveedor_id: string | null
          referencias: string | null
          subtotal: number
          tipo_entrega: Database["public"]["Enums"]["tipo_entrega"]
          token_seguimiento: string
          total: number
          updated_at: string
          zona_envio_id: string | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_nombre: string
          cliente_telefono: string
          costo_envio?: number
          created_at?: string
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          estado_pago?: Database["public"]["Enums"]["estado_pago"]
          id?: string
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          notas?: string | null
          numero?: never
          paga_con?: number | null
          pago_proveedor_id?: string | null
          referencias?: string | null
          subtotal: number
          tipo_entrega: Database["public"]["Enums"]["tipo_entrega"]
          token_seguimiento?: string
          total: number
          updated_at?: string
          zona_envio_id?: string | null
        }
        Update: {
          cliente_email?: string | null
          cliente_nombre?: string
          cliente_telefono?: string
          costo_envio?: number
          created_at?: string
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          estado_pago?: Database["public"]["Enums"]["estado_pago"]
          id?: string
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"]
          notas?: string | null
          numero?: never
          paga_con?: number | null
          pago_proveedor_id?: string | null
          referencias?: string | null
          subtotal?: number
          tipo_entrega?: Database["public"]["Enums"]["tipo_entrega"]
          token_seguimiento?: string
          total?: number
          updated_at?: string
          zona_envio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_zona_envio_id_fkey"
            columns: ["zona_envio_id"]
            isOneToOne: false
            referencedRelation: "zonas_envio"
            referencedColumns: ["id"]
          },
        ]
      }
      producto_ingredientes: {
        Row: {
          ingrediente_id: string
          porciones: number
          producto_id: string
        }
        Insert: {
          ingrediente_id: string
          porciones?: number
          producto_id: string
        }
        Update: {
          ingrediente_id?: string
          porciones?: number
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_ingredientes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_ingredientes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          descripcion: string | null
          destacado: boolean
          id: string
          imagen_url: string | null
          menu_id: string
          nombre: string
          orden: number
          precio: number
          tamano_id: string | null
          tipo: Database["public"]["Enums"]["tipo_producto"]
        }
        Insert: {
          activo?: boolean
          descripcion?: string | null
          destacado?: boolean
          id?: string
          imagen_url?: string | null
          menu_id: string
          nombre: string
          orden?: number
          precio: number
          tamano_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_producto"]
        }
        Update: {
          activo?: boolean
          descripcion?: string | null
          destacado?: boolean
          id?: string
          imagen_url?: string | null
          menu_id?: string
          nombre?: string
          orden?: number
          precio?: number
          tamano_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_producto"]
        }
        Relationships: [
          {
            foreignKeyName: "productos_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_tamano_id_fkey"
            columns: ["tamano_id"]
            isOneToOne: false
            referencedRelation: "tamanos"
            referencedColumns: ["id"]
          },
        ]
      }
      tamanos: {
        Row: {
          activo: boolean
          cant_tapas: number
          id: string
          max_carnes: number
          max_salsas: number
          max_vegetales: number
          min_carnes: number
          nombre: string
          orden: number
          precio_base: number
          slug: string
        }
        Insert: {
          activo?: boolean
          cant_tapas: number
          id?: string
          max_carnes: number
          max_salsas: number
          max_vegetales: number
          min_carnes: number
          nombre: string
          orden?: number
          precio_base: number
          slug: string
        }
        Update: {
          activo?: boolean
          cant_tapas?: number
          id?: string
          max_carnes?: number
          max_salsas?: number
          max_vegetales?: number
          min_carnes?: number
          nombre?: string
          orden?: number
          precio_base?: number
          slug?: string
        }
        Relationships: []
      }
      zonas_envio: {
        Row: {
          activo: boolean
          costo: number
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          costo: number
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          costo?: number
          id?: string
          nombre?: string
        }
        Relationships: []
      }
    }
    Views: {
      config_publica: {
        Row: {
          abierto: boolean | null
          alias_transferencia: string | null
          aviso_celiacos: string | null
          cvu: string | null
          horarios: Json | null
          pago_efectivo_activo: boolean | null
          pago_mp_activo: boolean | null
          pago_stripe_activo: boolean | null
          pago_transferencia_activo: boolean | null
          titular: string | null
          whatsapp: string | null
        }
        Insert: {
          abierto?: boolean | null
          alias_transferencia?: string | null
          aviso_celiacos?: string | null
          cvu?: string | null
          horarios?: Json | null
          pago_efectivo_activo?: boolean | null
          pago_mp_activo?: boolean | null
          pago_stripe_activo?: boolean | null
          pago_transferencia_activo?: boolean | null
          titular?: string | null
          whatsapp?: string | null
        }
        Update: {
          abierto?: boolean | null
          alias_transferencia?: string | null
          aviso_celiacos?: string | null
          cvu?: string | null
          horarios?: Json | null
          pago_efectivo_activo?: boolean | null
          pago_mp_activo?: boolean | null
          pago_stripe_activo?: boolean | null
          pago_transferencia_activo?: boolean | null
          titular?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      es_admin: { Args: never; Returns: boolean }
      ver_pedido: { Args: { p_id: string; p_token: string }; Returns: Json }
    }
    Enums: {
      estado_pago: "pendiente" | "aprobado" | "rechazado" | "reembolsado"
      estado_pedido:
        | "pendiente_pago"
        | "confirmado"
        | "en_preparacion"
        | "listo"
        | "en_camino"
        | "entregado"
        | "cancelado"
      metodo_pago: "mercadopago" | "stripe" | "transferencia" | "efectivo"
      tipo_entrega: "delivery" | "retiro"
      tipo_item: "armado" | "producto"
      tipo_producto: "burrito" | "combo" | "bebida" | "acompanamiento"
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
      estado_pago: ["pendiente", "aprobado", "rechazado", "reembolsado"],
      estado_pedido: [
        "pendiente_pago",
        "confirmado",
        "en_preparacion",
        "listo",
        "en_camino",
        "entregado",
        "cancelado",
      ],
      metodo_pago: ["mercadopago", "stripe", "transferencia", "efectivo"],
      tipo_entrega: ["delivery", "retiro"],
      tipo_item: ["armado", "producto"],
      tipo_producto: ["burrito", "combo", "bebida", "acompanamiento"],
    },
  },
} as const
