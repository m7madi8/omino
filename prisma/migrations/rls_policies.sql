-- OMINO Phase 1: Row Level Security policies
-- Apply after Prisma migration. Requires PostgreSQL.
-- Note: Application-level tenant checks remain primary; RLS is defense-in-depth.

-- Enable RLS on tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;

-- Helper: set org context per request (call from API via SET LOCAL)
-- SELECT set_config('app.current_organization_id', '<uuid>', true);

CREATE OR REPLACE FUNCTION app_current_organization_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Organizations: members can read their org
CREATE POLICY org_member_select ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Memberships: users see memberships in their orgs
CREATE POLICY membership_org_isolation ON memberships
  FOR ALL
  USING (
    organization_id = app_current_organization_id()
    OR user_id = current_setting('app.current_user_id', true)::uuid
  );

-- Stores: scoped to organization
CREATE POLICY store_org_isolation ON stores
  FOR ALL
  USING (organization_id = app_current_organization_id());

-- Branches: scoped via store's organization
CREATE POLICY branch_org_isolation ON branches
  FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE organization_id = app_current_organization_id()
    )
  );

-- Roles: org-scoped
CREATE POLICY role_org_isolation ON roles
  FOR ALL
  USING (
    organization_id IS NULL
    OR organization_id = app_current_organization_id()
  );

-- User contexts: own row only
CREATE POLICY user_context_own ON user_contexts
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true)::uuid);
