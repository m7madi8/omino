-- OMINO Phase 4: RLS policies for orders, payments, commerce tables
-- Apply after Prisma migration: psql $DATABASE_URL -f prisma/migrations/rls_phase4_policies.sql

ALTER TABLE registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY register_org_isolation ON registers
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY pos_session_org_isolation ON pos_sessions
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY customer_org_isolation ON customers
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY cart_org_isolation ON carts
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY cart_item_org_isolation ON cart_items
  FOR ALL USING (
    cart_id IN (SELECT id FROM carts WHERE organization_id = app_current_organization_id())
  );

CREATE POLICY order_org_isolation ON orders
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY order_item_org_isolation ON order_items
  FOR ALL USING (
    order_id IN (SELECT id FROM orders WHERE organization_id = app_current_organization_id())
  );

CREATE POLICY order_adjustment_org_isolation ON order_adjustments
  FOR ALL USING (
    order_id IN (SELECT id FROM orders WHERE organization_id = app_current_organization_id())
  );

CREATE POLICY order_number_seq_org_isolation ON order_number_sequences
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY payment_org_isolation ON payments
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY payment_attempt_org_isolation ON payment_attempts
  FOR ALL USING (
    payment_id IN (SELECT id FROM payments WHERE organization_id = app_current_organization_id())
  );

CREATE POLICY refund_org_isolation ON refunds
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY refund_item_org_isolation ON refund_items
  FOR ALL USING (
    refund_id IN (SELECT id FROM refunds WHERE organization_id = app_current_organization_id())
  );

CREATE POLICY order_event_org_isolation ON order_events
  FOR ALL USING (organization_id = app_current_organization_id());

CREATE POLICY audit_log_org_isolation ON audit_logs
  FOR ALL USING (organization_id = app_current_organization_id());
