-- ============================================================
-- Nexus CRM – Multi-Tenant Shared-Schema Database
-- ============================================================
-- Run: psql -U postgres -d nexus_crm -f 001_initial_schema.sql
-- ============================================================

-- Tenants (one per company / organization)
CREATE TABLE IF NOT EXISTS tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,   -- used for subdomains e.g. acme.nexuscrm.com
    plan        VARCHAR(50)  NOT NULL DEFAULT 'free',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Users (sales reps, admins – always scoped to a tenant)
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL,
    password_hash TEXT        NOT NULL,
    name          VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'member', -- admin | member
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Composite unique: same email can exist across tenants, not within one
    CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);

-- Contacts (leads / customers managed by this tenant)
CREATE TABLE IF NOT EXISTS contacts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255),
    phone       VARCHAR(50),
    company     VARCHAR(255),
    status      VARCHAR(50)  NOT NULL DEFAULT 'lead', -- lead | prospect | customer | churned
    assigned_to UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Deals (sales opportunities in a pipeline)
CREATE TABLE IF NOT EXISTS deals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id    UUID         NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    value         NUMERIC(15,2) NOT NULL DEFAULT 0,
    stage         VARCHAR(50)  NOT NULL DEFAULT 'prospecting',
    -- Stages: prospecting | qualification | proposal | negotiation | closed_won | closed_lost
    created_by    UUID         NOT NULL REFERENCES users(id),
    assigned_to   UUID         REFERENCES users(id) ON DELETE SET NULL,
    expected_close DATE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Prevent cross-tenant contact references (extra safety guard)
    CONSTRAINT deals_contact_tenant_check CHECK (tenant_id IS NOT NULL)
);

-- Activities (calls, emails, meetings logged against deals/contacts)
CREATE TABLE IF NOT EXISTS activities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    deal_id     UUID         REFERENCES deals(id) ON DELETE CASCADE,
    contact_id  UUID         REFERENCES contacts(id) ON DELETE CASCADE,
    type        VARCHAR(50)  NOT NULL, -- call | email | meeting | note
    notes       TEXT,
    created_by  UUID         NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES – critical for multi-tenant performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_tenant_id      ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id   ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_tenant_id      ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact        ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal      ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact   ON activities(contact_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_tenants   BEFORE UPDATE ON tenants   FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER set_updated_at_users     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER set_updated_at_contacts  BEFORE UPDATE ON contacts  FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER set_updated_at_deals     BEFORE UPDATE ON deals     FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TRIGGER set_updated_at_activities BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
