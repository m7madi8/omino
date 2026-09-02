-- Phase 9: Automation tables RLS policies

ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_events_tenant ON business_events
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY automations_tenant ON automations
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY automation_versions_tenant ON automation_versions
  USING (
    automation_id IN (
      SELECT id FROM automations
      WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
    )
  );

CREATE POLICY automation_executions_tenant ON automation_executions
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY automation_execution_steps_tenant ON automation_execution_steps
  USING (
    execution_id IN (
      SELECT id FROM automation_executions
      WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
    )
  );

CREATE POLICY automation_scheduled_jobs_tenant ON automation_scheduled_jobs
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY internal_notifications_tenant ON internal_notifications
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);
