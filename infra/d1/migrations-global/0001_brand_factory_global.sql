-- OMDALA Brand Factory — global schema (D1 / SQLite)
-- Entities: ADR-002 + G4 domain model (20 core entities)
-- Apply to: omdala-global-staging (and production omdala_global)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('global', 'country_operator')),
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name_en TEXT NOT NULL,
  name_local TEXT NOT NULL,
  locale TEXT NOT NULL,
  currency TEXT NOT NULL,
  timezone TEXT NOT NULL,
  phone_code TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_countries_tenant_id ON countries(tenant_id);

CREATE TABLE IF NOT EXISTS administrative_regions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  country_id TEXT NOT NULL REFERENCES countries(id),
  parent_id TEXT REFERENCES administrative_regions(id),
  level INTEGER NOT NULL,
  name_en TEXT NOT NULL,
  name_local TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_admin_regions_tenant_id ON administrative_regions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_regions_country_id ON administrative_regions(country_id);

CREATE TABLE IF NOT EXISTS local_nodes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  region_id TEXT NOT NULL REFERENCES administrative_regions(id),
  name TEXT NOT NULL,
  geo_lat REAL,
  geo_lng REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_local_nodes_tenant_id ON local_nodes(tenant_id);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  country_id TEXT NOT NULL REFERENCES countries(id),
  owner_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'suspended')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (tenant_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_brands_tenant_id ON brands(tenant_id);

CREATE TABLE IF NOT EXISTS owners (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL,
  brand_id TEXT NOT NULL REFERENCES brands(id),
  role TEXT NOT NULL CHECK (role IN ('primary', 'manager', 'staff')),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  verified_at INTEGER,
  consent_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_owners_tenant_id ON owners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_owners_user_id ON owners(user_id);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  owner_id TEXT NOT NULL REFERENCES owners(id),
  type TEXT NOT NULL CHECK (type IN ('data_usage', 'image_rights', 'marketing', 'ai_generation')),
  granted INTEGER NOT NULL DEFAULT 0 CHECK (granted IN (0, 1)),
  granted_at INTEGER,
  revoked_at INTEGER,
  evidence_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_consents_tenant_id ON consents(tenant_id);

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  local_node_id TEXT NOT NULL REFERENCES local_nodes(id),
  brand_id TEXT NOT NULL REFERENCES brands(id),
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country_id TEXT NOT NULL REFERENCES countries(id),
  geo_lat REAL,
  geo_lng REAL,
  phone TEXT,
  website TEXT,
  hours_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_places_tenant_id ON places(tenant_id);
CREATE INDEX IF NOT EXISTS idx_places_brand_id ON places(brand_id);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  brand_id TEXT NOT NULL REFERENCES brands(id),
  place_id TEXT REFERENCES places(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (tenant_id, brand_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  brand_id TEXT NOT NULL REFERENCES brands(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (tenant_id, brand_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_experiences_tenant_id ON experiences(tenant_id);

CREATE TABLE IF NOT EXISTS image_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  brand_id TEXT NOT NULL REFERENCES brands(id),
  place_id TEXT REFERENCES places(id),
  r2_key TEXT NOT NULL,
  alt_text TEXT,
  provenance TEXT NOT NULL CHECK (provenance IN ('owner_submitted', 'ai_generated', 'stock')),
  rights_status TEXT NOT NULL DEFAULT 'pending' CHECK (rights_status IN ('cleared', 'pending', 'denied')),
  consent_id TEXT REFERENCES consents(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_image_assets_tenant_id ON image_assets(tenant_id);

CREATE TABLE IF NOT EXISTS compliance_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  country_id TEXT NOT NULL REFERENCES countries(id),
  type TEXT NOT NULL CHECK (type IN ('gdpr', 'pdpa', 'data_localization')),
  requirements_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_compliance_profiles_tenant_id ON compliance_profiles(tenant_id);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  brand_id TEXT NOT NULL REFERENCES brands(id),
  place_id TEXT REFERENCES places(id),
  product_id TEXT REFERENCES products(id),
  experience_id TEXT REFERENCES experiences(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'responded', 'closed')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_inquiries_tenant_id ON inquiries(tenant_id);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  brand_id TEXT NOT NULL REFERENCES brands(id),
  locale TEXT NOT NULL,
  theme_json TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'published', 'unpublished')),
  published_at INTEGER,
  unpublished_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON sites(tenant_id);

CREATE TABLE IF NOT EXISTS domain_bindings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  site_id TEXT NOT NULL REFERENCES sites(id),
  domain TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  ssl_status TEXT,
  UNIQUE (tenant_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_domain_bindings_tenant_id ON domain_bindings(tenant_id);

CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'place', 'product', 'experience')),
  entity_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (tenant_id, entity_type, entity_id, locale, field)
);
CREATE INDEX IF NOT EXISTS idx_translations_tenant_id ON translations(tenant_id);

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('intake', 'content', 'seo', 'schema', 'preview', 'qa')),
  input_json TEXT,
  output_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  cost_cents INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER,
  completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant_id ON agent_runs(tenant_id);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  agent_run_id TEXT NOT NULL REFERENCES agent_runs(id),
  approver_id TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 0 CHECK (approved IN (0, 1)),
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_approvals_tenant_id ON approvals(tenant_id);

CREATE TABLE IF NOT EXISTS evidence_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_evidence_logs_tenant_id ON evidence_logs(tenant_id);

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  site_id TEXT NOT NULL REFERENCES sites(id),
  version INTEGER NOT NULL,
  commit_sha TEXT,
  published_at INTEGER,
  rolled_back_at INTEGER,
  rollback_reason TEXT,
  UNIQUE (tenant_id, site_id, version)
);
CREATE INDEX IF NOT EXISTS idx_releases_tenant_id ON releases(tenant_id);
