export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      domains: {
        Row: {
          id: string;
          user_id: string | null;
          domain_name: string;
          last_scan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          domain_name: string;
          last_scan?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          domain_name?: string;
          last_scan?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "domains_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      scans: {
        Row: {
          id: string;
          domain_id: string | null;
          garbage_count: number;
          total_records: number;
          result: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          domain_id?: string | null;
          garbage_count?: number;
          total_records?: number;
          result?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string | null;
          garbage_count?: number;
          total_records?: number;
          result?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scans_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
