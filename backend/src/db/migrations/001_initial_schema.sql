PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    plan        TEXT NOT NULL DEFAULT 'free',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    tenant_id     TEXT NOT NULL,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'member',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS contacts (
    id          TEXT PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    company     TEXT,
    status      TEXT NOT NULL DEFAULT 'lead',
    assigned_to TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS deals (
    id            TEXT PRIMARY KEY,
    tenant_id     TEXT NOT NULL,
    contact_id    TEXT NOT NULL,
    title         TEXT NOT NULL,
    value         REAL NOT NULL DEFAULT 0,
    stage         TEXT NOT NULL DEFAULT 'prospecting',
    created_by    TEXT NOT NULL,
    assigned_to   TEXT,
    expected_close TEXT,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deals_contact_tenant_check CHECK (tenant_id IS NOT NULL),
    CONSTRAINT fk_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_create FOREIGN KEY(created_by) REFERENCES users(id),
    CONSTRAINT fk_user_assign FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activities (
    id          TEXT PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    deal_id     TEXT,
    contact_id  TEXT,
    type        TEXT NOT NULL,
    notes       TEXT,
    created_by  TEXT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_deal FOREIGN KEY(deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_create FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id      ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id   ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_tenant_id      ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact        ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal      ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact   ON activities(contact_id);

-- Updated at triggers for SQLite (since function-based triggers from postgres don't map directly)
CREATE TRIGGER IF NOT EXISTS trigger_tenants_updated_at AFTER UPDATE ON tenants BEGIN UPDATE tenants SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at AFTER UPDATE ON users BEGIN UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trigger_contacts_updated_at AFTER UPDATE ON contacts BEGIN UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trigger_deals_updated_at AFTER UPDATE ON deals BEGIN UPDATE deals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trigger_activities_updated_at AFTER UPDATE ON activities BEGIN UPDATE activities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
