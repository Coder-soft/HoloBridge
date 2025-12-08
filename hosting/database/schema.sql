-- HoloBridge Hosting - Database Schema
-- Run this migration in your Supabase project

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER INSTANCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    security_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    container_id TEXT,
    status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'starting', 'stopping', 'error')),
    port INTEGER,
    discord_token_encrypted TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookup by user
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON public.instances(user_id);

-- Index for security code lookup
CREATE INDEX IF NOT EXISTS idx_instances_security_code ON public.instances(security_code);

-- ============================================================
-- INSTANCE PLUGINS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.instance_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookup by instance
CREATE INDEX IF NOT EXISTS idx_instance_plugins_instance_id ON public.instance_plugins(instance_id);

-- Unique constraint on plugin name per instance
CREATE UNIQUE INDEX IF NOT EXISTS idx_instance_plugins_unique ON public.instance_plugins(instance_id, name);

-- ============================================================
-- INSTANCE API KEYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.instance_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Index for faster lookup by instance
CREATE INDEX IF NOT EXISTS idx_instance_api_keys_instance_id ON public.instance_api_keys(instance_id);

-- ============================================================
-- AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    instance_id UUID REFERENCES public.instances(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookup by user
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);

-- Index for faster lookup by instance
CREATE INDEX IF NOT EXISTS idx_audit_log_instance_id ON public.audit_log(instance_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on instances
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own instances
CREATE POLICY "Users can manage own instances"
    ON public.instances
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Enable RLS on instance_plugins
ALTER TABLE public.instance_plugins ENABLE ROW LEVEL SECURITY;

-- Users can manage plugins for their own instances
CREATE POLICY "Users can manage plugins for own instances"
    ON public.instance_plugins
    FOR ALL
    USING (
        instance_id IN (
            SELECT id FROM public.instances WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        instance_id IN (
            SELECT id FROM public.instances WHERE user_id = auth.uid()
        )
    );

-- Enable RLS on instance_api_keys
ALTER TABLE public.instance_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can manage API keys for their own instances
CREATE POLICY "Users can manage API keys for own instances"
    ON public.instance_api_keys
    FOR ALL
    USING (
        instance_id IN (
            SELECT id FROM public.instances WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        instance_id IN (
            SELECT id FROM public.instances WHERE user_id = auth.uid()
        )
    );

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON public.audit_log
    FOR SELECT
    USING (user_id = auth.uid());

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for instances table
DROP TRIGGER IF EXISTS update_instances_updated_at ON public.instances;
CREATE TRIGGER update_instances_updated_at
    BEFORE UPDATE ON public.instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.instances IS 'HoloBridge hosting instances, one per user account';
COMMENT ON TABLE public.instance_plugins IS 'Plugins installed on each HoloBridge instance';
COMMENT ON TABLE public.instance_api_keys IS 'API keys for authenticating with HoloBridge instances';
COMMENT ON TABLE public.audit_log IS 'Audit log of all actions performed on instances';
