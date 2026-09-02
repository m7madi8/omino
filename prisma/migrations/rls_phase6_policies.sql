-- OMINO Phase 6: RLS policies for CRM tables
-- Apply after Prisma migration: psql $DATABASE_URL -f prisma/migrations/rls_phase6_policies.sql

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_address_org_isolation ON customer_addresses
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY customer_tag_org_isolation ON customer_tags
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY customer_tag_assignment_org_isolation ON customer_tag_assignments
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE organization_id = app_current_organization_id())
  );

CREATE POLICY customer_note_org_isolation ON customer_notes
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY customer_event_org_isolation ON customer_events
  FOR ALL USING (organization_id = app_current_organization_id());
