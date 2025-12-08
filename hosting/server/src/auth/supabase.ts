/**
 * HoloBridge Hosting Server - Supabase Client
 * 
 * Initializes and exports the Supabase admin client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Database types (matches Supabase schema)
export interface Database {
    public: {
        Tables: {
            instances: {
                Row: {
                    id: string;
                    user_id: string;
                    security_code: string;
                    name: string;
                    container_id: string | null;
                    status: string;
                    port: number | null;
                    discord_token_encrypted: string | null;
                    config: Record<string, unknown>;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['instances']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['instances']['Row']>;
                Relationships: [];
            };
            instance_plugins: {
                Row: {
                    id: string;
                    instance_id: string;
                    name: string;
                    version: string | null;
                    enabled: boolean;
                    config: Record<string, unknown>;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['instance_plugins']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['instance_plugins']['Row']>;
                Relationships: [];
            };
            instance_api_keys: {
                Row: {
                    id: string;
                    instance_id: string;
                    name: string;
                    key_hash: string;
                    scopes: string[];
                    created_at: string;
                    last_used_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['instance_api_keys']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['instance_api_keys']['Row']>;
                Relationships: [];
            };
            audit_log: {
                Row: {
                    id: string;
                    user_id: string | null;
                    instance_id: string | null;
                    action: string;
                    details: Record<string, unknown> | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>;
                Update: never;
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never
        };
        Functions: {
            [_ in never]: never
        };
        Enums: {
            [_ in never]: never
        };
    };
}

// Create Supabase client with service role (bypasses RLS)
export const supabase: SupabaseClient<Database> = createClient<Database>(
    config.supabase.url,
    config.supabase.serviceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

/**
 * Verify a security code and return the associated user ID
 */
export async function verifySecurityCode(securityCode: string): Promise<{ userId: string; instanceId: string } | null> {
    const { data, error } = await supabase
        .from('instances')
        .select('id, user_id')
        .eq('security_code', securityCode)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        userId: data.user_id,
        instanceId: data.id,
    };
}

/**
 * Get user details from Supabase Auth
 */
export async function getUserById(userId: string) {
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
        return null;
    }

    return data.user;
}

/**
 * Log an audit event
 */
export async function logAudit(
    userId: string,
    instanceId: string | null,
    action: string,
    details?: Record<string, unknown>
): Promise<void> {
    await supabase.from('audit_log').insert({
        user_id: userId,
        instance_id: instanceId,
        action,
        details: details ?? null,
    });
}
